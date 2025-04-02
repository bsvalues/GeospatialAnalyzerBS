import React, { createContext, ReactNode, useContext, useState, useCallback, useEffect } from 'react';
import { Steps as IntroSteps, StepsProps } from 'intro.js-react';
import 'intro.js/introjs.css';

interface TourStep {
  element: string;
  title: string;
  intro: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  highlightClass?: string;
}

interface TourContextProps {
  // Current tour state
  isTourOpen: boolean;
  currentTourStep: number;
  
  // Tour actions
  startTour: (steps?: TourStep[]) => void;
  endTour: () => void;
  
  // Tour configuration
  steps: TourStep[];
  setSteps: (steps: TourStep[]) => void;
  
  // Intro.js options
  introOptions: StepsProps['options'];
  setIntroOptions: (options: StepsProps['options']) => void;
  
  // Tour management
  onTourExit: (stepIndex: number) => void;
  onTourChange: (stepIndex: number) => void;
  onTourComplete: () => void;
  
  // Tour preferences
  showTourOnFirstVisit: boolean;
  setShowTourOnFirstVisit: (show: boolean) => void;
  hasSeenTour: boolean;
  setHasSeenTour: (seen: boolean) => void;
}

const TourContext = createContext<TourContextProps | undefined>(undefined);

interface TourProviderProps {
  children: ReactNode;
}

export const TourProvider: React.FC<TourProviderProps> = ({ children }) => {
  // Tour state
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [showTourOnFirstVisit, setShowTourOnFirstVisit] = useState(true);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  
  // Intro.js options
  const [introOptions, setIntroOptions] = useState<StepsProps['options']>({
    showProgress: true,
    showBullets: true,
    showStepNumbers: false,
    exitOnOverlayClick: true,
    nextLabel: 'Next',
    prevLabel: 'Back',
    skipLabel: 'Skip',
    doneLabel: 'Done',
    overlayOpacity: 0.75,
    showButtons: true,
    disableInteraction: false,
    scrollToElement: true,
    helperElementPadding: 10,
  });
  
  // Load tour preferences from localStorage on mount
  useEffect(() => {
    const savedHasSeenTour = localStorage.getItem('hasSeenTour');
    const savedShowTourOnFirstVisit = localStorage.getItem('showTourOnFirstVisit');
    
    if (savedHasSeenTour !== null) {
      setHasSeenTour(savedHasSeenTour === 'true');
    }
    
    if (savedShowTourOnFirstVisit !== null) {
      setShowTourOnFirstVisit(savedShowTourOnFirstVisit === 'true');
    }
  }, []);
  
  // Auto-start tour on first visit if enabled
  useEffect(() => {
    if (showTourOnFirstVisit && !hasSeenTour && steps.length > 0) {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showTourOnFirstVisit, hasSeenTour, steps]);
  
  // Save tour preferences to localStorage when they change
  const saveToLocalStorage = useCallback(() => {
    localStorage.setItem('hasSeenTour', hasSeenTour.toString());
    localStorage.setItem('showTourOnFirstVisit', showTourOnFirstVisit.toString());
  }, [hasSeenTour, showTourOnFirstVisit]);
  
  // Only save to localStorage when these values change, not on every render
  useEffect(() => {
    saveToLocalStorage();
  }, [saveToLocalStorage]);
  
  const startTour = useCallback((newSteps?: TourStep[]) => {
    if (newSteps && newSteps.length > 0) {
      setSteps(newSteps);
    }
    setCurrentTourStep(0);
    setIsTourOpen(true);
  }, []);
  
  const endTour = useCallback(() => {
    setIsTourOpen(false);
  }, []);
  
  const onTourExit = useCallback((stepIndex: number) => {
    setIsTourOpen(false);
    setHasSeenTour(true);
  }, []);
  
  const onTourChange = useCallback((stepIndex: number) => {
    setCurrentTourStep(stepIndex);
  }, []);
  
  const onTourComplete = useCallback(() => {
    setIsTourOpen(false);
    setHasSeenTour(true);
  }, []);
  
  const contextValue: TourContextProps = {
    isTourOpen,
    currentTourStep,
    startTour,
    endTour,
    steps,
    setSteps,
    introOptions,
    setIntroOptions,
    onTourExit,
    onTourChange,
    onTourComplete,
    showTourOnFirstVisit,
    setShowTourOnFirstVisit,
    hasSeenTour,
    setHasSeenTour,
  };
  
  return (
    <TourContext.Provider value={contextValue}>
      {children}
      {steps.length > 0 && (
        <IntroSteps
          enabled={isTourOpen}
          steps={steps}
          initialStep={currentTourStep}
          onExit={onTourExit}
          onChange={onTourChange}
          onComplete={onTourComplete}
          options={introOptions}
        />
      )}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextProps => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export default TourProvider;