'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useI18n } from '@/i18n/provider';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: number; // 1, 2, or 3
}

const stepKeys = ['step.order', 'step.customer', 'step.payment'] as const;

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { t } = useI18n();

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex items-center justify-between">
        {stepKeys.map((key, index) => {
          const step = index + 1;
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;
          const isFuture = step > currentStep;

          return (
            <React.Fragment key={key}>
              {/* Step circle + label */}
              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <motion.div
                  className={cn(
                    'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isActive && 'bg-primary text-primary-foreground shadow-md shadow-primary/25',
                    isFuture && 'bg-secondary text-muted-foreground border border-border'
                  )}
                  animate={
                    isActive
                      ? { scale: [1, 1.08, 1] }
                      : {}
                  }
                  transition={{ duration: 0.4 }}
                >
                  {isCompleted ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    step
                  )}
                </motion.div>
                <span
                  className={cn(
                    'text-[11px] sm:text-xs font-medium transition-colors duration-300 text-center leading-tight',
                    isActive && 'text-primary',
                    isCompleted && 'text-primary',
                    isFuture && 'text-muted-foreground'
                  )}
                >
                  {t(key)}
                </span>
              </div>

              {/* Connector line between steps */}
              {index < stepKeys.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 sm:mx-3 -mt-5 sm:-mt-6">
                  <div className="h-full rounded-full bg-border relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-primary rounded-full"
                      initial={{ width: '0%' }}
                      animate={{
                        width:
                          step < currentStep
                            ? '100%'
                            : step === currentStep
                            ? '50%'
                            : '0%',
                      }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
