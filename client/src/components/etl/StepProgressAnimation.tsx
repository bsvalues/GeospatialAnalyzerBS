import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle, ArrowRight, Zap, Database, Filter, Server, Calendar } from "lucide-react";

interface StepProgressAnimationProps {
  currentStep: number;
  totalSteps: number;
  stepsCompleted: boolean[];
  showAnimation?: boolean;
  animationSpeed?: "slow" | "normal" | "fast";
}

/**
 * Interactive step progress animation component for the ETL Wizard
 */
export const StepProgressAnimation: React.FC<StepProgressAnimationProps> = ({
  currentStep,
  totalSteps,
  stepsCompleted,
  showAnimation = true,
  animationSpeed = "normal"
}) => {
  // Determine the animation duration based on the speed
  const getDuration = () => {
    switch (animationSpeed) {
      case "slow": return 0.8;
      case "fast": return 0.3;
      default: return 0.5;
    }
  };

  // Get the appropriate icon for a step
  const getStepIcon = (step: number) => {
    switch (step) {
      case 0: return <Circle className="w-5 h-5" />;
      case 1: return <Database className="w-5 h-5" />;
      case 2: return <Filter className="w-5 h-5" />;
      case 3: return <Server className="w-5 h-5" />;
      case 4: return <Calendar className="w-5 h-5" />;
      case 5: return <CheckCircle className="w-5 h-5" />;
      default: return <Circle className="w-5 h-5" />;
    }
  };

  // Get the label for a step
  const getStepLabel = (step: number) => {
    switch (step) {
      case 0: return "Info";
      case 1: return "Sources";
      case 2: return "Transform";
      case 3: return "Destination";
      case 4: return "Schedule";
      case 5: return "Review";
      default: return `Step ${step + 1}`;
    }
  };

  return (
    <div className="w-full mb-8">
      {/* Progress bar */}
      <div className="relative mb-6 h-1 bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-blue-600"
          initial={{ width: `${(currentStep / (totalSteps - 1)) * 100}%` }}
          animate={{ 
            width: `${(currentStep / (totalSteps - 1)) * 100}%`,
            transition: { duration: getDuration() }
          }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between items-center">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const isActive = index === currentStep;
          const isCompleted = stepsCompleted[index];
          
          return (
            <div key={index} className="flex flex-col items-center relative">
              {/* Connecting line */}
              {index < totalSteps - 1 && (
                <div className="absolute top-3 left-6 w-full h-0.5 bg-gray-200 -z-10">
                  {(isCompleted || (isActive && showAnimation)) && (
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-blue-600"
                      initial={{ width: isCompleted ? "100%" : "0%" }}
                      animate={{ 
                        width: "100%",
                        transition: { 
                          duration: getDuration(),
                          delay: isActive && !isCompleted ? getDuration() * 0.5 : 0
                        }
                      }}
                    />
                  )}
                </div>
              )}

              {/* Step circle */}
              <motion.div 
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center
                  ${isActive 
                      ? "bg-blue-600 text-white" 
                      : isCompleted 
                        ? "bg-green-500 text-white" 
                        : "bg-gray-200 text-gray-500"
                  }`}
                animate={{ 
                  scale: isActive ? [1, 1.1, 1] : 1,
                  transition: { 
                    duration: getDuration(), 
                    repeat: isActive && showAnimation ? Infinity : 0,
                    repeatType: "reverse"
                  }
                }}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  getStepIcon(index)
                )}
                
                {/* Active step animated indicator */}
                {isActive && showAnimation && (
                  <motion.div 
                    className="absolute -top-0.5 -right-0.5 -bottom-0.5 -left-0.5 rounded-full border-2 border-blue-400"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [1, 0.7, 1]
                    }}
                    transition={{ 
                      duration: getDuration() * 2,
                      repeat: Infinity
                    }}
                  />
                )}
              </motion.div>

              {/* Step label */}
              <motion.div 
                className={`text-xs mt-1 font-medium
                  ${isActive 
                      ? "text-blue-600" 
                      : isCompleted 
                        ? "text-green-500" 
                        : "text-gray-500"
                  }`}
                animate={{ 
                  opacity: isActive ? 1 : isCompleted ? 0.9 : 0.7,
                  scale: isActive ? 1.05 : 1,
                  transition: { duration: 0.3 }
                }}
              >
                {getStepLabel(index)}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Data flow animation - shown only when an animation is in progress */}
      {showAnimation && (
        <div className="relative mt-4">
          <div className="h-1 bg-transparent">
            <AnimatePresence>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`flow-${i}`}
                  className="absolute h-2 w-2 rounded-full bg-blue-500"
                  initial={{ left: 0, opacity: 0 }}
                  animate={{ 
                    left: "100%", 
                    opacity: [0, 1, 0],
                    y: [0, -4, 0]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: getDuration() * 3,
                    delay: i * getDuration(),
                    repeat: Infinity,
                    repeatDelay: getDuration() * 2
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepProgressAnimation;