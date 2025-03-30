import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MapAccessibilityContextProps {
  /** Enable or disable high contrast mode */
  highContrastMode: boolean;
  /** Toggle high contrast mode */
  toggleHighContrastMode: () => void;
  
  /** Enable or disable keyboard navigation */
  keyboardNavigation: boolean;
  /** Toggle keyboard navigation */
  toggleKeyboardNavigation: () => void;
  
  /** Enable or disable screen reader announcements */
  screenReaderAnnouncements: boolean;
  /** Toggle screen reader announcements */
  toggleScreenReaderAnnouncements: () => void;
  
  /** Current font size scaling factor */
  fontSizeScale: number;
  /** Increase font size */
  increaseFontSize: () => void;
  /** Decrease font size */
  decreaseFontSize: () => void;
  /** Reset font size to default */
  resetFontSize: () => void;
  
  /** Enable or disable reduced motion */
  reducedMotion: boolean;
  /** Toggle reduced motion */
  toggleReducedMotion: () => void;
  
  /** Announce a message to screen readers */
  announceToScreenReader: (message: string) => void;
}

const MapAccessibilityContext = createContext<MapAccessibilityContextProps | undefined>(undefined);

/**
 * Provider component for map accessibility settings
 */
export const MapAccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Accessibility states
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(true);
  const [screenReaderAnnouncements, setScreenReaderAnnouncements] = useState(true);
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Toggle functions
  const toggleHighContrastMode = () => setHighContrastMode(prev => !prev);
  const toggleKeyboardNavigation = () => setKeyboardNavigation(prev => !prev);
  const toggleScreenReaderAnnouncements = () => setScreenReaderAnnouncements(prev => !prev);
  const toggleReducedMotion = () => setReducedMotion(prev => !prev);
  
  // Font size functions
  const increaseFontSize = () => setFontSizeScale(prev => Math.min(prev + 0.1, 1.5));
  const decreaseFontSize = () => setFontSizeScale(prev => Math.max(prev - 0.1, 0.8));
  const resetFontSize = () => setFontSizeScale(1);
  
  // Screen reader announcement function
  const announceToScreenReader = (message: string) => {
    if (!screenReaderAnnouncements) return;
    
    let announceElement = document.getElementById('map-announcements');
    
    // Create the announcement element if it doesn't exist
    if (!announceElement) {
      announceElement = document.createElement('div');
      announceElement.id = 'map-announcements';
      announceElement.className = 'sr-only';
      announceElement.setAttribute('aria-live', 'polite');
      announceElement.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announceElement);
    }
    
    // Set the message
    announceElement.textContent = message;
  };
  
  const value = {
    highContrastMode,
    toggleHighContrastMode,
    keyboardNavigation,
    toggleKeyboardNavigation,
    screenReaderAnnouncements,
    toggleScreenReaderAnnouncements,
    fontSizeScale,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    reducedMotion,
    toggleReducedMotion,
    announceToScreenReader
  };
  
  return (
    <MapAccessibilityContext.Provider value={value}>
      {children}
    </MapAccessibilityContext.Provider>
  );
};

/**
 * Hook to use map accessibility settings
 */
export const useMapAccessibility = (): MapAccessibilityContextProps => {
  const context = useContext(MapAccessibilityContext);
  if (context === undefined) {
    throw new Error('useMapAccessibility must be used within a MapAccessibilityProvider');
  }
  return context;
};

// Export the context for testing
export { MapAccessibilityContext };