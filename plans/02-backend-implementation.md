# Backend Implementation Plan - Seat Classes

## Overview

This document details the backend implementation for the three-tier seat class system (Economy, Business, Galaxium) in the Galaxium Travels booking system.

---

## Phase 1: Database Models

### 1.1 Update Flight Model

**File**: [`booking_system_backend/models.py`](../booking_system_backend/models.py)

**Changes Required:**

```python
from sqlalchemy import Column, Integer, String, ForeignKey, Float

class Flight(Base):
    __tablename__ = 'flights'
    
    # Existing fields
    flight_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_time = Column(String, nullable=False)
    arrival_time = Column(String, nullable=False)
    
    # NEW: Base price (Economy price)
    base_price = Column(Integer, nullable=False)
    
    # NEW: Seat availability by class
    economy_seats_available = Column(Integer, nullable=False, default=0)
    business_seats_available = Column(Integer, nullable=False, default=0)
    galaxium_seats_available = Column(Integer, nullable=False, default=0)
    
    # NEW: Total seats by class (for capacity tracking)
    economy_seats_total = Column(Integer, nullable=False, default=0)
    business_seats_total = Column(Integer, nullable=False, default=0)
    galaxium_seats_total = Column(Integer, nullable=False, default=0)
    
    # DEPRECATED: Keep for backward compatibility
    price = Column(Integer, nullable=True)  # Will default to base_price
    seats_available = Column(Integer, nullable=True)  # Will be sum of all classes
```

**Migration Strategy:**
- Add new columns with default values
- Populate from existing data: `base_price = price`, `economy_seats_total = seats_available`
- Set `economy_seats_available = seats_available`
- Calculate business/galaxium seats as 30% and 10% respectively

### 1.2 Update Booking Model

**File**: [`booking_system_backend/models.py`](../booking_system_backend/models.py)

**Changes Required:**

```python
class Booking(Base):
    __tablename__ = 'bookings'
    
    # Existing fields
    booking_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False)
    flight_id = Column(Integer, ForeignKey('flights.flight_id'), nullable=False)
    status = Column(String, nullable=False)
    booking_time = Column(String, nullable=False)
    
    # NEW: Seat class selection
    seat_class = Column(String, nullable=False, default='economy')
    # Values: 'economy', 'business', 'galaxium'
    
    # NEW: Price paid (for historical accuracy)
    price_paid = Column(Integer, nullable=False, default=0)
```

**Migration Strategy:**
- Add `seat_class` with default 'economy' for existing bookings
- Add `price_paid` and populate from flight's base_price for existing bookings

---

## Phase 2: Pydantic Schemas

### 2.1 Update Flight Schemas

**File**: [`booking_system_backend/schemas.py`](../booking_system_backend/schemas.py)

**Add New Schema Classes:**

```python
from pydantic import BaseModel, Field
from typing import Optional

class SeatClassInfo(BaseModel):
    """Information about a specific seat class"""
    price: int = Field(..., description="Price for this class")
    available: int = Field(..., ge=0, description="Available seats")
    total: int = Field(..., ge=0, description="Total seats in this class")
    multiplier: float = Field(..., description="Price multiplier from base")

class FlightSeatClasses(BaseModel):
    """Seat class breakdown for a flight"""
    economy: SeatClassInfo
    business: SeatClassInfo
    galaxium: SeatClassInfo

class FlightResponse(BaseModel):
    """Enhanced flight response with seat classes"""
    flight_id: int
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    base_price: int
    seat_classes: FlightSeatClasses
    
    # Deprecated but kept for backward compatibility
    price: Optional[int] = None
    seats_available: Optional[int] = None
    
    class Config:
        from_attributes = True

class FlightCreate(BaseModel):
    """Schema for creating a new flight"""
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    base_price: int = Field(..., gt=0)
    economy_seats_total: int = Field(..., gt=0)
    business_seats_total: int = Field(..., ge=0)
    galaxium_seats_total: int = Field(..., ge=0)
```

### 2.2 Update Booking Schemas

**File**: [`booking_system_backend/schemas.py`](../booking_system_backend/schemas.py)

**Add/Update Schema Classes:**

```python
from enum import Enum

class SeatClass(str, Enum):
    """Valid seat class values"""
    ECONOMY = "economy"
    BUSINESS = "business"
    GALAXIUM = "galaxium"

class BookingCreate(BaseModel):
    """Schema for creating a booking"""
    user_id: int = Field(..., gt=0)
    flight_id: int = Field(..., gt=0)
    seat_class: SeatClass = Field(default=SeatClass.ECONOMY)

class BookingResponse(BaseModel):
    """Enhanced booking response"""
    booking_id: int
    user_id: int
    flight_id: int
    seat_class: str
    price_paid: int
    status: str
    booking_time: str
    
    class Config:
        from_attributes = True
```

---

## Phase 3: Business Logic

### 3.1 Flight Service Updates

**File**: [`booking_system_backend/services/flight.py`](../booking_system_backend/services/flight.py)

**Add Helper Functions:**

```python
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

def check_seat_availability(db, flight_id: int, seat_class: str) -> bool:
    """Check if seats are available for a specific class"""
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        return False
    
    if seat_class == 'economy':
        return flight.economy_seats_available > 0
    elif seat_class == 'business':
        return flight.business_seats_available > 0
    elif seat_class == 'galaxium':
        return flight.galaxium_seats_available > 0
    
    return False

def decrement_seat_availability(db, flight_id: int, seat_class: str):
    """Decrement available seats for a specific class"""
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        raise ValueError("Flight not found")
    
    if seat_class == 'economy':
        if flight.economy_seats_available <= 0:
            raise ValueError("No economy seats available")
        flight.economy_seats_available -= 1
    elif seat_class == 'business':
        if flight.business_seats_available <= 0:
            raise ValueError("No business seats available")
        flight.business_seats_available -= 1
    elif seat_class == 'galaxium':
        if flight.galaxium_seats_available <= 0:
            raise ValueError("No galaxium seats available")
        flight.galaxium_seats_available -= 1
    else:
        raise ValueError(f"Invalid seat class: {seat_class}")
    
    db.commit()
```

### 3.2 Booking Service Updates

**File**: [`booking_system_backend/services/booking.py`](../booking_system_backend/services/booking.py)

**Update Booking Creation:**

```python
def create_booking(db, user_id: int, flight_id: int, seat_class: str = 'economy'):
    """Create a new booking with seat class selection"""
    from .flight import check_seat_availability, decrement_seat_availability, calculate_class_price
    
    # Validate seat class
    valid_classes = ['economy', 'business', 'galaxium']
    if seat_class not in valid_classes:
        raise ValueError(f"Invalid seat class. Must be one of: {valid_classes}")
    
    # Check availability
    if not check_seat_availability(db, flight_id, seat_class):
        raise ValueError(f"No {seat_class} seats available for this flight")
    
    # Get flight to calculate price
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        raise ValueError("Flight not found")
    
    # Calculate price for selected class
    price_paid = calculate_class_price(flight.base_price, seat_class)
    
    # Create booking
    booking = Booking(
        user_id=user_id,
        flight_id=flight_id,
        seat_class=seat_class,
        price_paid=price_paid,
        status='booked',
        booking_time=datetime.now().isoformat()
    )
    
    db.add(booking)
    
    # Decrement seat availability
    decrement_seat_availability(db, flight_id, seat_class)
    
    db.commit()
    db.refresh(booking)
    
    return booking

def cancel_booking(db, booking_id: int):
    """Cancel a booking and restore seat availability"""
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking:
        raise ValueError("Booking not found")
    
    if booking.status == 'cancelled':
        raise ValueError("Booking already cancelled")
    
    # Restore seat availability
    flight = db.query(Flight).filter(Flight.flight_id == booking.flight_id).first()
    if flight:
        if booking.seat_class == 'economy':
            flight.economy_seats_available += 1
        elif booking.seat_class == 'business':
            flight.business_seats_available += 1
        elif booking.seat_class == 'galaxium':
            flight.galaxium_seats_available += 1
    
    booking.status = 'cancelled'
    db.commit()
    
    return booking
```

---

## Phase 4: API Endpoints

### 4.1 Update Flight Endpoints

**File**: [`booking_system_backend/server.py`](../booking_system_backend/server.py)

**Modify GET /flights:**

```python
@app.get("/flights", response_model=List[FlightResponse])
async def get_flights(db: Session = Depends(get_db)):
    """Get all flights with seat class information"""
    flights = db.query(Flight).all()
    return [format_flight_response(flight) for flight in flights]

@app.get("/flights/{flight_id}", response_model=FlightResponse)
async def get_flight(flight_id: int, db: Session = Depends(get_db)):
    """Get a specific flight with seat class information"""
    flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    return format_flight_response(flight)
```

### 4.2 Update Booking Endpoints

**File**: [`booking_system_backend/server.py`](../booking_system_backend/server.py)

**Modify POST /bookings:**

```python
@app.post("/bookings", response_model=BookingResponse)
async def create_booking_endpoint(
    booking_data: BookingCreate,
    db: Session = Depends(get_db)
):
    """Create a new booking with seat class selection"""
    try:
        booking = create_booking(
            db,
            user_id=booking_data.user_id,
            flight_id=booking_data.flight_id,
            seat_class=booking_data.seat_class
        )
        return booking
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")
```

---

## Phase 5: Database Seeding

### 5.1 Update Seed Data

**File**: [`booking_system_backend/seed.py`](../booking_system_backend/seed.py)

**Update Flight Seeding:**

```python
def seed_flights(db: Session):
    """Seed flights with seat class information"""
    flights_data = [
        {
            'origin': 'Earth',
            'destination': 'Mars',
            'departure_time': '2026-06-01T10:00:00',
            'arrival_time': '2026-06-01T16:00:00',
            'base_price': 1000,
            'economy_seats_total': 60,
            'business_seats_total': 30,
            'galaxium_seats_total': 10
        },
        {
            'origin': 'Mars',
            'destination': 'Jupiter',
            'departure_time': '2026-06-02T08:00:00',
            'arrival_time': '2026-06-02T20:00:00',
            'base_price': 2500,
            'economy_seats_total': 50,
            'business_seats_total': 25,
            'galaxium_seats_total': 5
        },
        # Add more flights...
    ]
    
    for flight_data in flights_data:
        flight = Flight(
            origin=flight_data['origin'],
            destination=flight_data['destination'],
            departure_time=flight_data['departure_time'],
            arrival_time=flight_data['arrival_time'],
            base_price=flight_data['base_price'],
            economy_seats_total=flight_data['economy_seats_total'],
            business_seats_total=flight_data['business_seats_total'],
            galaxium_seats_total=flight_data['galaxium_seats_total'],
            economy_seats_available=flight_data['economy_seats_total'],
            business_seats_available=flight_data['business_seats_total'],
            galaxium_seats_available=flight_data['galaxium_seats_total'],
            # Backward compatibility
            price=flight_data['base_price'],
            seats_available=flight_data['economy_seats_total'] + 
                          flight_data['business_seats_total'] + 
                          flight_data['galaxium_seats_total']
        )
        db.add(flight)
    
    db.commit()
```

---

## Testing Checklist

### Unit Tests
- [ ] Test `calculate_class_price()` with all seat classes
- [ ] Test `get_seat_class_info()` for each class
- [ ] Test `check_seat_availability()` edge cases
- [ ] Test `decrement_seat_availability()` validation
- [ ] Test booking creation with different classes
- [ ] Test booking cancellation restores seats

### Integration Tests
- [ ] Test GET /flights returns correct class data
- [ ] Test POST /bookings with each seat class
- [ ] Test booking when class is sold out
- [ ] Test concurrent bookings don't oversell
- [ ] Test backward compatibility with old API format

### Edge Cases
- [ ] Booking last available seat in a class
- [ ] Cancelling and rebooking
- [ ] Invalid seat class values
- [ ] Negative seat availability
- [ ] Price calculation accuracy

---

## Deployment Steps

1. **Backup Database**: Create backup before migration
2. **Run Migration**: Add new columns with defaults
3. **Populate Data**: Migrate existing data to new structure
4. **Deploy Backend**: Update API with new endpoints
5. **Verify**: Test all endpoints with new structure
6. **Monitor**: Watch for errors in production logs

---

## Rollback Plan

If issues arise:
1. Revert to previous backend version
2. Database columns remain (no data loss)
3. Old API format still works via backward compatibility
4. Fix issues and redeploy

---

**Next**: Proceed to [Frontend Implementation Plan](./03-frontend-implementation.md)

**Created**: 2026-05-13  
**Version**: 1.0  
**Status**: Ready for Implementation