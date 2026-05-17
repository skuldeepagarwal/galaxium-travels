from sqlalchemy.orm import Session
from datetime import datetime
from typing import cast, Optional
from models import User, Flight, Booking, Passenger
from schemas import BookingOut, ErrorResponse, PassengerInfo, PassengerOut, PassengerType
from services.flight import (
    check_seat_availability,
    decrement_seat_availability,
    increment_seat_availability,
    calculate_class_price
)


def calculate_passenger_price(base_price: int, seat_class: str, passenger_type: str) -> int:
    """Calculate price for a passenger based on type and seat class."""
    # Get adult price for the seat class
    adult_price = calculate_class_price(base_price, seat_class)
    
    # Apply passenger type multiplier
    if passenger_type == "adult":
        return adult_price
    elif passenger_type == "lap_infant":
        return int(adult_price * 0.10)
    elif passenger_type == "infant_seat":
        return int(adult_price * 0.50)
    else:
        raise ValueError(f"Invalid passenger type: {passenger_type}")


def validate_passengers(
    passengers: list[PassengerInfo],
    available_seats: int
) -> tuple[bool, Optional[str]]:
    """Validate passenger list against business rules."""
    
    # Count passenger types
    adults = sum(1 for p in passengers if p.passenger_type == "adult")
    lap_infants = sum(1 for p in passengers if p.passenger_type == "lap_infant")
    infant_seats = sum(1 for p in passengers if p.passenger_type == "infant_seat")
    
    # Rule 1: At least one adult required
    if adults == 0:
        return False, "At least one adult passenger is required"
    
    # Rule 2: Validate infant ages (already validated by Pydantic, but double-check)
    for p in passengers:
        if p.passenger_type in ["lap_infant", "infant_seat"]:
            if p.age is None:
                return False, "Age is required for infant passengers"
            if not (0 <= p.age <= 2):
                return False, "Infant age must be between 0 and 2 years"
    
    # Rule 3: Max 1 lap infant per adult
    if lap_infants > adults:
        return False, "Maximum 1 lap infant allowed per adult"
    
    # Rule 4: Check seat availability (adults + infant seats, lap infants don't count)
    seats_needed = adults + infant_seats
    if seats_needed > available_seats:
        return False, f"Not enough seats available. Need {seats_needed}, have {available_seats}"
    
    return True, None


def book_flight(
    db: Session,
    user_id: int,
    name: str,
    flight_id: int,
    seat_class: str = 'economy',
    passengers: Optional[list[PassengerInfo]] = None
) -> BookingOut | ErrorResponse:
    """Book a seat on a specific flight for a user with seat class selection and passenger details."""
    # Validate seat class
    valid_classes = ['economy', 'business', 'galaxium']
    if seat_class not in valid_classes:
        return ErrorResponse(
            error="Invalid seat class",
            error_code="INVALID_SEAT_CLASS",
            details=f"Seat class must be one of: {', '.join(valid_classes)}. Received: {seat_class}"
        )
    
    # Check flight exists
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        return ErrorResponse(
            error="Flight not found",
            error_code="FLIGHT_NOT_FOUND",
            details=f"The specified flight_id {flight_id} does not exist in our system. Please check the flight_id or use list_flights to see available flights."
        )

    # Check user exists and name matches
    user = db.query(User).filter(User.user_id == user_id, User.name == name).first()
    if not user:
        existing_user = db.query(User).filter(User.user_id == user_id).first()
        if existing_user:
            return ErrorResponse(
                error="Name mismatch",
                error_code="NAME_MISMATCH",
                details=f"User ID {user_id} exists but the name '{name}' does not match the registered name '{existing_user.name}'. Please verify the user's name or use the correct name for this user ID."
            )
        else:
            return ErrorResponse(
                error="User not found",
                error_code="USER_NOT_FOUND",
                details=f"User with ID {user_id} is not registered in our system. The user might need to register first, or you may need to check if the user_id is correct."
            )

    # Handle backward compatibility: if no passengers provided, default to 1 adult
    if passengers is None or len(passengers) == 0:
        passengers = [PassengerInfo(passenger_type=PassengerType.ADULT, name=name)]
    
    # Get available seats for the selected class
    if seat_class == 'economy':
        available_seats = cast(int, flight.economy_seats_available)
    elif seat_class == 'business':
        available_seats = cast(int, flight.business_seats_available)
    elif seat_class == 'galaxium':
        available_seats = cast(int, flight.galaxium_seats_available)
    else:
        available_seats = 0
    
    # Validate passengers
    is_valid, error_message = validate_passengers(passengers, available_seats)
    if not is_valid:
        return ErrorResponse(
            error=error_message or "Invalid passenger configuration",
            error_code="INVALID_PASSENGERS",
            details=error_message
        )
    
    # Calculate total price and seats needed
    total_price = 0
    seats_to_decrement = 0
    passenger_prices = []
    
    for passenger in passengers:
        passenger_price = calculate_passenger_price(
            cast(int, flight.base_price),
            seat_class,
            passenger.passenger_type.value
        )
        total_price += passenger_price
        passenger_prices.append(passenger_price)
        
        # Count seats needed (adults + infant_seat, lap_infant doesn't count)
        if passenger.passenger_type in ["adult", "infant_seat"]:
            seats_to_decrement += 1

    # Create booking
    new_booking = Booking(
        user_id=user_id,
        flight_id=flight_id,
        seat_class=seat_class,
        price_paid=total_price,
        status="booked",
        booking_time=datetime.utcnow().isoformat()
    )
    db.add(new_booking)
    db.flush()  # Get booking_id before creating passengers
    
    # Create passenger records
    passenger_records = []
    for passenger_info, price in zip(passengers, passenger_prices):
        passenger_record = Passenger(
            booking_id=new_booking.booking_id,
            passenger_type=passenger_info.passenger_type.value,
            age=passenger_info.age,
            name=passenger_info.name,
            price_paid=price
        )
        db.add(passenger_record)
        passenger_records.append(passenger_record)
    
    # Decrement seat availability for the selected class
    try:
        for _ in range(seats_to_decrement):
            decrement_seat_availability(db, flight_id, seat_class)
    except ValueError as e:
        db.rollback()
        return ErrorResponse(
            error=str(e),
            error_code="SEAT_DECREMENT_FAILED",
            details=f"Failed to decrement seat availability: {str(e)}"
        )
    
    # Also update backward compatibility fields
    if flight.seats_available is not None:
        setattr(flight, 'seats_available', cast(int, flight.seats_available) - seats_to_decrement)
    
    db.commit()
    db.refresh(new_booking)
    
    # Refresh passenger records and convert to PassengerOut
    passenger_outs = []
    for passenger_record in passenger_records:
        db.refresh(passenger_record)
        passenger_outs.append(PassengerOut.model_validate(passenger_record))
    
    # Create response with passengers
    booking_out = BookingOut.model_validate(new_booking)
    booking_out.passengers = passenger_outs
    
    return booking_out


def cancel_booking(db: Session, booking_id: int) -> BookingOut | ErrorResponse:
    """Cancel an existing booking by its booking_id."""
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        return ErrorResponse(
            error="Booking not found",
            error_code="BOOKING_NOT_FOUND",
            details=f"Booking with ID {booking_id} not found. The booking may have been deleted or the booking_id may be incorrect. Please verify the booking_id or check if the booking exists."
        )

    if cast(str, booking.status) == "cancelled":
        return ErrorResponse(
            error="Booking already cancelled",
            error_code="ALREADY_CANCELLED",
            details=f"Booking {booking_id} is already cancelled and cannot be cancelled again. The booking status is currently '{booking.status}'. If you need to make changes, please contact support."
        )

    # Get passengers to calculate seats to restore
    passengers = db.query(Passenger).filter(Passenger.booking_id == booking_id).all()
    seats_to_restore = sum(1 for p in passengers if p.passenger_type in ["adult", "infant_seat"])
    
    # If no passengers found (old booking), restore 1 seat for backward compatibility
    if not passengers:
        seats_to_restore = 1

    # Restore seats for the specific class
    flight = db.query(Flight).filter(Flight.flight_id == booking.flight_id).first()
    if flight:
        try:
            for _ in range(seats_to_restore):
                increment_seat_availability(db, cast(int, booking.flight_id), cast(str, booking.seat_class))
        except ValueError as e:
            db.rollback()
            return ErrorResponse(
                error=str(e),
                error_code="SEAT_INCREMENT_FAILED",
                details=f"Failed to restore seat availability: {str(e)}"
            )
        
        # Also update backward compatibility field
        if flight.seats_available is not None:
            setattr(flight, 'seats_available', cast(int, flight.seats_available) + seats_to_restore)

    setattr(booking, 'status', "cancelled")
    db.commit()
    db.refresh(booking)
    
    # Include passengers in response
    passenger_outs = [PassengerOut.model_validate(p) for p in passengers]
    booking_out = BookingOut.model_validate(booking)
    booking_out.passengers = passenger_outs if passenger_outs else None
    
    return booking_out


def get_bookings(db: Session, user_id: int) -> list[BookingOut]:
    """Retrieve all bookings for a specific user with passenger details."""
    bookings = db.query(Booking).filter(Booking.user_id == user_id).all()
    
    result = []
    for booking in bookings:
        # Get passengers for this booking
        passengers = db.query(Passenger).filter(Passenger.booking_id == booking.booking_id).all()
        passenger_outs = [PassengerOut.model_validate(p) for p in passengers]
        
        booking_out = BookingOut.model_validate(booking)
        booking_out.passengers = passenger_outs if passenger_outs else None
        result.append(booking_out)
    
    return result

# Made with Bob
