import React from 'react';
import { motion } from 'framer-motion';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { cn } from '@/lib/utils';
import { TransformationType } from '@/services/etl/ETLTypes';

interface TransformationAnimationProps {
  type: TransformationType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
  isComplete?: boolean;
  onComplete?: () => void;
}

export function TransformationAnimation({
  type,
  className,
  size = 'md',
  isActive = true,
  isComplete = false,
  onComplete
}: TransformationAnimationProps) {
  const containerSize = size === 'sm' ? 'h-24 w-24' : size === 'md' ? 'h-32 w-32' : 'h-48 w-48';
  
  // This effect triggers the onComplete callback when the animation is finished
  React.useEffect(() => {
    if (isComplete && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);
  
  const renderFilterAnimation = () => (
    <div className="relative h-full w-full">
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "rounded-sm",
                size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8',
                i % 3 === 0 ? "bg-primary/70" : "bg-primary/30"
              )}
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: isActive ? 1 : 0,
                y: isActive ? 0 : -10,
                scale: isComplete && i % 3 !== 0 ? 0 : 1
              }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            />
          ))}
        </div>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-2 left-0 right-0 flex items-center justify-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <LoadingAnimation
          type="filtering"
          size={size === 'lg' ? 'md' : 'sm'}
          showText={false}
          loop={!isComplete}
        />
      </motion.div>
    </div>
  );
  
  const renderMapAnimation = () => (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <motion.div
                className={cn(
                  "rounded-sm bg-primary/50",
                  size === 'sm' ? 'h-3 w-8' : size === 'md' ? 'h-4 w-12' : 'h-5 w-16'
                )}
                initial={{ x: -20, opacity: 0 }}
                animate={{ 
                  x: isActive ? 0 : -20,
                  opacity: isActive ? 1 : 0
                }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              />
              
              <motion.div
                animate={{ rotate: isActive ? 360 : 0 }}
                transition={{ 
                  duration: 1,
                  repeat: isComplete ? 0 : Infinity,
                  ease: "linear",
                  delay: i * 0.1
                }}
              >
                <div className={cn(
                  "rounded-full border-2 border-primary border-t-transparent",
                  size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'
                )} />
              </motion.div>
              
              <motion.div
                className={cn(
                  "rounded-sm bg-green-500/50",
                  size === 'sm' ? 'h-3 w-8' : size === 'md' ? 'h-4 w-12' : 'h-5 w-16'
                )}
                initial={{ x: 20, opacity: 0 }}
                animate={{ 
                  x: isActive ? 0 : 20,
                  opacity: isActive ? 1 : 0
                }}
                transition={{ duration: 0.4, delay: i * 0.1 + 0.2 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const renderAggregateAnimation = () => (
    <div className="relative h-full w-full flex items-center justify-center">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, groupIndex) => (
          <div key={groupIndex} className="flex flex-col items-center">
            <div className="flex mb-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "rounded-sm mx-[1px]",
                    size === 'sm' ? 'w-2' : size === 'md' ? 'w-3' : 'w-4',
                    groupIndex === 0 ? "bg-primary/70" : 
                    groupIndex === 1 ? "bg-blue-400/70" : "bg-green-400/70"
                  )}
                  style={{
                    height: `${(i + 1) * (size === 'sm' ? 3 : size === 'md' ? 4 : 5)}px`
                  }}
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ 
                    y: isActive ? 0 : -10,
                    opacity: isActive ? 1 : 0,
                    height: isComplete ? 
                      `${(size === 'sm' ? 9 : size === 'md' ? 12 : 15)}px` : 
                      `${(i + 1) * (size === 'sm' ? 3 : size === 'md' ? 4 : 5)}px`
                  }}
                  transition={{ 
                    duration: 0.4, 
                    delay: i * 0.1 + groupIndex * 0.2
                  }}
                />
              ))}
            </div>
            
            <motion.div 
              className={cn(
                "h-1 rounded-full",
                size === 'sm' ? 'w-6' : size === 'md' ? 'w-9' : 'w-12',
                groupIndex === 0 ? "bg-primary" : 
                groupIndex === 1 ? "bg-blue-400" : "bg-green-400"
              )}
              initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1 : 0 }}
              transition={{ duration: 0.3, delay: groupIndex * 0.1 + 0.6 }}
            />
            
            <motion.div
              className={cn(
                "rounded-sm mt-1",
                size === 'sm' ? 'h-4 w-6' : size === 'md' ? 'h-5 w-9' : 'h-6 w-12',
                groupIndex === 0 ? "bg-primary/20" : 
                groupIndex === 1 ? "bg-blue-400/20" : "bg-green-400/20"
              )}
              initial={{ y: 10, opacity: 0 }}
              animate={{ 
                y: isActive ? 0 : 10,
                opacity: isActive ? 1 : 0,
                scale: isComplete ? 1.1 : 1
              }}
              transition={{ duration: 0.4, delay: groupIndex * 0.1 + 0.9 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderJoinAnimation = () => (
    <div className="relative h-full w-full flex items-center justify-center">
      <div className="relative">
        <div className="flex gap-6 items-center">
          <motion.div
            className={cn(
              "rounded-md border-2 flex flex-col",
              size === 'sm' ? 'h-12 w-8' : size === 'md' ? 'h-16 w-10' : 'h-20 w-14',
              "border-primary overflow-hidden"
            )}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: isActive ? 0 : -20, opacity: isActive ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "border-b border-primary/30 w-full flex-1 flex items-center justify-center",
                  i === 1 && "bg-primary/20"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
              >
                <div className={cn(
                  "rounded-full",
                  size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-1.5 w-1.5' : 'h-2 w-2',
                  "bg-primary"
                )}/>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div
            className="text-primary font-bold"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isActive ? 1 : 0, 
              opacity: isActive ? 1 : 0,
              rotate: isComplete ? 360 : 0
            }}
            transition={{ 
              duration: 0.5, 
              delay: 0.6,
              rotate: { duration: 0.7 }
            }}
          >
            ⟗
          </motion.div>
          
          <motion.div
            className={cn(
              "rounded-md border-2 flex flex-col",
              size === 'sm' ? 'h-12 w-8' : size === 'md' ? 'h-16 w-10' : 'h-20 w-14',
              "border-blue-400 overflow-hidden"
            )}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: isActive ? 0 : 20, opacity: isActive ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "border-b border-blue-400/30 w-full flex-1 flex items-center justify-center",
                  i === 1 && "bg-blue-400/20"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
              >
                <div className={cn(
                  "rounded-full",
                  size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-1.5 w-1.5' : 'h-2 w-2',
                  "bg-blue-400"
                )}/>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        <motion.div
          className={cn(
            "absolute border-2 border-green-500 rounded-md",
            size === 'sm' ? 'h-14 w-10 -bottom-6 left-1/2 -translate-x-1/2' : 
            size === 'md' ? 'h-18 w-12 -bottom-8 left-1/2 -translate-x-1/2' : 
            'h-24 w-16 -bottom-10 left-1/2 -translate-x-1/2',
          )}
          initial={{ y: 20, opacity: 0 }}
          animate={{ 
            y: isActive ? 0 : 20, 
            opacity: isActive ? 1 : 0,
            scale: isComplete ? 1.1 : 1
          }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <div className="h-full w-full p-1 flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "border-b border-green-500/30 w-full flex-1 flex items-center justify-center",
                  i === 1 && "bg-green-500/20"
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 1.2 + i * 0.1 }}
              >
                <div className="flex gap-1 items-center">
                  <div className={cn(
                    "rounded-full",
                    size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-1.5 w-1.5' : 'h-2 w-2',
                    "bg-primary"
                  )}/>
                  <div className={cn(
                    "rounded-full",
                    size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-1.5 w-1.5' : 'h-2 w-2',
                    "bg-blue-400"
                  )}/>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
  
  const renderValidationAnimation = () => (
    <div className="relative h-full w-full flex items-center justify-center">
      <div className="relative grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "rounded-sm relative overflow-hidden",
              size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-7 w-7' : 'h-9 w-9',
              "bg-muted"
            )}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isActive ? 1 : 0,
              scale: isActive ? 1 : 0.8
            }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <motion.div
              className="absolute inset-0 bg-primary/20 flex items-center justify-center"
              initial={{ y: '100%' }}
              animate={{ 
                y: isActive ? (i % 5 === 0 ? '0%' : '100%') : '100%'
              }}
              transition={{ 
                duration: 0.4, 
                delay: 0.4 + i * 0.05
              }}
            >
              {i % 5 === 0 && (
                <motion.svg
                  viewBox="0 0 24 24"
                  className={cn(
                    "text-primary",
                    size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5',
                  )}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? 1 : 0
                  }}
                  transition={{ duration: 0.2, delay: 0.6 + i * 0.05 }}
                >
                  <polyline 
                    points="20 6 9 17 4 12" 
                    fill="none"
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </motion.svg>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
  
  const renderEnrichmentAnimation = () => (
    <div className="relative h-full w-full flex items-center justify-center">
      <div className="relative flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              className={cn(
                "rounded-sm bg-primary/70",
                size === 'sm' ? 'h-3 w-12' : size === 'md' ? 'h-4 w-16' : 'h-5 w-20'
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : -10 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            />
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: isActive ? 1 : 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
            >
              <div className={cn(
                "border-primary border-2 rounded-full flex items-center justify-center",
                size === 'sm' ? 'h-5 w-5' : size === 'md' ? 'h-6 w-6' : 'h-8 w-8'
              )}>
                <motion.div
                  className="bg-primary rounded-full"
                  initial={{ width: 0, height: 0 }}
                  animate={{ 
                    width: isActive ? 
                      (size === 'sm' ? '4px' : size === 'md' ? '5px' : '6px') : '0px',
                    height: isActive ? 
                      (size === 'sm' ? '4px' : size === 'md' ? '5px' : '6px') : '0px',
                  }}
                  transition={{ 
                    duration: 0.3,
                    delay: 0.6 + i * 0.1
                  }}
                />
              </div>
            </motion.div>
            
            <motion.div
              className={cn(
                "rounded-sm relative overflow-hidden",
                size === 'sm' ? 'h-3 w-16' : size === 'md' ? 'h-4 w-20' : 'h-5 w-24'
              )}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 10 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <motion.div
                className="absolute inset-0 bg-green-500/20"
                initial={{ width: '0%' }}
                animate={{ width: isActive ? '100%' : '0%' }}
                transition={{ duration: 1, delay: 0.7 + i * 0.1 }}
              />
              
              <motion.div
                className={cn(
                  "absolute right-1",
                  size === 'sm' ? 'top-0.5' : size === 'md' ? 'top-1' : 'top-1',
                )}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: isActive ? 1 : 0,
                  scale: isActive ? 1 : 0
                }}
                transition={{ duration: 0.2, delay: 1.7 + i * 0.1 }}
              >
                <div className={cn(
                  "rounded-full bg-green-500",
                  size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-2.5 w-2.5' : 'h-3 w-3'
                )} />
              </motion.div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderCustomAnimation = () => (
    <div className="relative h-full w-full flex items-center justify-center">
      <LoadingAnimation
        type="loading"
        size={size}
        showText={false}
        loop={!isComplete}
      />
    </div>
  );
  
  let animation;
  switch (type) {
    case TransformationType.FILTER:
      animation = renderFilterAnimation();
      break;
    case TransformationType.MAP:
      animation = renderMapAnimation();
      break;
    case TransformationType.AGGREGATE:
      animation = renderAggregateAnimation();
      break;
    case TransformationType.JOIN:
      animation = renderJoinAnimation();
      break;
    case TransformationType.VALIDATION:
      animation = renderValidationAnimation();
      break;
    case TransformationType.ENRICHMENT:
      animation = renderEnrichmentAnimation();
      break;
    case TransformationType.CUSTOM:
    default:
      animation = renderCustomAnimation();
      break;
  }
  
  return (
    <div className={cn(
      containerSize,
      "relative rounded-md overflow-hidden bg-background/50",
      className
    )}>
      {animation}
    </div>
  );
}