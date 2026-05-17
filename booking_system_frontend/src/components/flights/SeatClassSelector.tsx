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

// Made with Bob
