import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Users } from 'lucide-react';
import type { PassengerInfo, SeatClass, FlightSeatClasses } from '../../types';
import { PASSENGER_TYPE_CONFIGS, SEAT_CLASS_CONFIGS } from '../../types';
import { Button, Input } from '../common';
import { formatCurrency } from '../../utils/formatters';

interface PassengerSelectorProps {
  passengers: PassengerInfo[];
  onPassengersChange: (passengers: PassengerInfo[]) => void;
  seatClass: SeatClass;
  seatClasses: FlightSeatClasses;
}

export const PassengerSelector = ({
  passengers,
  onPassengersChange,
  seatClass,
  seatClasses
}: PassengerSelectorProps) => {
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Count passengers by type
  const adults = passengers.filter(p => p.passenger_type === 'adult').length;
  const infants = passengers.filter(p => p.passenger_type !== 'adult').length;

  // Calculate prices
  const adultPrice = seatClasses[seatClass].price;
  const lapInfantPrice = Math.floor(adultPrice * 0.10);
  const infantSeatPrice = Math.floor(adultPrice * 0.50);

  // Calculate total price
  const totalPrice = passengers.reduce((sum, p) => {
    if (p.passenger_type === 'adult') return sum + adultPrice;
    if (p.passenger_type === 'lap_infant') return sum + lapInfantPrice;
    if (p.passenger_type === 'infant_seat') return sum + infantSeatPrice;
    return sum;
  }, 0);

  // Calculate seats needed
  const seatsNeeded = passengers.filter(p => 
    p.passenger_type === 'adult' || p.passenger_type === 'infant_seat'
  ).length;

  const addAdult = () => {
    onPassengersChange([...passengers, { passenger_type: 'adult' }]);
  };

  const removeAdult = () => {
    if (adults <= 1) return; // Must have at least 1 adult
    const index = passengers.findIndex(p => p.passenger_type === 'adult');
    if (index !== -1) {
      const newPassengers = [...passengers];
      newPassengers.splice(index, 1);
      onPassengersChange(newPassengers);
    }
  };

  const addInfant = () => {
    // Default to lap infant
    onPassengersChange([...passengers, { passenger_type: 'lap_infant', age: 0 }]);
  };

  const removeInfant = () => {
    const index = passengers.findIndex(p => p.passenger_type !== 'adult');
    if (index !== -1) {
      const newPassengers = [...passengers];
      newPassengers.splice(index, 1);
      onPassengersChange(newPassengers);
      
      // Clear error for this passenger
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
    }
  };

  const updatePassenger = (index: number, updates: Partial<PassengerInfo>) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], ...updates };
    onPassengersChange(newPassengers);

    // Validate age if it's an infant
    if (updates.age !== undefined) {
      const newErrors = { ...errors };
      if (updates.age < 0 || updates.age > 2) {
        newErrors[index] = 'Infant age must be between 0 and 2 years';
      } else {
        delete newErrors[index];
      }
      setErrors(newErrors);
    }
  };

  // Check if we can add more infants (max 1 per adult)
  const canAddInfant = infants < adults;
  const canAddSeats = seatsNeeded < seatClasses[seatClass].available;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-cosmic-purple" />
        <h3 className="text-lg font-semibold text-star-white">Passengers</h3>
      </div>

      {/* Adults Counter */}
      <div className="bg-space-dark/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{PASSENGER_TYPE_CONFIGS.adult.icon}</span>
              <span className="font-semibold text-star-white">Adults</span>
            </div>
            <p className="text-sm text-star-white/60 mt-1">
              {formatCurrency(adultPrice)} per adult
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={removeAdult}
              disabled={adults <= 1}
              className="w-8 h-8 p-0"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-xl font-bold text-star-white w-8 text-center">
              {adults}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={addAdult}
              disabled={!canAddSeats}
              className="w-8 h-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {adults <= 1 && (
          <p className="text-xs text-star-white/50 mt-2">
            At least one adult is required
          </p>
        )}
      </div>

      {/* Infants Counter */}
      <div className="bg-space-dark/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👶</span>
              <span className="font-semibold text-star-white">Infants (0-2 years)</span>
            </div>
            <p className="text-sm text-star-white/60 mt-1">
              Lap: {formatCurrency(lapInfantPrice)} • Seat: {formatCurrency(infantSeatPrice)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={removeInfant}
              disabled={infants === 0}
              className="w-8 h-8 p-0"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-xl font-bold text-star-white w-8 text-center">
              {infants}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={addInfant}
              disabled={!canAddInfant}
              className="w-8 h-8 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {!canAddInfant && infants > 0 && (
          <p className="text-xs text-amber-400 mt-2">
            Maximum 1 infant per adult
          </p>
        )}
      </div>

      {/* Infant Details */}
      <AnimatePresence>
        {passengers.map((passenger, index) => {
          if (passenger.passenger_type === 'adult') return null;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-space-dark/30 rounded-lg p-4 space-y-4"
            >
              <h4 className="font-semibold text-star-white flex items-center gap-2">
                <span className="text-xl">👶</span>
                Infant {passengers.filter(p => p.passenger_type !== 'adult').indexOf(passenger) + 1}
              </h4>

              {/* Infant Type Selection */}
              <div className="space-y-2">
                <label className="text-sm text-star-white/70">Infant Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updatePassenger(index, { passenger_type: 'lap_infant' })}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-left
                      ${passenger.passenger_type === 'lap_infant'
                        ? 'border-cosmic-purple bg-cosmic-purple/10'
                        : 'border-star-white/20 hover:border-star-white/40'
                      }
                    `}
                  >
                    <div className="font-semibold text-star-white text-sm">
                      {PASSENGER_TYPE_CONFIGS.lap_infant.icon} Lap Infant
                    </div>
                    <div className="text-xs text-star-white/60 mt-1">
                      {formatCurrency(lapInfantPrice)} • No seat
                    </div>
                  </button>
                  <button
                    onClick={() => updatePassenger(index, { passenger_type: 'infant_seat' })}
                    className={`
                      p-3 rounded-lg border-2 transition-all text-left
                      ${passenger.passenger_type === 'infant_seat'
                        ? 'border-cosmic-purple bg-cosmic-purple/10'
                        : 'border-star-white/20 hover:border-star-white/40'
                      }
                    `}
                  >
                    <div className="font-semibold text-star-white text-sm">
                      {PASSENGER_TYPE_CONFIGS.infant_seat.icon} Infant Seat
                    </div>
                    <div className="text-xs text-star-white/60 mt-1">
                      {formatCurrency(infantSeatPrice)} • Own seat
                    </div>
                  </button>
                </div>
              </div>

              {/* Age Input */}
              <div>
                <label className="text-sm text-star-white/70 block mb-2">
                  Age (years) <span className="text-red-400">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  value={passenger.age ?? ''}
                  onChange={(e) => updatePassenger(index, { age: parseInt(e.target.value) || 0 })}
                  placeholder="0-2"
                  className="w-24"
                />
                {errors[index] && (
                  <p className="text-xs text-red-400 mt-1">{errors[index]}</p>
                )}
              </div>

              {/* Name Input (Optional) */}
              <div>
                <label className="text-sm text-star-white/70 block mb-2">
                  Name (optional)
                </label>
                <Input
                  type="text"
                  value={passenger.name ?? ''}
                  onChange={(e) => updatePassenger(index, { name: e.target.value })}
                  placeholder="Infant's name"
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Price Breakdown */}
      <div className="bg-space-dark/30 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-star-white mb-3">Price Breakdown</h4>
        
        {passengers.map((passenger, index) => {
          const config = PASSENGER_TYPE_CONFIGS[passenger.passenger_type];
          let price = adultPrice;
          if (passenger.passenger_type === 'lap_infant') price = lapInfantPrice;
          if (passenger.passenger_type === 'infant_seat') price = infantSeatPrice;

          const passengerNum = passenger.passenger_type === 'adult'
            ? passengers.slice(0, index + 1).filter(p => p.passenger_type === 'adult').length
            : passengers.slice(0, index + 1).filter(p => p.passenger_type !== 'adult').length;

          return (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-star-white/70">
                {config.icon} {config.name} {passengerNum} ({SEAT_CLASS_CONFIGS[seatClass].name})
              </span>
              <span className="text-star-white font-medium">
                {formatCurrency(price)}
              </span>
            </div>
          );
        })}

        <div className="border-t border-star-white/10 pt-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-star-white">Total</span>
            <span className="text-xl font-bold text-cosmic-purple">
              {formatCurrency(totalPrice)}
            </span>
          </div>
        </div>

        <div className="text-xs text-star-white/50 mt-2">
          Seats needed: {seatsNeeded} / {seatClasses[seatClass].available} available
        </div>
      </div>
    </div>
  );
};

// Made with Bob
