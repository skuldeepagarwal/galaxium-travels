"""
Database migration script to add the passengers table.
Run this script to update the database schema for infant booking feature.
"""

from sqlalchemy import create_engine, text
from db import SQLALCHEMY_DATABASE_URL

def migrate():
    """Add passengers table to the database."""
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    
    with engine.connect() as conn:
        # Check if passengers table already exists
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='passengers'"
        ))
        
        if result.fetchone():
            print("[OK] Passengers table already exists. No migration needed.")
            return
        
        print("Creating passengers table...")
        
        # Create passengers table
        conn.execute(text("""
            CREATE TABLE passengers (
                passenger_id INTEGER PRIMARY KEY AUTOINCREMENT,
                booking_id INTEGER NOT NULL,
                passenger_type VARCHAR(20) NOT NULL CHECK(passenger_type IN ('adult', 'lap_infant', 'infant_seat')),
                age INTEGER CHECK(age >= 0 AND age <= 150),
                name VARCHAR(255),
                price_paid INTEGER NOT NULL CHECK(price_paid >= 0),
                FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
            )
        """))
        
        # Create indexes
        conn.execute(text(
            "CREATE INDEX idx_passengers_booking_id ON passengers(booking_id)"
        ))
        conn.execute(text(
            "CREATE INDEX idx_passengers_type ON passengers(passenger_type)"
        ))
        
        conn.commit()
        print("[OK] Passengers table created successfully!")
        print("[OK] Indexes created successfully!")
        print("\nMigration complete! The database is now ready for infant bookings.")

if __name__ == "__main__":
    print("=" * 60)
    print("Database Migration: Add Passengers Table")
    print("=" * 60)
    migrate()
    print("=" * 60)

# Made with Bob
