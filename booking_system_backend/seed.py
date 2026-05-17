from models import Base, User, Flight, Booking, Passenger
from db import engine, SessionLocal
from datetime import datetime, timedelta
import random

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Clear existing data
    db.query(Passenger).delete()
    db.query(Booking).delete()
    db.query(User).delete()
    db.query(Flight).delete()
    db.commit()
    
    # Add demo users
    users = [
        User(name="Alice", email="alice@example.com"),
        User(name="Bob", email="bob@example.com"),
        User(name="Charlie", email="charlie@galaxium.com"),
        User(name="Diana", email="diana@moonmail.com"),
        User(name="Eve", email="eve@marsmail.com"),
        User(name="Frank", email="frank@venusmail.com"),
        User(name="Grace", email="grace@jupiter.com"),
        User(name="Heidi", email="heidi@europa.com"),
        User(name="Ivan", email="ivan@asteroidbelt.com"),
        User(name="Judy", email="judy@pluto.com"),
    ]
    db.add_all(users)
    db.commit()
    
    # Add demo flights with seat class information
    flights_data = [
        {
            'origin': 'Earth', 'destination': 'Mars',
            'departure_time': '2099-01-01T09:00:00Z', 'arrival_time': '2099-01-01T17:00:00Z',
            'base_price': 1000000,
            'economy_total': 60, 'business_total': 30, 'galaxium_total': 10
        },
        {
            'origin': 'Earth', 'destination': 'Moon',
            'departure_time': '2099-01-02T10:00:00Z', 'arrival_time': '2099-01-02T14:00:00Z',
            'base_price': 500000,
            'economy_total': 50, 'business_total': 25, 'galaxium_total': 5
        },
        {
            'origin': 'Mars', 'destination': 'Earth',
            'departure_time': '2099-01-03T12:00:00Z', 'arrival_time': '2099-01-03T20:00:00Z',
            'base_price': 950000,
            'economy_total': 70, 'business_total': 35, 'galaxium_total': 15
        },
        {
            'origin': 'Venus', 'destination': 'Earth',
            'departure_time': '2099-01-04T08:00:00Z', 'arrival_time': '2099-01-04T18:00:00Z',
            'base_price': 1200000,
            'economy_total': 40, 'business_total': 20, 'galaxium_total': 5
        },
        {
            'origin': 'Jupiter', 'destination': 'Europa',
            'departure_time': '2099-01-05T15:00:00Z', 'arrival_time': '2099-01-05T19:00:00Z',
            'base_price': 2000000,
            'economy_total': 30, 'business_total': 15, 'galaxium_total': 5
        },
        {
            'origin': 'Earth', 'destination': 'Venus',
            'departure_time': '2099-01-06T07:00:00Z', 'arrival_time': '2099-01-06T15:00:00Z',
            'base_price': 1100000,
            'economy_total': 55, 'business_total': 28, 'galaxium_total': 7
        },
        {
            'origin': 'Moon', 'destination': 'Mars',
            'departure_time': '2099-01-07T11:00:00Z', 'arrival_time': '2099-01-07T19:00:00Z',
            'base_price': 800000,
            'economy_total': 65, 'business_total': 32, 'galaxium_total': 8
        },
        {
            'origin': 'Mars', 'destination': 'Jupiter',
            'departure_time': '2099-01-08T13:00:00Z', 'arrival_time': '2099-01-08T23:00:00Z',
            'base_price': 2500000,
            'economy_total': 45, 'business_total': 22, 'galaxium_total': 8
        },
        {
            'origin': 'Europa', 'destination': 'Earth',
            'departure_time': '2099-01-09T09:00:00Z', 'arrival_time': '2099-01-09T21:00:00Z',
            'base_price': 3000000,
            'economy_total': 50, 'business_total': 25, 'galaxium_total': 10
        },
        {
            'origin': 'Earth', 'destination': 'Pluto',
            'departure_time': '2099-01-10T06:00:00Z', 'arrival_time': '2099-01-11T06:00:00Z',
            'base_price': 5000000,
            'economy_total': 35, 'business_total': 18, 'galaxium_total': 7
        },
    ]
    
    flights = []
    for data in flights_data:
        flight = Flight(
            origin=data['origin'],
            destination=data['destination'],
            departure_time=data['departure_time'],
            arrival_time=data['arrival_time'],
            base_price=data['base_price'],
            economy_seats_total=data['economy_total'],
            business_seats_total=data['business_total'],
            galaxium_seats_total=data['galaxium_total'],
            economy_seats_available=data['economy_total'],
            business_seats_available=data['business_total'],
            galaxium_seats_available=data['galaxium_total'],
            # Backward compatibility
            price=data['base_price'],
            seats_available=data['economy_total'] + data['business_total'] + data['galaxium_total']
        )
        flights.append(flight)
    
    db.add_all(flights)
    db.commit()
    
    # Add demo bookings with seat classes
    user_ids = [user.user_id for user in db.query(User).all()]
    flight_ids = [flight.flight_id for flight in db.query(Flight).all()]
    statuses = ["booked", "cancelled", "completed"]
    seat_classes = ["economy", "business", "galaxium"]
    
    bookings = []
    now = datetime.utcnow()
    
    for i in range(20):
        user_id = random.choice(user_ids)
        flight_id = random.choice(flight_ids)
        status = random.choice(statuses)
        seat_class = random.choice(seat_classes)
        booking_time = (now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))).isoformat() + "Z"
        
        # Get flight to calculate price
        flight = db.query(Flight).filter(Flight.flight_id == flight_id).first()
        if flight:
            # Calculate price based on seat class
            multipliers = {'economy': 1.0, 'business': 2.5, 'galaxium': 4.0}
            # Type checker doesn't recognize SQLAlchemy column access returns int at runtime
            base_price_value: int = flight.base_price  # type: ignore[assignment]
            price_paid = int(base_price_value * multipliers[seat_class])
            
            bookings.append(Booking(
                user_id=user_id,
                flight_id=flight_id,
                seat_class=seat_class,
                price_paid=price_paid,
                status=status,
                booking_time=booking_time
            ))
    
    db.add_all(bookings)
    db.commit()
    
    # Add sample bookings with infants
    print("Adding sample infant bookings...")
    
    # Booking 1: Alice with lap infant (Economy)
    alice = db.query(User).filter(User.name == "Alice").first()
    earth_mars = db.query(Flight).filter(Flight.origin == "Earth", Flight.destination == "Mars").first()
    
    if alice and earth_mars:
        booking1 = Booking(
            user_id=alice.user_id,
            flight_id=earth_mars.flight_id,
            seat_class='economy',
            price_paid=1100000,  # 1M (adult) + 100K (lap infant)
            status='booked',
            booking_time=now.isoformat() + "Z"
        )
        db.add(booking1)
        db.flush()
        
        # Add passengers
        db.add(Passenger(
            booking_id=booking1.booking_id,
            passenger_type='adult',
            name='Alice',
            price_paid=1000000
        ))
        db.add(Passenger(
            booking_id=booking1.booking_id,
            passenger_type='lap_infant',
            age=1,
            name='Baby Alice',
            price_paid=100000
        ))
    
    # Booking 2: Bob with infant seat (Business)
    bob = db.query(User).filter(User.name == "Bob").first()
    earth_moon = db.query(Flight).filter(Flight.origin == "Earth", Flight.destination == "Moon").first()
    
    if bob and earth_moon:
        booking2 = Booking(
            user_id=bob.user_id,
            flight_id=earth_moon.flight_id,
            seat_class='business',
            price_paid=1875000,  # 1.25M (adult) + 625K (infant seat)
            status='booked',
            booking_time=now.isoformat() + "Z"
        )
        db.add(booking2)
        db.flush()
        
        # Add passengers
        db.add(Passenger(
            booking_id=booking2.booking_id,
            passenger_type='adult',
            name='Bob',
            price_paid=1250000
        ))
        db.add(Passenger(
            booking_id=booking2.booking_id,
            passenger_type='infant_seat',
            age=2,
            name='Toddler Bob',
            price_paid=625000
        ))
    
    # Booking 3: Charlie with 2 adults and 1 lap infant (Galaxium)
    charlie = db.query(User).filter(User.name == "Charlie").first()
    venus_earth = db.query(Flight).filter(Flight.origin == "Venus", Flight.destination == "Earth").first()
    
    if charlie and venus_earth:
        booking3 = Booking(
            user_id=charlie.user_id,
            flight_id=venus_earth.flight_id,
            seat_class='galaxium',
            price_paid=9680000,  # 4.8M (adult 1) + 4.8M (adult 2) + 480K (lap infant)
            status='booked',
            booking_time=now.isoformat() + "Z"
        )
        db.add(booking3)
        db.flush()
        
        # Add passengers
        db.add(Passenger(
            booking_id=booking3.booking_id,
            passenger_type='adult',
            name='Charlie',
            price_paid=4800000
        ))
        db.add(Passenger(
            booking_id=booking3.booking_id,
            passenger_type='adult',
            name='Partner',
            price_paid=4800000
        ))
        db.add(Passenger(
            booking_id=booking3.booking_id,
            passenger_type='lap_infant',
            age=0,
            name='Newborn Charlie',
            price_paid=480000
        ))
    
    db.commit()
    db.close()
    print("Database seeded with seat class and infant booking demo data!")

if __name__ == "__main__":
    seed()

# Made with Bob
