// API Data Models matching backend schemas

// Seat class enumeration
export type SeatClass = 'economy' | 'business' | 'galaxium';

// Passenger type enumeration
export type PassengerType = 'adult' | 'lap_infant' | 'infant_seat';

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

// Passenger information
export interface PassengerInfo {
  passenger_type: PassengerType;
  age?: number;  // Required for infants (0-2)
  name?: string; // Optional for all passengers
}

// Passenger in booking response
export interface PassengerOut {
  passenger_id: number;
  passenger_type: PassengerType;
  age?: number;
  name?: string;
  price_paid: number;
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
  passengers?: PassengerOut[];  // Include passenger details
}

export interface User {
  user_id: number;
  name: string;
  email: string;
}

// Request/Response types
export interface BookingRequest {
  user_id: number;
  name: string;
  flight_id: number;
  seat_class: SeatClass;
  passengers?: PassengerInfo[];  // Optional for backward compatibility
}

export interface UserRegistration {
  name: string;
  email: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  error_code: string;
  details?: string;
}

// Extended types for UI
export interface BookingWithFlight extends Booking {
  flight?: Flight;
}

export interface FlightFilters {
  origin?: string;
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
  searchTerm?: string;
}

// User context type
export interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
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

// Made with Bob


// Passenger type display configuration
export interface PassengerTypeConfig {
  name: string;
  icon: string;
  description: string;
  priceMultiplier: number;
  requiresAge: boolean;
  requiresSeat: boolean;
}

// Passenger type display configurations
export const PASSENGER_TYPE_CONFIGS: Record<PassengerType, PassengerTypeConfig> = {
  adult: {
    name: 'Adult',
    icon: '👤',
    description: 'Full fare passenger',
    priceMultiplier: 1.0,
    requiresAge: false,
    requiresSeat: true
  },
  lap_infant: {
    name: 'Lap Infant',
    icon: '👶',
    description: 'Infant (0-2 years) on lap - 10% fare, no seat',
    priceMultiplier: 0.10,
    requiresAge: true,
    requiresSeat: false
  },
  infant_seat: {
    name: 'Infant Seat',
    icon: '🍼',
    description: 'Infant (0-2 years) with seat - 50% fare',
    priceMultiplier: 0.50,
    requiresAge: true,
    requiresSeat: true
  }
};
