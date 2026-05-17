from typing import cast
from sqlalchemy.orm import Session
from models import Flight
from schemas import FlightOut

# Price multipliers for each class
SEAT_CLASS_MULTIPLIERS = {
    'economy': 1.0,
    'business': 2.5,
    'galaxium': 4.0
}


def calculate_class_price(base_price: int, seat_class: str) -> int:
    """Calculate price for a specific seat class"""
    multiplier = SEAT_CLASS_MULTIPLIERS.get(seat_class, 1.0)
    return int(base_price * multiplier)


def get_seat_class_info(flight, seat_class: str) -> dict:
    """Get seat information for a specific class"""
    if seat_class == 'economy':
        return {
            'price': calculate_class_price(flight.base_price, 'economy'),
            'available': flight.economy_seats_available,
            'total': flight.economy_seats_total,
            'multiplier': 1.0
        }
    elif seat_class == 'business':
        return {
            'price': calculate_class_price(flight.base_price, 'business'),
            'available': flight.business_seats_available,
            'total': flight.business_seats_total,
            'multiplier': 2.5
        }
    elif seat_class == 'galaxium':
        return {
            'price': calculate_class_price(flight.base_price, 'galaxium'),
            'available': flight.galaxium_seats_available,
            'total': flight.galaxium_seats_total,
            'multiplier': 4.0
        }
    else:
        raise ValueError(f"Invalid seat class: {seat_class}")


def format_flight_response(flight) -> dict:
    """Format flight with seat class information"""
    return {
        'flight_id': flight.flight_id,
        'origin': flight.origin,
        'destination': flight.destination,
        'departure_time': flight.departure_time,
        'arrival_time': flight.arrival_time,
        'base_price': flight.base_price,
        'seat_classes': {
            'economy': get_seat_class_info(flight, 'economy'),
            'business': get_seat_class_info(flight, 'business'),
            'galaxium': get_seat_class_info(flight, 'galaxium')
        },
        # Backward compatibility
        'price': flight.base_price,
        'seats_available': (
            flight.economy_seats_available +
            flight.business_seats_available +
            flight.galaxium_seats_available
        )
    }


def check_seat_availability(db: Session, flight_id: int, seat_class: str) -> bool:
    """Check if seats are available for a specific class"""
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        return False
    
    if seat_class == 'economy':
        return cast(int, flight.economy_seats_available) > 0
    elif seat_class == 'business':
        return cast(int, flight.business_seats_available) > 0
    elif seat_class == 'galaxium':
        return cast(int, flight.galaxium_seats_available) > 0
    
    return False


def decrement_seat_availability(db: Session, flight_id: int, seat_class: str):
    """Decrement available seats for a specific class"""
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        raise ValueError("Flight not found")
    
    if seat_class == 'economy':
        available = cast(int, flight.economy_seats_available)
        if available <= 0:
            raise ValueError("No economy seats available")
        flight.economy_seats_available = available - 1  # type: ignore[assignment]
    elif seat_class == 'business':
        available = cast(int, flight.business_seats_available)
        if available <= 0:
            raise ValueError("No business seats available")
        flight.business_seats_available = available - 1  # type: ignore[assignment]
    elif seat_class == 'galaxium':
        available = cast(int, flight.galaxium_seats_available)
        if available <= 0:
            raise ValueError("No galaxium seats available")
        flight.galaxium_seats_available = available - 1  # type: ignore[assignment]
    else:
        raise ValueError(f"Invalid seat class: {seat_class}")
    
    db.commit()


def increment_seat_availability(db: Session, flight_id: int, seat_class: str):
    """Increment available seats for a specific class (for cancellations)"""
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        raise ValueError("Flight not found")
    
    if seat_class == 'economy':
        available = cast(int, flight.economy_seats_available)
        total = cast(int, flight.economy_seats_total)
        if available >= total:
            raise ValueError("Cannot exceed total economy seats")
        flight.economy_seats_available = available + 1  # type: ignore[assignment]
    elif seat_class == 'business':
        available = cast(int, flight.business_seats_available)
        total = cast(int, flight.business_seats_total)
        if available >= total:
            raise ValueError("Cannot exceed total business seats")
        flight.business_seats_available = available + 1  # type: ignore[assignment]
    elif seat_class == 'galaxium':
        available = cast(int, flight.galaxium_seats_available)
        total = cast(int, flight.galaxium_seats_total)
        if available >= total:
            raise ValueError("Cannot exceed total galaxium seats")
        flight.galaxium_seats_available = available + 1  # type: ignore[assignment]
    else:
        raise ValueError(f"Invalid seat class: {seat_class}")
    
    db.commit()


def list_flights(db: Session) -> list[dict]:
    """List all available flights with seat class information"""
    flights = db.query(Flight).all()
    return [format_flight_response(flight) for flight in flights]

# Made with Bob
