import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransformationType } from '@/services/etl/ETLTypes';

interface Step {
  id: number;
  type: TransformationType;
  name: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  progress?: number;
  recordsProcessed?: number;
  totalRecords?: number;
  message?: string;
}

interface TransformationProgressProps {
  steps: Step[];
  onComplete?: () => void;
  className?: string;
  compact?: boolean;
}

const getAnimationType = (transformationType: TransformationType) => {
  switch (transformationType) {
    case TransformationType.FILTER:
      return 'filtering';
    case TransformationType.MAP:
    case TransformationType.AGGREGATE:
    case TransformationType.JOIN:
      return 'transforming';
    case TransformationType.VALIDATION:
      return 'analyzing';
    case TransformationType.ENRICHMENT:
      return 'extracting';
    default:
      return 'loading';
  }
};

const StepItem = ({ step, isActive, compact }: { step: Step; isActive: boolean; compact: boolean }) => {
  const animationType = getAnimationType(step.type);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "border rounded-md p-3 mb-2",
        isActive ? "border-primary bg-primary/5" : "border-muted",
        step.status === 'failed' && "border-destructive bg-destructive/5"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {step.status === 'waiting' ? (
            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
          ) : step.status === 'in-progress' ? (
            <LoadingAnimation type={animationType} showText={false} size="sm" />
          ) : step.status === 'completed' ? (
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="h-3 w-3 text-primary" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center">
              <X className="h-3 w-3 text-destructive" />
            </div>
          )}
          <div>
            <div className="font-medium text-sm">{step.name}</div>
            {!compact && step.message && (
              <div className="text-xs text-muted-foreground mt-1">{step.message}</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {step.status === 'in-progress' && step.progress !== undefined && (
            <div className="w-24">
              <Progress value={step.progress} className="h-2" />
            </div>
          )}
          
          <Badge variant={
            step.status === 'completed' ? "default" : 
            step.status === 'failed' ? "destructive" : 
            step.status === 'in-progress' ? "secondary" : 
            "outline"
          }>
            {step.status === 'in-progress' && step.recordsProcessed !== undefined && step.totalRecords !== undefined ? 
              `${step.recordsProcessed}/${step.totalRecords}` : 
              step.status.replace('-', ' ')}
          </Badge>
        </div>
      </div>
      
      {!compact && step.status === 'in-progress' && step.recordsProcessed !== undefined && step.totalRecords !== undefined && (
        <div className="mt-2">
          <Progress value={(step.recordsProcessed / step.totalRecords) * 100} className="h-1" />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{step.recordsProcessed} processed</span>
            <span>{step.totalRecords} total</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export function TransformationProgress({
  steps,
  onComplete,
  className,
  compact = false
}: TransformationProgressProps) {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(
    steps.findIndex(step => step.status === 'in-progress')
  );
  
  const totalSteps = steps.length;
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const failedSteps = steps.filter(step => step.status === 'failed').length;
  const overallProgress = Math.round((completedSteps / totalSteps) * 100);
  
  useEffect(() => {
    const newActiveIndex = steps.findIndex(step => step.status === 'in-progress');
    if (newActiveIndex !== -1) {
      setActiveStepIndex(newActiveIndex);
    }
    
    // Call onComplete when all steps are either completed or failed
    if (completedSteps + failedSteps === totalSteps && onComplete) {
      onComplete();
    }
  }, [steps, completedSteps, failedSteps, totalSteps, onComplete]);
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Transformation Progress</span>
          <span className="text-sm font-medium">{overallProgress}%</span>
        </CardTitle>
        <CardDescription>
          {failedSteps > 0 ? (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              {failedSteps} step{failedSteps > 1 ? 's' : ''} failed
            </span>
          ) : completedSteps === totalSteps ? (
            <span className="flex items-center gap-1 text-primary">
              <Check className="h-4 w-4" />
              All steps completed
            </span>
          ) : (
            `Step ${activeStepIndex + 1} of ${totalSteps}`
          )}
        </CardDescription>
        <Progress value={overallProgress} className="h-2 mt-2" />
      </CardHeader>
      
      <CardContent className="pt-3">
        <AnimatePresence>
          {steps.map((step, index) => (
            <StepItem 
              key={step.id} 
              step={step} 
              isActive={index === activeStepIndex}
              compact={compact}
            />
          ))}
        </AnimatePresence>
      </CardContent>
      
      {!compact && (failedSteps > 0 || completedSteps === totalSteps) && (
        <CardFooter className="pt-0 flex justify-end">
          <div className="text-sm">
            {failedSteps > 0 ? (
              <span className="text-destructive">
                Transformation completed with errors
              </span>
            ) : completedSteps === totalSteps ? (
              <span className="text-primary">
                Transformation completed successfully
              </span>
            ) : null}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}