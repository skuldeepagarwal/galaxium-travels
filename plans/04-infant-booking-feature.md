# Infant Booking Feature - Implementation Plan

## Executive Summary

**Feature**: Enable parents to book interplanetary flights with infants (0-2 years)  
**Options**: Lap infant (10% fare) or Infant seat (50% fare)  
**Impact**: Expands customer base to families with young children  
**Complexity**: Medium - requires data model changes, API updates, and UI enhancements

---

## 1. Current System Analysis

### Architecture Overview
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **Frontend**: React + TypeScript + Vite
- **Current Booking Model**: Adult passengers only, seat class selection (Economy/Business/Galaxium)

### Key Extension Points Identified
1. **Database Models** ([`models.py`](../booking_system_backend/models.py))
   - `Booking` table can be extended with passenger details
   - No breaking changes to existing `Flight` or `User` tables needed

2. **API Schemas** ([`schemas.py`](../booking_system_backend/schemas.py))
   - `BookingRequest` can accept passenger list
   - `BookingOut` can include passenger details

3. **Business Logic** ([`services/booking.py`](../booking_system_backend/services/booking.py))
   - `book_flight()` function handles pricing and validation
   - Seat availability logic already supports class-based tracking

4. **Frontend Types** ([`types/index.ts`](../booking_system_frontend/src/types/index.ts))
   - Type-safe interfaces for passenger data
   - Existing `SEAT_CLASS_CONFIGS` pattern can extend to passenger types

---

## 2. Data Model Design

### 2.1 Passenger Type Enumeration

```python
# Backend: schemas.py
class PassengerType(str, Enum):
    ADULT = "adult"
    LAP_INFANT = "lap_infant"      # 0-2 years, 10% fare, no seat
    INFANT_SEAT = "infant_seat"    # 0-2 years, 50% fare, occupies seat
```

```typescript
// Frontend: types/index.ts
export type PassengerType = 'adult' | 'lap_infant' | 'infant_seat';
```

### 2.2 Passenger Information Schema

```python
# Backend: schemas.py
class PassengerInfo(BaseModel):
    passenger_type: PassengerType
    age: Optional[int] = None  # Required for infants (0-2)
    name: Optional[str] = None  # Optional for infants
```

```typescript
// Frontend: types/index.ts
export interface PassengerInfo {
  passenger_type: PassengerType;
  age?: number;  // Required for infants
  name?: string; // Optional for infants
}
```

### 2.3 Database Schema Changes

**New Table: `passengers`**
```sql
CREATE TABLE passengers (
    passenger_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    passenger_type VARCHAR(20) NOT NULL CHECK(passenger_type IN ('adult', 'lap_infant', 'infant_seat')),
    age INTEGER CHECK(age >= 0 AND age <= 150),
    name VARCHAR(255),
    price_paid INTEGER NOT NULL CHECK(price_paid >= 0),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

CREATE INDEX idx_passengers_booking_id ON passengers(booking_id);
CREATE INDEX idx_passengers_type ON passengers(passenger_type);
```

**Rationale**: 
- Separate table allows multiple passengers per booking
- Maintains historical pricing per passenger
- Enables future expansion (children, seniors, etc.)
- No changes to existing `bookings` table structure

---

## 3. Pricing Rules & Calculations

### 3.1 Pricing Formula

```
Adult Price = base_price × seat_class_multiplier
  - Economy: base_price × 1.0
  - Business: base_price × 2.5
  - Galaxium: base_price × 4.0

Lap Infant Price = Adult Price × 0.10
Infant Seat Price = Adult Price × 0.50
```

### 3.2 Examples

**Scenario 1**: Economy class, base_price = $1000
- Adult: $1000 × 1.0 = $1000
- Lap infant: $1000 × 0.10 = $100
- Infant seat: $1000 × 0.50 = $500
- **Total (1 adult + 1 lap infant)**: $1100

**Scenario 2**: Business class, base_price = $1000
- Adult: $1000 × 2.5 = $2500
- Lap infant: $2500 × 0.10 = $250
- Infant seat: $2500 × 0.50 = $1250
- **Total (1 adult + 1 infant seat)**: $3750

**Scenario 3**: Galaxium class, base_price = $1000
- Adult: $1000 × 4.0 = $4000
- Lap infant: $4000 × 0.10 = $400
- Infant seat: $4000 × 0.50 = $2000
- **Total (1 adult + 1 lap infant)**: $4400

### 3.3 Pricing Helper Function

```python
# Backend: services/booking.py
def calculate_passenger_price(
    base_price: int,
    seat_class: str,
    passenger_type: str
) -> int:
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
```

---

## 4. Validation Rules

### 4.1 Business Rules

1. **Infant Age Validation**
   - Infants must be 0-2 years old (inclusive)
   - Age is required for infant passenger types
   - Error: "Infant age must be between 0 and 2 years"

2. **Lap Infant Limit**
   - Maximum 1 lap infant per adult passenger
   - Error: "Maximum 1 lap infant allowed per adult"

3. **Adult Requirement**
   - At least 1 adult required per booking
   - Cannot book infant-only tickets
   - Error: "At least one adult passenger is required"

4. **Seat Availability**
   - Infant seats count toward seat availability
   - Lap infants do NOT reduce seat availability
   - Check availability before confirming booking

5. **Passenger Count**
   - Total passengers (adults + infant seats) ≤ available seats
   - Lap infants excluded from seat count

### 4.2 Validation Implementation

```python
# Backend: services/booking.py
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
    
    # Rule 2: Validate infant ages
    for p in passengers:
        if p.passenger_type in ["lap_infant", "infant_seat"]:
            if p.age is None:
                return False, "Age is required for infant passengers"
            if not (0 <= p.age <= 2):
                return False, "Infant age must be between 0 and 2 years"
    
    # Rule 3: Max 1 lap infant per adult
    if lap_infants > adults:
        return False, "Maximum 1 lap infant allowed per adult"
    
    # Rule 4: Check seat availability (adults + infant seats)
    seats_needed = adults + infant_seats
    if seats_needed > available_seats:
        return False, f"Not enough seats available. Need {seats_needed}, have {available_seats}"
    
    return True, None
```

---

## 5. API Specifications

### 5.1 Updated Booking Request

**Endpoint**: `POST /bookings`

**Request Body**:
```json
{
  "user_id": 1,
  "name": "John Doe",
  "flight_id": 5,
  "seat_class": "business",
  "passengers": [
    {
      "passenger_type": "adult",
      "name": "John Doe"
    },
    {
      "passenger_type": "lap_infant",
      "age": 1,
      "name": "Baby Doe"
    }
  ]
}
```

**Response** (Success):
```json
{
  "booking_id": 123,
  "user_id": 1,
  "flight_id": 5,
  "seat_class": "business",
  "price_paid": 2750,
  "status": "booked",
  "booking_time": "2026-05-13T14:00:00Z",
  "passengers": [
    {
      "passenger_id": 456,
      "passenger_type": "adult",
      "name": "John Doe",
      "price_paid": 2500
    },
    {
      "passenger_id": 457,
      "passenger_type": "lap_infant",
      "age": 1,
      "name": "Baby Doe",
      "price_paid": 250
    }
  ]
}
```

**Response** (Error):
```json
{
  "success": false,
  "error": "Maximum 1 lap infant allowed per adult",
  "error_code": "INVALID_PASSENGER_COUNT",
  "details": "You have 2 lap infants but only 1 adult passenger"
}
```

### 5.2 Backward Compatibility

**Default Behavior**: If `passengers` field is omitted, assume 1 adult passenger
```json
{
  "user_id": 1,
  "name": "John Doe",
  "flight_id": 5,
  "seat_class": "economy"
}
```
Equivalent to:
```json
{
  "user_id": 1,
  "name": "John Doe",
  "flight_id": 5,
  "seat_class": "economy",
  "passengers": [
    {
      "passenger_type": "adult",
      "name": "John Doe"
    }
  ]
}
```

---

## 6. Frontend UI/UX Design

### 6.1 Booking Flow Enhancement

```
Current Flow:
1. Browse flights
2. Select seat class
3. Click "Book Now"
4. Enter name/email (if not logged in)
5. Confirm booking

New Flow:
1. Browse flights
2. Select seat class
3. Click "Book Now"
4. Enter name/email (if not logged in)
5. **[NEW] Add passengers (adults + infants)**
6. **[NEW] Select infant options (lap vs. seat)**
7. **[NEW] Review total price breakdown**
8. Confirm booking
```

### 6.2 Passenger Selector Component

**New Component**: `PassengerSelector.tsx`

**Features**:
- Add/remove adult passengers (default: 1, min: 1)
- Add/remove infant passengers (default: 0, max: adults)
- Toggle infant type (lap vs. seat)
- Age input for infants (0-2 validation)
- Optional name input for infants
- Real-time price calculation
- Visual indicators for lap infant limit

**UI Mockup**:
```
┌─────────────────────────────────────────┐
│ Passengers                              │
├─────────────────────────────────────────┤
│ Adults                            [1] ▼ │
│                                         │
│ Infants (0-2 years)               [1] ▼ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Infant 1                            │ │
│ │ ○ Lap Infant (10% fare)             │ │
│ │ ● Infant Seat (50% fare)            │ │
│ │ Age: [1] years                      │ │
│ │ Name (optional): [Baby Doe]         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Price Breakdown:                        │
│ • 1 Adult (Business): $2,500            │
│ • 1 Infant Seat: $1,250                 │
│ ─────────────────────────────────────── │
│ Total: $3,750                           │
└─────────────────────────────────────────┘
```

### 6.3 Flight Card Updates

**Display infant pricing options**:
```
Economy Class: $1,000
├─ Lap Infant: +$100
└─ Infant Seat: +$500

Business Class: $2,500
├─ Lap Infant: +$250
└─ Infant Seat: +$1,250

Galaxium Class: $4,000
├─ Lap Infant: +$400
└─ Infant Seat: +$2,000
```

### 6.4 My Bookings Updates

**Display passenger breakdown**:
```
Booking #123 - Earth → Mars
Business Class
Passengers:
  • John Doe (Adult) - $2,500
  • Baby Doe (Infant Seat, 1 year) - $1,250
Total Paid: $3,750
Status: Booked
```

---

## 7. Implementation Checklist

### 7.1 Backend Changes

#### Phase 1: Database & Models
- [ ] Create `passengers` table migration
- [ ] Add `Passenger` model to [`models.py`](../booking_system_backend/models.py)
- [ ] Add foreign key relationship: `Booking.passengers`
- [ ] Update [`seed.py`](../booking_system_backend/seed.py) with sample infant bookings

#### Phase 2: Schemas & Validation
- [ ] Add `PassengerType` enum to [`schemas.py`](../booking_system_backend/schemas.py)
- [ ] Create `PassengerInfo` schema
- [ ] Create `PassengerOut` schema
- [ ] Update `BookingRequest` to include `passengers: list[PassengerInfo]`
- [ ] Update `BookingOut` to include `passengers: list[PassengerOut]`
- [ ] Add `validate_passengers()` function

#### Phase 3: Business Logic
- [ ] Add `calculate_passenger_price()` to [`services/booking.py`](../booking_system_backend/services/booking.py)
- [ ] Update `book_flight()` to handle passenger list
- [ ] Implement passenger validation logic
- [ ] Update seat availability logic (infant seats count, lap infants don't)
- [ ] Update `cancel_booking()` to handle passenger cleanup
- [ ] Update `get_bookings()` to include passenger details

#### Phase 4: API Endpoints
- [ ] Update `POST /bookings` endpoint in [`server.py`](../booking_system_backend/server.py)
- [ ] Ensure backward compatibility (default to 1 adult if passengers omitted)
- [ ] Add error handling for passenger validation
- [ ] Update API documentation

#### Phase 5: Testing
- [ ] Unit tests for `calculate_passenger_price()`
- [ ] Unit tests for `validate_passengers()`
- [ ] Integration tests for booking with infants
- [ ] Test lap infant limit enforcement
- [ ] Test seat availability with infant seats
- [ ] Test backward compatibility (no passengers field)

### 7.2 Frontend Changes

#### Phase 1: Types & Constants
- [ ] Add `PassengerType` to [`types/index.ts`](../booking_system_frontend/src/types/index.ts)
- [ ] Add `PassengerInfo` interface
- [ ] Update `BookingRequest` interface
- [ ] Update `Booking` interface to include passengers
- [ ] Add passenger type configurations (icons, labels, pricing)

#### Phase 2: Components
- [ ] Create `PassengerSelector.tsx` component
- [ ] Create `InfantOptionSelector.tsx` component
- [ ] Create `PassengerSummary.tsx` component
- [ ] Update [`BookingModal.tsx`](../booking_system_frontend/src/components/bookings/BookingModal.tsx) to include passenger selector
- [ ] Update [`FlightCard.tsx`](../booking_system_frontend/src/components/flights/FlightCard.tsx) to show infant pricing

#### Phase 3: API Integration
- [ ] Update `createBooking()` in [`api.ts`](../booking_system_frontend/src/services/api.ts)
- [ ] Add passenger data to booking request
- [ ] Handle passenger validation errors
- [ ] Update booking response parsing

#### Phase 4: Pages
- [ ] Update [`Flights.tsx`](../booking_system_frontend/src/pages/Flights.tsx) booking flow
- [ ] Update [`MyBookings.tsx`](../booking_system_frontend/src/pages/MyBookings.tsx) to display passengers
- [ ] Add passenger breakdown in booking cards

#### Phase 5: Utilities
- [ ] Add `calculatePassengerPrice()` helper
- [ ] Add `validatePassengerList()` helper
- [ ] Add `formatPassengerType()` formatter
- [ ] Update price formatting for passenger breakdown

#### Phase 6: Testing
- [ ] Component tests for `PassengerSelector`
- [ ] Test infant age validation (0-2 years)
- [ ] Test lap infant limit (max 1 per adult)
- [ ] Test seat availability calculation
- [ ] Test price calculation accuracy
- [ ] Test booking flow end-to-end
- [ ] Test backward compatibility

---

## 8. Test Scenarios

### 8.1 Happy Path Scenarios

**Test 1: Book with lap infant**
- Given: 1 adult, 1 lap infant (age 1)
- When: Book Economy class flight
- Then: 
  - Booking created successfully
  - Adult price: $1000
  - Infant price: $100
  - Total: $1100
  - Seat availability decreases by 1 (adult only)

**Test 2: Book with infant seat**
- Given: 1 adult, 1 infant seat (age 2)
- When: Book Business class flight
- Then:
  - Booking created successfully
  - Adult price: $2500
  - Infant price: $1250
  - Total: $3750
  - Seat availability decreases by 2 (adult + infant)

**Test 3: Book with multiple adults and lap infant**
- Given: 2 adults, 1 lap infant (age 0)
- When: Book Galaxium class flight
- Then:
  - Booking created successfully
  - Adult 1 price: $4000
  - Adult 2 price: $4000
  - Infant price: $400
  - Total: $8400
  - Seat availability decreases by 2 (adults only)

### 8.2 Validation Error Scenarios

**Test 4: Exceed lap infant limit**
- Given: 1 adult, 2 lap infants
- When: Attempt to book
- Then: Error "Maximum 1 lap infant allowed per adult"

**Test 5: Invalid infant age**
- Given: 1 adult, 1 lap infant (age 3)
- When: Attempt to book
- Then: Error "Infant age must be between 0 and 2 years"

**Test 6: No adult passenger**
- Given: 0 adults, 1 infant seat
- When: Attempt to book
- Then: Error "At least one adult passenger is required"

**Test 7: Insufficient seats**
- Given: 2 adults, 2 infant seats, only 3 seats available
- When: Attempt to book
- Then: Error "Not enough seats available. Need 4, have 3"

### 8.3 Edge Cases

**Test 8: Backward compatibility**
- Given: Booking request without passengers field
- When: Submit booking
- Then: Defaults to 1 adult passenger, booking succeeds

**Test 9: Cancel booking with infants**
- Given: Existing booking with 1 adult + 1 infant seat
- When: Cancel booking
- Then: 
  - Booking status = cancelled
  - Seat availability restored by 2
  - All passenger records marked as cancelled

**Test 10: Mixed infant types**
- Given: 2 adults, 1 lap infant, 1 infant seat
- When: Book flight
- Then:
  - Booking succeeds
  - Seat availability decreases by 3 (2 adults + 1 infant seat)
  - Correct pricing for each passenger type

---

## 9. Acceptance Criteria

### Must Have (MVP)
- ✅ Parents can add infants (0-2 years) to bookings
- ✅ Two infant options: lap infant (10% fare) or infant seat (50% fare)
- ✅ Maximum 1 lap infant per adult enforced
- ✅ Infant seats reduce seat availability, lap infants don't
- ✅ Age validation (0-2 years) for infants
- ✅ Price breakdown shows per-passenger costs
- ✅ My Bookings displays passenger details
- ✅ Backward compatible with existing bookings

### Should Have (Phase 2)
- ⏳ Infant name field (optional)
- ⏳ Multiple infants per booking (twins/triplets)
- ⏳ Infant baggage allowance information
- ⏳ Special requests (bassinet, baby meal)

### Could Have (Future)
- 💡 Child passengers (2-12 years) at 75% fare
- 💡 Family seating preferences
- 💡 Age-appropriate amenities by class
- 💡 Infant travel tips and guidelines

---

## 10. Risks & Mitigation

### Risk 1: Database Migration Complexity
**Impact**: High  
**Probability**: Medium  
**Mitigation**: 
- Use SQLAlchemy migrations
- Test on copy of production data
- Implement rollback plan
- Add backward compatibility layer

### Risk 2: Seat Availability Calculation Errors
**Impact**: High  
**Probability**: Low  
**Mitigation**:
- Comprehensive unit tests
- Integration tests with various scenarios
- Manual QA testing
- Monitor booking errors post-launch

### Risk 3: UI Complexity Increases Booking Friction
**Impact**: Medium  
**Probability**: Medium  
**Mitigation**:
- Default to 1 adult (no infants) for simplicity
- Progressive disclosure (show infant options only when needed)
- Clear visual hierarchy
- User testing before launch

### Risk 4: Age Verification Relies on Honesty
**Impact**: Low  
**Probability**: High  
**Mitigation**:
- Clear terms & conditions
- Age verification at check-in (out of scope for MVP)
- Monitor for abuse patterns
- Add ID verification in Phase 2

---

## 11. Success Metrics

### Primary Metrics (30 days post-launch)
- **Infant booking adoption**: ≥15% of bookings include infant
- **Lap vs. seat preference**: Track ratio (hypothesis: 70% lap, 30% seat)
- **Average booking value**: Increase by $50-200 per infant booking

### Secondary Metrics
- **Booking completion rate**: Maintain ≥95% (ensure no friction added)
- **Cancellation rate**: No increase from baseline
- **Support tickets**: <5% related to infant booking confusion

### Guardrail Metrics
- **API error rate**: <1% for infant bookings
- **Seat availability accuracy**: 100% (no overbooking)
- **Price calculation accuracy**: 100% (no pricing errors)

---

## 12. Timeline Estimate

### Phase 1: Backend (3-4 days)
- Day 1: Database schema + models
- Day 2: Schemas + validation logic
- Day 3: Business logic + API updates
- Day 4: Testing + bug fixes

### Phase 2: Frontend (4-5 days)
- Day 1: Types + passenger selector component
- Day 2: Booking modal integration
- Day 3: Flight card + My Bookings updates
- Day 4: API integration + error handling
- Day 5: Testing + polish

### Phase 3: QA & Launch (2-3 days)
- Day 1: Integration testing
- Day 2: User acceptance testing
- Day 3: Bug fixes + deployment

**Total Estimate**: 9-12 days

---

## 13. Next Steps

1. **Review & Approve Plan**: Stakeholder sign-off on requirements
2. **Create Detailed Tasks**: Break down into Jira/GitHub issues
3. **Backend Implementation**: Start with database schema
4. **Frontend Implementation**: Parallel development after API ready
5. **Testing**: Comprehensive test coverage
6. **Deployment**: Staged rollout with monitoring

---

## 14. Open Questions

1. **Should we allow modifying passengers after booking?**
   - Recommendation: No for MVP, add in Phase 2

2. **What happens if adult cancels but wants to keep infant?**
   - Recommendation: Not allowed, infants must travel with adult

3. **Do we need infant-specific terms & conditions?**
   - Recommendation: Yes, add to booking confirmation

4. **Should lap infant limit be per booking or per adult?**
   - Recommendation: Per adult (allows 2 adults + 2 lap infants)

5. **How to handle infant age verification?**
   - Recommendation: Honor system for MVP, ID check at gate (out of scope)

---

**Created**: 2026-05-13  
**Version**: 1.0  
**Status**: Ready for Review  
**Next Action**: Stakeholder approval → Switch to Code mode for implementation