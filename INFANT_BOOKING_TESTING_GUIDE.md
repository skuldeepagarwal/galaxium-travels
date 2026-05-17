# Infant Booking Feature - Testing Guide

## Overview
This guide provides comprehensive testing instructions for the infant booking feature implementation.

## Backend Testing (API)

### 1. Access Swagger UI
Open your browser and navigate to: `http://localhost:8080/docs`

### 2. Test Scenarios

#### Test 1: Book with Lap Infant (Economy)
**Endpoint**: POST /book

**Request Body**:
```json
{
  "user_id": 1,
  "name": "Alice",
  "flight_id": 1,
  "seat_class": "economy",
  "passengers": [
    {
      "passenger_type": "adult",
      "name": "Alice"
    },
    {
      "passenger_type": "lap_infant",
      "age": 1,
      "name": "Baby Alice"
    }
  ]
}
```

**Expected Result**:
- Status: 200 OK
- Response includes booking with 2 passengers
- Adult price: base_price × 1.0
- Lap infant price: adult_price × 0.10
- Total: adult_price + lap_infant_price
- Seat availability decreases by 1 (adult only)

#### Test 2: Book with Infant Seat (Business)
**Request Body**:
```json
{
  "user_id": 2,
  "name": "Bob",
  "flight_id": 2,
  "seat_class": "business",
  "passengers": [
    {
      "passenger_type": "adult",
      "name": "Bob"
    },
    {
      "passenger_type": "infant_seat",
      "age": 2,
      "name": "Toddler Bob"
    }
  ]
}
```

**Expected Result**:
- Status: 200 OK
- Adult price: base_price × 2.5
- Infant seat price: adult_price × 0.50
- Seat availability decreases by 2 (adult + infant seat)

#### Test 3: Book with Multiple Adults and Lap Infant (Galaxium)
**Request Body**:
```json
{
  "user_id": 3,
  "name": "Charlie",
  "flight_id": 3,
  "seat_class": "galaxium",
  "passengers": [
    {
      "passenger_type": "adult",
      "name": "Charlie"
    },
    {
      "passenger_type": "adult",
      "name": "Partner"
    },
    {
      "passenger_type": "lap_infant",
      "age": 0,
      "name": "Newborn"
    }
  ]
}
```

**Expected Result**:
- Status: 200 OK
- 2 adults + 1 lap infant
- Adult price: base_price × 4.0 (each)
- Lap infant price: adult_price × 0.10
- Seat availability decreases by 2 (adults only)

### 3. Validation Tests

#### Test 4: Exceed Lap Infant Limit
**Request Body**:
```json
{
  "user_id": 1,
  "name": "Alice",
  "flight_id": 1,
  "seat_class": "economy",
  "passengers": [
    {
      "passenger_type": "adult"
    },
    {
      "passenger_type": "lap_infant",
      "age": 1
    },
    {
      "passenger_type": "lap_infant",
      "age": 2
    }
  ]
}
```

**Expected Result**:
- Status: 400 Bad Request
- Error: "Maximum 1 lap infant allowed per adult"

#### Test 5: Invalid Infant Age
**Request Body**:
```json
{
  "user_id": 1,
  "name": "Alice",
  "flight_id": 1,
  "seat_class": "economy",
  "passengers": [
    {
      "passenger_type": "adult"
    },
    {
      "passenger_type": "lap_infant",
      "age": 3
    }
  ]
}
```

**Expected Result**:
- Status: 400 Bad Request
- Error: "Infant age must be between 0 and 2 years"

#### Test 6: No Adult Passenger
**Request Body**:
```json
{
  "user_id": 1,
  "name": "Alice",
  "flight_id": 1,
  "seat_class": "economy",
  "passengers": [
    {
      "passenger_type": "infant_seat",
      "age": 1
    }
  ]
}
```

**Expected Result**:
- Status: 400 Bad Request
- Error: "At least one adult passenger is required"

#### Test 7: Backward Compatibility (No Passengers Field)
**Request Body**:
```json
{
  "user_id": 1,
  "name": "Alice",
  "flight_id": 1,
  "seat_class": "economy"
}
```

**Expected Result**:
- Status: 200 OK
- Defaults to 1 adult passenger
- Works exactly as before the feature was added

### 4. View Bookings with Passengers
**Endpoint**: GET /bookings/{user_id}

**Example**: GET /bookings/1

**Expected Result**:
- Returns all bookings for user
- Each booking includes `passengers` array
- Each passenger shows: passenger_id, passenger_type, age, name, price_paid

### 5. Cancel Booking with Passengers
**Endpoint**: POST /cancel/{booking_id}

**Expected Result**:
- Booking status changes to "cancelled"
- Seats restored correctly (adults + infant seats, lap infants excluded)
- Passenger records remain for historical reference

## Frontend Testing (UI)

### 1. Start Frontend
```bash
cd galaxium-travels/booking_system_frontend
npm install
npm run dev
```

### 2. Test Flight Browsing
1. Navigate to Flights page
2. Verify infant pricing is displayed for each seat class:
   - Lap Infant: 10% of adult price
   - Infant Seat: 50% of adult price
3. Prices should update when switching between seat classes

### 3. Test Booking Flow

#### Scenario 1: Book with Lap Infant
1. Click "Book Now" on any flight
2. Select seat class (e.g., Economy)
3. In Passenger Selector:
   - Verify default: 1 Adult
   - Click "+" on Infants counter
   - Select "Lap Infant" option
   - Enter age: 1
   - Optionally enter name
4. Verify price breakdown shows:
   - Adult price
   - Lap infant price (10%)
   - Total price
   - Seats needed: 1
5. Click "Confirm Booking"
6. Verify success message

#### Scenario 2: Book with Infant Seat
1. Follow steps 1-2 above
2. In Passenger Selector:
   - Add 1 infant
   - Select "Infant Seat" option
   - Enter age: 2
4. Verify price breakdown shows:
   - Adult price
   - Infant seat price (50%)
   - Total price
   - Seats needed: 2
5. Confirm booking

#### Scenario 3: Multiple Adults with Lap Infant
1. Add 2 adults
2. Add 1 lap infant
3. Verify:
   - Can add lap infant (1 per adult rule)
   - Price shows 2 adults + 1 lap infant
   - Seats needed: 2

### 4. Test Validation

#### Test: Lap Infant Limit
1. Add 1 adult
2. Try to add 2 lap infants
3. Verify: Second infant button is disabled
4. Error message: "Maximum 1 infant per adult"

#### Test: Infant Age Validation
1. Add infant
2. Enter age: 3
3. Verify: Error message "Infant age must be between 0 and 2 years"
4. Confirm button should be disabled

#### Test: Seat Availability
1. Select a flight with limited seats
2. Add passengers exceeding available seats
3. Verify: Error about insufficient seats
4. Confirm button disabled

### 5. Test My Bookings Page
1. Navigate to My Bookings
2. Find bookings with infants (Alice, Bob, Charlie from seed data)
3. Verify passenger details are displayed:
   - Passenger type icon (👤 👶 🍼)
   - Passenger name and age
   - Individual price paid
   - Total price
4. Verify passenger breakdown is clear and readable

### 6. Test Cancellation
1. Cancel a booking with infants
2. Verify:
   - Booking status changes to "cancelled"
   - Passenger details still visible
   - Seats restored to flight

## Price Calculation Verification

### Economy Class (base_price = $1,000,000)
- Adult: $1,000,000
- Lap Infant: $100,000 (10%)
- Infant Seat: $500,000 (50%)

### Business Class (base_price = $1,000,000)
- Adult: $2,500,000 (2.5x)
- Lap Infant: $250,000 (10% of adult)
- Infant Seat: $1,250,000 (50% of adult)

### Galaxium Class (base_price = $1,000,000)
- Adult: $4,000,000 (4.0x)
- Lap Infant: $400,000 (10% of adult)
- Infant Seat: $2,000,000 (50% of adult)

## Database Verification

### Check Passengers Table
```sql
SELECT * FROM passengers;
```

**Expected Columns**:
- passenger_id
- booking_id
- passenger_type (adult, lap_infant, infant_seat)
- age
- name
- price_paid

### Check Sample Data
```sql
SELECT b.booking_id, b.seat_class, b.price_paid as total_price,
       p.passenger_type, p.age, p.name, p.price_paid as passenger_price
FROM bookings b
JOIN passengers p ON b.booking_id = p.booking_id
WHERE b.user_id IN (1, 2, 3)
ORDER BY b.booking_id, p.passenger_id;
```

## Success Criteria Checklist

### Must Have (MVP)
- [x] Parents can add infants (0-2 years) to bookings
- [x] Two infant options: lap infant (10% fare) or infant seat (50% fare)
- [x] Maximum 1 lap infant per adult enforced
- [x] Infant seats reduce seat availability, lap infants don't
- [x] Age validation (0-2 years) for infants
- [x] Price breakdown shows per-passenger costs
- [x] My Bookings displays passenger details
- [x] Backward compatible with existing bookings

### Validation Rules
- [x] At least 1 adult required per booking
- [x] Maximum 1 lap infant per adult
- [x] Infant age must be 0-2 years
- [x] Age required for infant passengers
- [x] Seat availability checked correctly

### UI/UX
- [x] Intuitive passenger counter interface
- [x] Clear visual distinction between lap infant and infant seat
- [x] Real-time price calculation
- [x] Animated UI transitions
- [x] Comprehensive validation feedback
- [x] Infant pricing displayed on flight cards

## Known Issues / Limitations

1. **Age Verification**: System relies on honor system for infant ages (ID verification out of scope)
2. **Passenger Modification**: Cannot modify passengers after booking (future enhancement)
3. **Multiple Infants**: System supports multiple infants per booking if multiple adults present

## Next Steps for Production

1. Add comprehensive unit tests
2. Add integration tests
3. Add E2E tests with Playwright/Cypress
4. Update API documentation in Swagger
5. Add monitoring and analytics
6. Consider adding:
   - Infant baggage allowance information
   - Special requests (bassinet, baby meal)
   - Child passengers (2-12 years) at 75% fare

## Support

For issues or questions:
- Check implementation plan: `plans/04-infant-booking-feature.md`
- Review backend code: `booking_system_backend/`
- Review frontend code: `booking_system_frontend/src/`