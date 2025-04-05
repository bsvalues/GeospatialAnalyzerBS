import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Loader2, 
  AlertTriangle 
} from "lucide-react";

export interface Step {
  id: string;
  title: string;
  description?: string;
  status?: "pending" | "processing" | "complete" | "error";
}

interface StepProgressAnimationProps {
  steps: Step[];
  currentStep: number;
  onComplete?: () => void;
  onStepComplete?: (stepIndex: number) => void;
  speed?: "slow" | "normal" | "fast";
  animated?: boolean;
  showDescription?: boolean;
  variant?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
}

/**
 * Animated step progress indicator for ETL wizard processes
 * Displays a series of steps with their status and animates transitions between steps
 */
export const StepProgressAnimation: React.FC<StepProgressAnimationProps> = ({
  steps,
  currentStep,
  onComplete,
  onStepComplete,
  speed = "normal",
  animated = true,
  showDescription = true,
  variant = "horizontal",
  size = "md"
}) => {
  const [activeStep, setActiveStep] = useState(currentStep);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [errorSteps, setErrorSteps] = useState<string[]>([]);
  
  // Duration for animations based on speed
  const getDuration = (): number => {
    switch (speed) {
      case "slow": return 1.2;
      case "fast": return 0.4;
      default: return 0.8;
    }
  };

  // Size classes based on size prop
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          icon: "w-5 h-5",
          step: "h-5 w-5",
          line: variant === "horizontal" ? "h-0.5" : "w-0.5",
          lineLength: variant === "horizontal" ? "w-10" : "h-10",
          title: "text-xs",
          description: "text-xs",
          wrapper: variant === "horizontal" ? "space-x-2" : "space-y-2"
        };
      case "lg":
        return {
          icon: "w-8 h-8",
          step: "h-8 w-8",
          line: variant === "horizontal" ? "h-1" : "w-1",
          lineLength: variant === "horizontal" ? "w-20" : "h-20",
          title: "text-base",
          description: "text-sm",
          wrapper: variant === "horizontal" ? "space-x-4" : "space-y-4"
        };
      default: // md
        return {
          icon: "w-6 h-6",
          step: "h-6 w-6",
          line: variant === "horizontal" ? "h-0.5" : "w-0.5",
          lineLength: variant === "horizontal" ? "w-16" : "h-16",
          title: "text-sm",
          description: "text-xs",
          wrapper: variant === "horizontal" ? "space-x-3" : "space-y-3"
        };
    }
  };

  // Update active step when currentStep prop changes
  useEffect(() => {
    setActiveStep(currentStep);
    
    // Update completed steps
    const newCompletedSteps = steps
      .filter((_, index) => index < currentStep)
      .map(step => step.id);
      
    setCompletedSteps(newCompletedSteps);
    
    // Check if all steps are complete
    if (currentStep >= steps.length && onComplete && newCompletedSteps.length === steps.length) {
      onComplete();
    }
  }, [currentStep, steps, onComplete]);

  // Set step to error state
  const setStepError = (stepId: string) => {
    if (!errorSteps.includes(stepId)) {
      setErrorSteps([...errorSteps, stepId]);
    }
  };

  // Helper to check step status
  const getStepStatus = (index: number): "pending" | "processing" | "complete" | "error" => {
    const step = steps[index];
    
    if (errorSteps.includes(step.id)) {
      return "error";
    }
    
    if (completedSteps.includes(step.id)) {
      return "complete";
    }
    
    if (index === activeStep) {
      return "processing";
    }
    
    return "pending";
  };

  // Step status icon
  const StepIcon = ({ index }: { index: number }) => {
    const status = getStepStatus(index);
    const sizeClasses = getSizeClasses();
    
    switch (status) {
      case "complete":
        return (
          <div className={`${sizeClasses.step} rounded-full bg-green-100 flex items-center justify-center text-green-600`}>
            <CheckCircle className={sizeClasses.icon} />
          </div>
        );
      case "processing":
        return (
          <div className={`${sizeClasses.step} rounded-full bg-blue-100 flex items-center justify-center text-blue-600`}>
            {animated ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              >
                <Loader2 className={sizeClasses.icon} />
              </motion.div>
            ) : (
              <Loader2 className={sizeClasses.icon} />
            )}
          </div>
        );
      case "error":
        return (
          <div className={`${sizeClasses.step} rounded-full bg-red-100 flex items-center justify-center text-red-600`}>
            <AlertTriangle className={sizeClasses.icon} />
          </div>
        );
      default:
        return (
          <div className={`${sizeClasses.step} rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200`}>
            <Circle className={sizeClasses.icon} />
          </div>
        );
    }
  };

  // Connector line between steps
  const ConnectorLine = ({ index }: { index: number }) => {
    const sizeClasses = getSizeClasses();
    const isLast = index === steps.length - 1;
    const status = getStepStatus(index);
    const nextStepStatus = !isLast ? getStepStatus(index + 1) : "pending";
    
    // Don't render connector for the last item
    if (isLast) {
      return null;
    }
    
    // Determine color of the connector line
    let bgColor = "bg-gray-200";
    
    if (status === "complete") {
      if (nextStepStatus === "complete" || nextStepStatus === "processing") {
        bgColor = "bg-green-500";
      } else if (nextStepStatus === "error") {
        bgColor = "bg-red-500";
      } else {
        bgColor = "bg-gray-300";
      }
    }
    
    if (status === "processing") {
      bgColor = "bg-blue-300";
    }
    
    return (
      <div className="flex-shrink-0 flex items-center">
        {variant === "horizontal" ? (
          <div className={`${sizeClasses.lineLength} ${sizeClasses.line} ${bgColor}`} />
        ) : (
          <div className={`${sizeClasses.lineLength} ${sizeClasses.line} ${bgColor} mx-auto`} />
        )}
      </div>
    );
  };

  // Complete step wrapper with step, title, description, and connector
  const StepItem = ({ step, index }: { step: Step; index: number }) => {
    const sizeClasses = getSizeClasses();
    const status = getStepStatus(index);
    
    return (
      <div className={`flex ${variant === "horizontal" ? "flex-col items-center" : "flex-row items-start"}`}>
        {variant === "vertical" && (
          <div className="mr-4 flex flex-col items-center">
            <StepIcon index={index} />
            <ConnectorLine index={index} />
          </div>
        )}
        
        <div className={variant === "horizontal" ? "text-center" : "flex-1"}>
          {variant === "horizontal" && <StepIcon index={index} />}
          
          <div className={`font-medium mt-1 ${sizeClasses.title} ${
            status === "processing" ? "text-blue-700" :
            status === "complete" ? "text-green-700" :
            status === "error" ? "text-red-700" :
            "text-gray-500"
          }`}>
            {step.title}
          </div>
          
          {showDescription && step.description && (
            <div className={`${sizeClasses.description} ${
              status === "processing" ? "text-blue-600" :
              status === "complete" ? "text-green-600" :
              status === "error" ? "text-red-600" :
              "text-gray-400"
            } mt-0.5 max-w-[120px]`}>
              {step.description}
            </div>
          )}
        </div>
        
        {variant === "horizontal" && <ConnectorLine index={index} />}
      </div>
    );
  };

  return (
    <div className={`flex ${variant === "horizontal" ? "flex-row" : "flex-col"} ${getSizeClasses().wrapper}`}>
      {steps.map((step, index) => (
        <StepItem key={step.id} step={step} index={index} />
      ))}
    </div>
  );
};

export default StepProgressAnimation;