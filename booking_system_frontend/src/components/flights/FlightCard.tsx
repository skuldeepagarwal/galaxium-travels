import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plane, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { Flight, SeatClass } from '../../types';
import { SEAT_CLASS_CONFIGS } from '../../types';
import { formatCurrency, formatTime, calculateDuration } from '../../utils/formatters';
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
        <span className="text-sm">
          {calculateDuration(flight.departure_time, flight.arrival_time)}
        </span>
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

        {/* Infant Pricing Info */}
        <div className="mt-3 pt-3 border-t border-star-white/10">
          <p className="text-xs text-star-white/50 mb-2">Infant pricing (0-2 years):</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span>👶</span>
              <span className="text-star-white/70">Lap:</span>
              <span className="text-star-white font-medium">
                {formatCurrency(Math.floor(selectedClassInfo.price * 0.10))}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>🍼</span>
              <span className="text-star-white/70">Seat:</span>
              <span className="text-star-white font-medium">
                {formatCurrency(Math.floor(selectedClassInfo.price * 0.50))}
              </span>
            </div>
          </div>
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

// Made with Bob
