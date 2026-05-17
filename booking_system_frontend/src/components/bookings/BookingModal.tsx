import { useState } from 'react';
import { Modal, Button } from '../common';
import { SeatClassSelector } from '../flights/SeatClassSelector';
import { PassengerSelector } from './PassengerSelector';
import type { Flight, SeatClass, PassengerInfo } from '../../types';
import { SEAT_CLASS_CONFIGS } from '../../types';
import { bookFlight, isErrorResponse } from '../../services/api';
import { useUser } from '../../hooks/useUser';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight | null;
  initialSeatClass?: SeatClass;
  onSuccess: () => void;
}

export const BookingModal = ({
  isOpen,
  onClose,
  flight,
  initialSeatClass = 'economy',
  onSuccess
}: BookingModalProps) => {
  const { user } = useUser();
  const [selectedClass, setSelectedClass] = useState<SeatClass>(initialSeatClass);
  const [passengers, setPassengers] = useState<PassengerInfo[]>([
    { passenger_type: 'adult' } // Default to 1 adult
  ]);
  const [isLoading, setIsLoading] = useState(false);

  if (!flight) return null;

  const classInfo = flight.seat_classes[selectedClass];
  const config = SEAT_CLASS_CONFIGS[selectedClass];

  // Validate passengers before booking
  const validatePassengers = (): string | null => {
    const adults = passengers.filter(p => p.passenger_type === 'adult').length;
    const lapInfants = passengers.filter(p => p.passenger_type === 'lap_infant').length;
    const infantSeats = passengers.filter(p => p.passenger_type === 'infant_seat').length;

    if (adults === 0) {
      return 'At least one adult passenger is required';
    }

    if (lapInfants > adults) {
      return 'Maximum 1 lap infant allowed per adult';
    }

    // Check infant ages
    for (const passenger of passengers) {
      if (passenger.passenger_type !== 'adult') {
        if (passenger.age === undefined || passenger.age === null) {
          return 'Age is required for all infant passengers';
        }
        if (passenger.age < 0 || passenger.age > 2) {
          return 'Infant age must be between 0 and 2 years';
        }
      }
    }

    // Check seat availability
    const seatsNeeded = adults + infantSeats;
    if (seatsNeeded > classInfo.available) {
      return `Not enough seats available. Need ${seatsNeeded}, have ${classInfo.available}`;
    }

    return null;
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error('Please sign in to book a flight');
      return;
    }

    // Validate passengers
    const validationError = validatePassengers();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await bookFlight({
        user_id: user.user_id,
        name: user.name,
        flight_id: flight.flight_id,
        seat_class: selectedClass,
        passengers: passengers,
      });

      if (isErrorResponse(result)) {
        toast.error(result.details || result.error);
        return;
      }

      const passengerCount = passengers.length;
      const infantCount = passengers.filter(p => p.passenger_type !== 'adult').length;
      const message = infantCount > 0
        ? `${config.name} class booked for ${passengerCount} passenger${passengerCount > 1 ? 's' : ''} (including ${infantCount} infant${infantCount > 1 ? 's' : ''})!`
        : `${config.name} class booked successfully!`;
      
      toast.success(message);
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.details || error.error || 'Failed to book flight');
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Passenger Selector */}
        <PassengerSelector
          passengers={passengers}
          onPassengersChange={setPassengers}
          seatClass={selectedClass}
          seatClasses={flight.seat_classes}
        />

        {/* Passenger Info */}
        {user && (
          <div className="bg-space-dark/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-star-white mb-2">
              Booking For
            </h4>
            <p className="text-star-white">{user.name}</p>
            <p className="text-star-white/60 text-sm">{user.email}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBooking}
            isLoading={isLoading}
            disabled={classInfo.available === 0 || validatePassengers() !== null}
            className="flex-1"
          >
            {classInfo.available === 0
              ? 'Class Sold Out'
              : 'Confirm Booking'
            }
          </Button>
        </div>

        <p className="text-xs text-star-white/60 text-center">
          By confirming, you agree to our terms and conditions
        </p>
      </div>
    </Modal>
  );
};

// Made with Bob
