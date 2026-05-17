from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from enum import Enum


class SeatClass(str, Enum):
    """Valid seat class values"""
    ECONOMY = "economy"
    BUSINESS = "business"
    GALAXIUM = "galaxium"


class PassengerType(str, Enum):
    """Valid passenger type values"""
    ADULT = "adult"
    LAP_INFANT = "lap_infant"
    INFANT_SEAT = "infant_seat"


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


class FlightOut(BaseModel):
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


class PassengerInfo(BaseModel):
    """Information about a passenger for booking"""
    passenger_type: PassengerType
    age: Optional[int] = None  # Required for infants (0-2)
    name: Optional[str] = None  # Optional for all passengers

    @field_validator('age')
    @classmethod
    def validate_infant_age(cls, v, info):
        """Validate that infant age is between 0-2 years"""
        passenger_type = info.data.get('passenger_type')
        if passenger_type in [PassengerType.LAP_INFANT, PassengerType.INFANT_SEAT]:
            if v is None:
                raise ValueError('Age is required for infant passengers')
            if not (0 <= v <= 2):
                raise ValueError('Infant age must be between 0 and 2 years')
        return v


class PassengerOut(BaseModel):
    """Passenger information in booking response"""
    passenger_id: int
    passenger_type: str
    age: Optional[int] = None
    name: Optional[str] = None
    price_paid: int

    class Config:
        from_attributes = True


class BookingRequest(BaseModel):
    """Schema for creating a booking"""
    user_id: int
    name: str
    flight_id: int
    seat_class: SeatClass = Field(default=SeatClass.ECONOMY)
    passengers: Optional[list[PassengerInfo]] = None  # Optional for backward compatibility


class BookingOut(BaseModel):
    """Enhanced booking response"""
    booking_id: int
    user_id: int
    flight_id: int
    seat_class: str
    price_paid: int
    status: str
    booking_time: str
    passengers: Optional[list[PassengerOut]] = None  # Include passenger details

    class Config:
        from_attributes = True


class UserRegistration(BaseModel):
    name: str
    email: EmailStr


class UserOut(BaseModel):
    user_id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    error_code: str
    details: Optional[str] = None

# Made with Bob
