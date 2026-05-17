# Seat Classes Implementation Plan - Overview

## Feature Summary

Implement three distinct seat classes for Galaxium Travels booking system:
- **Economy Class**: Standard seating with basic amenities
- **Business Class**: Enhanced comfort with premium services
- **Galaxium Class**: Luxury experience with exclusive benefits

---

## Current System Analysis

### Backend (Python/FastAPI)
**Current State:**
- Single `Flight` model with unified pricing
- Single `seats_available` field (no class differentiation)
- Simple booking model without seat class tracking

**Files to Modify:**
- [`models.py`](../booking_system_backend/models.py) - Add seat class fields
- [`schemas.py`](../booking_system_backend/schemas.py) - Update Pydantic models
- [`server.py`](../booking_system_backend/server.py) - Update API endpoints
- [`services/flight.py`](../booking_system_backend/services/flight.py) - Add class-based logic
- [`services/booking.py`](../booking_system_backend/services/booking.py) - Handle class selection
- [`seed.py`](../booking_system_backend/seed.py) - Update seed data

### Frontend (React/TypeScript)
**Current State:**
- Single price display per flight
- No seat class selection UI
- Basic booking flow without class options

**Files to Modify:**
- [`types/index.ts`](../booking_system_frontend/src/types/index.ts) - Add seat class types
- [`pages/Flights.tsx`](../booking_system_frontend/src/pages/Flights.tsx) - Display class options
- [`components/flights/FlightCard.tsx`](../booking_system_frontend/src/components/flights/FlightCard.tsx) - Show class pricing
- [`components/bookings/BookingModal.tsx`](../booking_system_frontend/src/components/bookings/BookingModal.tsx) - Add class selector
- [`services/api.ts`](../booking_system_frontend/src/services/api.ts) - Update API calls

---

## Implementation Strategy

### Phase 1: Database & Backend Models
1. Extend `Flight` model with class-specific fields
2. Update `Booking` model to track selected seat class
3. Create database migration strategy
4. Update seed data with class information

### Phase 2: Backend API & Business Logic
1. Modify flight endpoints to return class data
2. Update booking endpoints to accept seat class
3. Implement class-based availability checking
4. Add validation for class selection

### Phase 3: Frontend Types & UI Components
1. Update TypeScript interfaces
2. Create seat class selector component
3. Enhance flight card to display all classes
4. Update booking modal with class selection

### Phase 4: Testing & Validation
1. Test class-based booking flow
2. Verify availability calculations
3. Test edge cases (sold out classes, etc.)
4. Update existing tests

---

## Seat Class Specifications

### Economy Class
- **Price Multiplier**: 1.0x (base price)
- **Seat Allocation**: 60% of total seats
- **Amenities**: Standard seating, basic meal service
- **Color Theme**: Blue (#2196F3)
- **Icon**: 💺

### Business Class
- **Price Multiplier**: 2.5x base price
- **Seat Allocation**: 30% of total seats
- **Amenities**: Extra legroom, premium meals, priority boarding
- **Color Theme**: Purple (#9C27B0)
- **Icon**: 🛋️

### Galaxium Class
- **Price Multiplier**: 4.0x base price
- **Seat Allocation**: 10% of total seats
- **Amenities**: Luxury pods, gourmet dining, lounge access, concierge service
- **Color Theme**: Gold (#FFD700)
- **Icon**: ✨

---

## Data Model Changes

### Flight Model (Before)
```python
class Flight:
    flight_id: int
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    price: int              # Single price
    seats_available: int    # Total seats
```

### Flight Model (After)
```python
class Flight:
    flight_id: int
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    base_price: int                    # Base price for Economy
    economy_seats_available: int       # Economy seats
    business_seats_available: int      # Business seats
    galaxium_seats_available: int      # Galaxium seats
    economy_seats_total: int           # Total Economy seats
    business_seats_total: int          # Total Business seats
    galaxium_seats_total: int          # Total Galaxium seats
```

### Booking Model (Before)
```python
class Booking:
    booking_id: int
    user_id: int
    flight_id: int
    status: str
    booking_time: str
```

### Booking Model (After)
```python
class Booking:
    booking_id: int
    user_id: int
    flight_id: int
    seat_class: str         # 'economy', 'business', 'galaxium'
    price_paid: int         # Actual price paid
    status: str
    booking_time: str
```

---

## API Changes

### GET /flights
**Before:**
```json
{
  "flight_id": 1,
  "origin": "Earth",
  "destination": "Mars",
  "price": 1000,
  "seats_available": 50
}
```

**After:**
```json
{
  "flight_id": 1,
  "origin": "Earth",
  "destination": "Mars",
  "base_price": 1000,
  "seat_classes": {
    "economy": {
      "price": 1000,
      "available": 30,
      "total": 60
    },
    "business": {
      "price": 2500,
      "available": 15,
      "total": 30
    },
    "galaxium": {
      "price": 4000,
      "available": 5,
      "total": 10
    }
  }
}
```

### POST /bookings
**Before:**
```json
{
  "user_id": 1,
  "flight_id": 1
}
```

**After:**
```json
{
  "user_id": 1,
  "flight_id": 1,
  "seat_class": "business"
}
```

---

## Migration Strategy

### Option 1: Backward Compatible (Recommended)
1. Add new fields with default values
2. Keep `price` and `seats_available` for backward compatibility
3. Gradually migrate to new fields
4. Deprecate old fields in future version

### Option 2: Breaking Change
1. Remove old fields immediately
2. Update all existing data
3. Requires frontend/backend deployment coordination

**Recommendation**: Use Option 1 for smoother transition

---

## Success Criteria

- [ ] Users can view all three seat classes for each flight
- [ ] Users can select their preferred class during booking
- [ ] Prices are correctly calculated based on class
- [ ] Seat availability is tracked per class
- [ ] Bookings are prevented when a class is sold out
- [ ] Existing bookings continue to work (backward compatibility)
- [ ] UI clearly differentiates between classes
- [ ] Mobile responsive design maintained

---

## Risk Assessment

### High Risk
- **Database Migration**: Existing bookings need proper handling
- **Backward Compatibility**: Old API clients may break

### Medium Risk
- **UI Complexity**: More information to display per flight
- **Performance**: Additional database queries for class data

### Low Risk
- **Testing**: Existing test suite needs updates
- **Documentation**: API docs need updating

---

## Timeline Estimate

- **Phase 1 (Backend Models)**: 2-3 hours
- **Phase 2 (Backend API)**: 3-4 hours
- **Phase 3 (Frontend)**: 4-5 hours
- **Phase 4 (Testing)**: 2-3 hours
- **Total**: 11-15 hours

---

## Next Steps

1. Review this plan with stakeholders
2. Proceed to [Backend Implementation Plan](./02-backend-implementation.md)
3. Proceed to [Frontend Implementation Plan](./03-frontend-implementation.md)

---

**Created**: 2026-05-13  
**Version**: 1.0  
**Status**: Draft