# Frontend Implementation Plan - Seat Classes

## Overview

This document details the frontend implementation for displaying and selecting seat classes (Economy, Business, Galaxium) in the Galaxium Travels React/TypeScript application.

---

## Phase 1: TypeScript Types & Interfaces

### 1.1 Update Core Types

**File**: [`booking_system_frontend/src/types/index.ts`](../booking_system_frontend/src/types/index.ts)

**Add New Types:**

```typescript
// Seat class enumeration
export type SeatClass = 'economy' | 'business' | 'galaxium';

// Seat class information
export interface SeatClassInfo {
  price: number;
  available: number;
  total: number;
  multiplier: number;
}

// Seat classes breakdown
export interface FlightSeatClasses {
  economy: SeatClassInfo;
  business: SeatClassInfo;
  galaxium: SeatClassInfo;
}

// Updated Flight interface
export interface Flight {
  flight_id: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  base_price: number;
  seat_classes: FlightSeatClasses;
  
  // Deprecated but kept for backward compatibility
  price?: number;
  seats_available?: number;
}

// Updated Booking interface
export interface Booking {
  booking_id: number;
  user_id: number;
  flight_id: number;
  seat_class: SeatClass;
  price_paid: number;
  status: 'booked' | 'cancelled' | 'completed';
  booking_time: string;
}

// Updated BookingRequest
export interface BookingRequest {
  user_id: number;
  flight_id: number;
  seat_class: SeatClass;
}

// Seat class display configuration
export interface SeatClassConfig {
  name: string;
  icon: string;
  color: string;
  gradient: string;
  features: string[];
  multiplier: number;
}
```

### 1.2 Add Seat Class Constants

**File**: [`booking_system_frontend/src/types/index.ts`](../booking_system_frontend/src/types/index.ts)

```typescript
// Seat class display configurations
export const SEAT_CLASS_CONFIGS: Record<SeatClass, SeatClassConfig> = {
  economy: {
    name: 'Economy',
    icon: '💺',
    color: '#2196F3',
    gradient: 'from-blue-500 to-blue-600',
    features: [
      'Standard seating',
      'Basic meal service',
      'In-flight entertainment',
      'Carry-on baggage'
    ],
    multiplier: 1.0
  },
  business: {
    name: 'Business',
    icon: '🛋️',
    color: '#9C27B0',
    gradient: 'from-purple-500 to-purple-600',
    features: [
      'Extra legroom',
      'Premium meals',
      'Priority boarding',
      'Lounge access',
      'Extra baggage allowance'
    ],
    multiplier: 2.5
  },
  galaxium: {
    name: 'Galaxium',
    icon: '✨',
    color: '#FFD700',
    gradient: 'from-yellow-400 to-yellow-500',
    features: [
      'Luxury pods',
      'Gourmet dining',
      'Private lounge',
      'Concierge service',
      'Premium amenities',
      'Unlimited baggage'
    ],
    multiplier: 4.0
  }
};
```

---

## Phase 2: API Service Updates

### 2.1 Update API Functions

**File**: [`booking_system_frontend/src/services/api.ts`](../booking_system_frontend/src/services/api.ts)

**Update Booking Function:**

```typescript
export const createBooking = async (
  userId: number,
  flightId: number,
  seatClass: SeatClass = 'economy'
): Promise<Booking | ErrorResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        flight_id: flightId,
        seat_class: seatClass
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.detail || 'Failed to create booking',
        error_code: 'BOOKING_FAILED',
        details: errorData.detail
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: 'Network error',
      error_code: 'NETWORK_ERROR'
    };
  }
};
```

---

## Phase 3: UI Components

### 3.1 Create Seat Class Selector Component

**New File**: `booking_system_frontend/src/components/flights/SeatClassSelector.tsx`

```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { SeatClass, FlightSeatClasses } from '../../types';
import { SEAT_CLASS_CONFIGS } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SeatClassSelectorProps {
  seatClasses: FlightSeatClasses;
  selectedClass: SeatClass;
  onSelectClass: (seatClass: SeatClass) => void;
}

export const SeatClassSelector = ({
  seatClasses,
  selectedClass,
  onSelectClass
}: SeatClassSelectorProps) => {
  const classes: SeatClass[] = ['economy', 'business', 'galaxium'];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-star-white mb-4">
        Select Your Class
      </h3>
      
      {classes.map((classType) => {
        const config = SEAT_CLASS_CONFIGS[classType];
        const classInfo = seatClasses[classType];
        const isSelected = selectedClass === classType;
        const isAvailable = classInfo.available > 0;
        const isSoldOut = !isAvailable;

        return (
          <motion.button
            key={classType}
            onClick={() => isAvailable && onSelectClass(classType)}
            disabled={isSoldOut}
            whileHover={isAvailable ? { scale: 1.02 } : {}}
            whileTap={isAvailable ? { scale: 0.98 } : {}}
            className={`
              w-full p-4 rounded-lg border-2 transition-all
              ${isSelected 
                ? 'border-cosmic-purple bg-cosmic-purple/10' 
                : 'border-star-white/20 hover:border-star-white/40'
              }
              ${isSoldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{config.icon}</span>
                  <h4 className="text-lg font-semibold text-star-white">
                    {config.name}
                  </h4>
                  {isSelected && (
                    <Check className="w-5 h-5 text-cosmic-purple" />
                  )}
                </div>
                
                <div className="space-y-1 mb-3">
                  {config.features.slice(0, 3).map((feature, idx) => (
                    <p key={idx} className="text-sm text-star-white/70">
                      • {feature}
                    </p>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-star-white/70">
                    {classInfo.available} / {classInfo.total} seats
                  </span>
                  {isSoldOut && (
                    <span className="text-red-400 font-semibold">
                      SOLD OUT
                    </span>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-star-white">
                  {formatCurrency(classInfo.price)}
                </div>
                {classType !== 'economy' && (
                  <div className="text-xs text-star-white/50">
                    {config.multiplier}x base price
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
```

### 3.2 Update Flight Card Component

**File**: [`booking_system_frontend/src/components/flights/FlightCard.tsx`](../booking_system_frontend/src/components/flights/FlightCard.tsx)

**Modify to Show Class Options:**

```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import type { Flight, SeatClass } from '../../types';
import { SEAT_CLASS_CONFIGS } from '../../types';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { Button } from '../common';

interface FlightCardProps {
  flight: Flight;
  onBook: (flight: Flight, seatClass: SeatClass) => void;
}

export const FlightCard = ({ flight, onBook }: FlightCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SeatClass>('economy');

  const classes: SeatClass[] = ['economy', 'business', 'galaxium'];
  const selectedClassInfo = flight.seat_classes[selectedClass];
  const config = SEAT_CLASS_CONFIGS[selectedClass];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:border-cosmic-purple/50 transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Plane className="w-6 h-6 text-cosmic-purple" />
          <div>
            <h3 className="text-xl font-bold text-star-white">
              {flight.origin} → {flight.destination}
            </h3>
            <p className="text-sm text-star-white/60">
              Flight #{flight.flight_id}
            </p>
          </div>
        </div>
      </div>

      {/* Time Info */}
      <div className="flex items-center gap-4 mb-4 text-star-white/70">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {formatTime(flight.departure_time)} - {formatTime(flight.arrival_time)}
          </span>
        </div>
      </div>

      {/* Class Selector Tabs */}
      <div className="flex gap-2 mb-4">
        {classes.map((classType) => {
          const classInfo = flight.seat_classes[classType];
          const classConfig = SEAT_CLASS_CONFIGS[classType];
          const isSelected = selectedClass === classType;
          const isAvailable = classInfo.available > 0;

          return (
            <button
              key={classType}
              onClick={() => setSelectedClass(classType)}
              disabled={!isAvailable}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                ${isSelected 
                  ? 'bg-cosmic-purple text-star-white' 
                  : 'bg-space-dark/50 text-star-white/70 hover:bg-space-dark'
                }
                ${!isAvailable && 'opacity-50 cursor-not-allowed'}
              `}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{classConfig.icon}</span>
                <span>{classConfig.name}</span>
              </div>
              {!isAvailable && (
                <div className="text-xs text-red-400 mt-1">Sold Out</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Class Info */}
      <div className="bg-space-dark/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <span className="text-lg font-semibold text-star-white">
              {config.name} Class
            </span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-star-white">
              {formatCurrency(selectedClassInfo.price)}
            </div>
            <div className="text-xs text-star-white/50">
              {selectedClassInfo.available} seats left
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="space-y-1">
          {config.features.slice(0, 2).map((feature, idx) => (
            <p key={idx} className="text-sm text-star-white/70">
              • {feature}
            </p>
          ))}
        </div>

        {/* Show More Details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-sm text-cosmic-purple hover:text-nebula-pink transition-colors mt-2"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show all features
            </>
          )}
        </button>

        {/* Expanded Features */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-star-white/10"
          >
            <div className="space-y-1">
              {config.features.slice(2).map((feature, idx) => (
                <p key={idx} className="text-sm text-star-white/70">
                  • {feature}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Book Button */}
      <Button
        onClick={() => onBook(flight, selectedClass)}
        disabled={selectedClassInfo.available === 0}
        className="w-full"
      >
        {selectedClassInfo.available === 0 
          ? 'Sold Out' 
          : `Book ${config.name} Class`
        }
      </Button>
    </motion.div>
  );
};
```

### 3.3 Update Booking Modal

**File**: [`booking_system_frontend/src/components/bookings/BookingModal.tsx`](../booking_system_frontend/src/components/bookings/BookingModal.tsx)

**Add Class Selection:**

```typescript
import { useState } from 'react';
import { Modal, Button } from '../common';
import { SeatClassSelector } from '../flights/SeatClassSelector';
import type { Flight, SeatClass } from '../../types';
import { SEAT_CLASS_CONFIGS } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight | null;
  onConfirm: (seatClass: SeatClass) => void;
  isLoading: boolean;
}

export const BookingModal = ({
  isOpen,
  onClose,
  flight,
  onConfirm,
  isLoading
}: BookingModalProps) => {
  const [selectedClass, setSelectedClass] = useState<SeatClass>('economy');

  if (!flight) return null;

  const classInfo = flight.seat_classes[selectedClass];
  const config = SEAT_CLASS_CONFIGS[selectedClass];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Your Booking"
      size="lg"
    >
      <div className="space-y-6">
        {/* Flight Info */}
        <div className="bg-space-dark/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-star-white mb-2">
            {flight.origin} → {flight.destination}
          </h3>
          <p className="text-sm text-star-white/70">
            Flight #{flight.flight_id}
          </p>
        </div>

        {/* Seat Class Selector */}
        <SeatClassSelector
          seatClasses={flight.seat_classes}
          selectedClass={selectedClass}
          onSelectClass={setSelectedClass}
        />

        {/* Price Summary */}
        <div className="bg-space-dark/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-star-white/70">Selected Class:</span>
            <span className="text-star-white font-semibold">
              {config.icon} {config.name}
            </span>
          </div>
          <div className="flex items-center justify-between text-xl font-bold">
            <span className="text-star-white">Total:</span>
            <span className="text-cosmic-purple">
              {formatCurrency(classInfo.price)}
            </span>
          </div>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={() => onConfirm(selectedClass)}
          isLoading={isLoading}
          disabled={classInfo.available === 0}
          className="w-full"
        >
          {classInfo.available === 0 
            ? 'Class Sold Out' 
            : 'Confirm Booking'
          }
        </Button>
      </div>
    </Modal>
  );
};
```

---

## Phase 4: Page Updates

### 4.1 Update Flights Page

**File**: [`booking_system_frontend/src/pages/Flights.tsx`](../booking_system_frontend/src/pages/Flights.tsx)

**Modify Booking Flow:**

```typescript
// Add state for selected class
const [selectedClass, setSelectedClass] = useState<SeatClass>('economy');

// Update handleBook function
const handleBook = (flight: Flight, seatClass: SeatClass) => {
  setSelectedFlight(flight);
  setSelectedClass(seatClass);
  
  if (!user) {
    setShowUserModal(true);
  } else {
    setShowBookingModal(true);
  }
};

// Update handleConfirmBooking
const handleConfirmBooking = async (seatClass: SeatClass) => {
  if (!user || !selectedFlight) return;

  setIsLoading(true);
  try {
    const result = await createBooking(
      user.user_id,
      selectedFlight.flight_id,
      seatClass
    );

    if (isErrorResponse(result)) {
      toast.error(result.details || result.error);
      return;
    }

    toast.success(`${SEAT_CLASS_CONFIGS[seatClass].name} class booked successfully!`);
    setShowBookingModal(false);
    loadFlights(); // Refresh to update availability
  } catch (error) {
    toast.error('Failed to create booking');
  } finally {
    setIsLoading(false);
  }
};

// Update FlightCard usage
<FlightCard
  key={flight.flight_id}
  flight={flight}
  onBook={handleBook}
/>

// Update BookingModal usage
<BookingModal
  isOpen={showBookingModal}
  onClose={() => setShowBookingModal(false)}
  flight={selectedFlight}
  onConfirm={handleConfirmBooking}
  isLoading={isLoading}
/>
```

### 4.2 Update My Bookings Page

**File**: [`booking_system_frontend/src/pages/MyBookings.tsx`](../booking_system_frontend/src/pages/MyBookings.tsx)

**Display Seat Class:**

```typescript
import { SEAT_CLASS_CONFIGS } from '../types';

// In BookingCard component
const config = SEAT_CLASS_CONFIGS[booking.seat_class];

<div className="flex items-center gap-2">
  <span className="text-xl">{config.icon}</span>
  <span className="font-semibold text-star-white">
    {config.name} Class
  </span>
</div>

<div className="text-lg font-bold text-cosmic-purple">
  {formatCurrency(booking.price_paid)}
</div>
```

---

## Phase 5: Utility Functions

### 5.1 Add Formatting Helpers

**File**: [`booking_system_frontend/src/utils/formatters.ts`](../booking_system_frontend/src/utils/formatters.ts)

**Add Currency Formatter:**

```typescript
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
```

---

## Testing Checklist

### Component Tests
- [ ] SeatClassSelector renders all three classes
- [ ] SeatClassSelector disables sold-out classes
- [ ] SeatClassSelector highlights selected class
- [ ] FlightCard displays correct prices for each class
- [ ] FlightCard shows/hides class features
- [ ] BookingModal updates price when class changes

### Integration Tests
- [ ] Booking flow with Economy class
- [ ] Booking flow with Business class
- [ ] Booking flow with Galaxium class
- [ ] Error handling when class is sold out
- [ ] Seat availability updates after booking
- [ ] My Bookings displays correct class info

### Visual Tests
- [ ] Responsive design on mobile
- [ ] Class colors and icons display correctly
- [ ] Animations work smoothly
- [ ] Sold-out state is clear
- [ ] Price formatting is consistent

---

## Accessibility Checklist

- [ ] Keyboard navigation works for class selection
- [ ] Screen readers announce class information
- [ ] Color contrast meets WCAG AA standards
- [ ] Focus indicators are visible
- [ ] Disabled states are clearly indicated
- [ ] ARIA labels for interactive elements

---

## Performance Considerations

1. **Memoization**: Use `useMemo` for expensive calculations
2. **Lazy Loading**: Load class details on demand
3. **Optimistic Updates**: Update UI before API confirmation
4. **Caching**: Cache flight data to reduce API calls
5. **Code Splitting**: Lazy load booking modal

---

## Deployment Checklist

- [ ] Update environment variables if needed
- [ ] Build production bundle
- [ ] Test on staging environment
- [ ] Verify API integration
- [ ] Check mobile responsiveness
- [ ] Monitor error logs
- [ ] Gather user feedback

---

**Implementation Complete!**

All three plan files are now ready:
1. ✅ [Overview](./01-seat-classes-overview.md)
2. ✅ [Backend Implementation](./02-backend-implementation.md)
3. ✅ [Frontend Implementation](./03-frontend-implementation.md)

**Created**: 2026-05-13  
**Version**: 1.0  
**Status**: Ready for Implementation