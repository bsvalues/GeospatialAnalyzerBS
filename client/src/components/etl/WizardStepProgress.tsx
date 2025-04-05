import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface StepProgressAnimationProps {
  currentStep: number;
  totalSteps: number;
  stepsCompleted: boolean[];
  showAnimation?: boolean;
  animationSpeed?: "slow" | "normal" | "fast";
}

/**
 * Legacy Step Progress Animation component for the ETL Wizard
 * This maintains compatibility with the older interface used in ETLProcessWizard
 */
export const StepProgressAnimation: React.FC<StepProgressAnimationProps> = ({
  currentStep,
  totalSteps,
  stepsCompleted,
  showAnimation = false,
  animationSpeed = "normal"
}) => {
  // Get animation duration based on speed
  const getDuration = (): number => {
    switch (animationSpeed) {
      case "slow": return 2.5;
      case "fast": return 1;
      default: return 1.5;
    }
  };

  return (
    <div className="flex justify-between items-center w-full px-4">
      {[...Array(totalSteps)].map((_, index) => (
        <React.Fragment key={index}>
          {/* Step circle */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center
                ${
                  stepsCompleted[index] 
                    ? "bg-green-100 text-green-600" 
                    : index === currentStep
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-400"
                }
              `}
            >
              {stepsCompleted[index] ? (
                <CheckCircle className="w-6 h-6" />
              ) : index === currentStep && showAnimation ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: getDuration(), 
                    repeat: Infinity, 
                    ease: "linear"
                  }}
                >
                  <Loader2 className="w-6 h-6" />
                </motion.div>
              ) : index === currentStep ? (
                <div className="w-6 h-6 rounded-full border-2 border-blue-600" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </div>
            <span 
              className={`text-xs mt-2 font-medium
                ${
                  stepsCompleted[index] 
                    ? "text-green-600" 
                    : index === currentStep
                    ? "text-blue-600"
                    : "text-gray-400"
                }
              `}
            >
              Step {index + 1}
            </span>
          </div>

          {/* Connector line (skip after last item) */}
          {index < totalSteps - 1 && (
            <div 
              className={`h-0.5 flex-1 mx-2
                ${
                  stepsCompleted[index] && stepsCompleted[index + 1]
                    ? "bg-green-500"
                    : stepsCompleted[index] && index + 1 === currentStep
                    ? "bg-blue-500"
                    : "bg-gray-200"
                }
              `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepProgressAnimation;