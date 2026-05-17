try:
    from sqlalchemy import CheckConstraint, Column, ForeignKey, Integer, String
    from sqlalchemy.orm import declarative_base
except ImportError as exc:
    raise ImportError(
        "SQLAlchemy is required for booking_system_backend.models. "
        "Install backend dependencies with: pip install -r booking_system_backend/requirements.txt"
    ) from exc

Base = declarative_base()


class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)


class Flight(Base):
    __tablename__ = 'flights'
    __table_args__ = (
        CheckConstraint('base_price >= 0', name='ck_flights_base_price_non_negative'),
        CheckConstraint('economy_seats_available >= 0', name='ck_flights_economy_available_non_negative'),
        CheckConstraint('business_seats_available >= 0', name='ck_flights_business_available_non_negative'),
        CheckConstraint('galaxium_seats_available >= 0', name='ck_flights_galaxium_available_non_negative'),
        CheckConstraint('economy_seats_total >= 0', name='ck_flights_economy_total_non_negative'),
        CheckConstraint('business_seats_total >= 0', name='ck_flights_business_total_non_negative'),
        CheckConstraint('galaxium_seats_total >= 0', name='ck_flights_galaxium_total_non_negative'),
        CheckConstraint('economy_seats_available <= economy_seats_total', name='ck_flights_economy_available_within_total'),
        CheckConstraint('business_seats_available <= business_seats_total', name='ck_flights_business_available_within_total'),
        CheckConstraint('galaxium_seats_available <= galaxium_seats_total', name='ck_flights_galaxium_available_within_total'),
        CheckConstraint("(price IS NULL) OR (price >= 0)", name='ck_flights_price_non_negative'),
        CheckConstraint("(seats_available IS NULL) OR (seats_available >= 0)", name='ck_flights_seats_available_non_negative'),
    )

    flight_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure_time = Column(String, nullable=False)
    arrival_time = Column(String, nullable=False)

    # Base economy price
    base_price = Column(Integer, nullable=False)

    # Seat availability by class
    economy_seats_available = Column(Integer, nullable=False, default=0)
    business_seats_available = Column(Integer, nullable=False, default=0)
    galaxium_seats_available = Column(Integer, nullable=False, default=0)

    # Total seats by class
    economy_seats_total = Column(Integer, nullable=False, default=0)
    business_seats_total = Column(Integer, nullable=False, default=0)
    galaxium_seats_total = Column(Integer, nullable=False, default=0)

    # Deprecated: kept for backward compatibility
    price = Column(Integer, nullable=True)  # Defaults to base_price in seed/response formatting
    seats_available = Column(Integer, nullable=True)  # Sum of all available classes


class Booking(Base):
    __tablename__ = 'bookings'
    __table_args__ = (
        CheckConstraint(
            "seat_class IN ('economy', 'business', 'galaxium')",
            name='ck_bookings_valid_seat_class'
        ),
        CheckConstraint('price_paid >= 0', name='ck_bookings_price_paid_non_negative'),
    )

    booking_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), nullable=False, index=True)
    flight_id = Column(Integer, ForeignKey('flights.flight_id'), nullable=False, index=True)
    status = Column(String, nullable=False)
    booking_time = Column(String, nullable=False)

    # Seat class selection
    seat_class = Column(String, nullable=False, default='economy')

    # Price paid at booking time for historical accuracy
    price_paid = Column(Integer, nullable=False, default=0)


class Passenger(Base):
    __tablename__ = 'passengers'
    __table_args__ = (
        CheckConstraint(
            "passenger_type IN ('adult', 'lap_infant', 'infant_seat')",
            name='ck_passengers_valid_type'
        ),
        CheckConstraint('age >= 0 AND age <= 150', name='ck_passengers_valid_age'),
        CheckConstraint('price_paid >= 0', name='ck_passengers_price_paid_non_negative'),
    )

    passenger_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey('bookings.booking_id', ondelete='CASCADE'), nullable=False, index=True)
    passenger_type = Column(String, nullable=False)
    age = Column(Integer, nullable=True)  # Required for infants, optional for adults
    name = Column(String, nullable=True)  # Optional for all passengers
    price_paid = Column(Integer, nullable=False)  # Price paid for this specific passenger


# Made with Bob
