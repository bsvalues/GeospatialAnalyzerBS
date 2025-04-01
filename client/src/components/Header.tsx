import React from 'react';
import { 
  HelpCircle, 
  Bell, 
  Map, 
  Database, 
  Calculator, 
  Building, 
  FileText,
  Accessibility,
  TrendingUp,
  Home
} from 'lucide-react';
import { Link } from 'wouter';
import { useMapAccessibility } from '@/contexts/MapAccessibilityContext';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  taxYear: string;
  onTaxYearChange: (year: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ taxYear, onTaxYearChange }) => {
  const availableYears = ['2023', '2024', '2025'];
  const { 
    highContrastMode, 
    toggleHighContrastMode,
    keyboardNavigation,
    toggleKeyboardNavigation,
    screenReaderAnnouncements,
    toggleScreenReaderAnnouncements,
    reducedMotion,
    toggleReducedMotion,
    fontSizeScale,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize
  } = useMapAccessibility();
  const { toast } = useToast();
  
  // State for accessibility dialog
  const [isAccessibilityDialogOpen, setIsAccessibilityDialogOpen] = React.useState(false);
  
  const handleAccessibilityToggle = (setting: string) => {
    switch (setting) {
      case 'highContrast':
        toggleHighContrastMode();
        toast({
          title: `High contrast mode ${highContrastMode ? 'disabled' : 'enabled'}`,
          description: `Map display is now in ${highContrastMode ? 'standard' : 'high contrast'} mode`,
        });
        break;
      case 'keyboard':
        toggleKeyboardNavigation();
        toast({
          title: `Keyboard navigation ${keyboardNavigation ? 'disabled' : 'enabled'}`,
          description: `You can ${keyboardNavigation ? 'no longer' : 'now'} navigate the map using arrow keys`,
        });
        break;
      case 'screenReader':
        toggleScreenReaderAnnouncements();
        toast({
          title: `Screen reader support ${screenReaderAnnouncements ? 'disabled' : 'enabled'}`,
          description: `Screen reader annotations are now ${screenReaderAnnouncements ? 'disabled' : 'enabled'}`,
        });
        break;
      case 'reducedMotion':
        toggleReducedMotion();
        toast({
          title: `Reduced motion ${reducedMotion ? 'disabled' : 'enabled'}`,
          description: `Map animations are now ${reducedMotion ? 'enabled' : 'disabled'}`,
        });
        break;
    }
  };
  
  return (
    <header className="bg-primary/5 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <div className="flex items-center">
          <Map className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold text-primary">GIS_BS</h1>
        </div>
        <span className="ml-2 text-sm text-gray-500">Property Valuation & Analysis Platform</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-gray-500">
          <div className="flex items-center px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer">
            <Map className="h-4 w-4 mr-1" />
            <span className="text-sm">Layers</span>
          </div>
          <div className="flex items-center px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer">
            <Database className="h-4 w-4 mr-1" />
            <span className="text-sm">Data</span>
          </div>
          <div className="flex items-center px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer">
            <Calculator className="h-4 w-4 mr-1" />
            <span className="text-sm">Analysis</span>
          </div>
          <div className="flex items-center px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer">
            <Building className="h-4 w-4 mr-1" />
            <span className="text-sm">Properties</span>
          </div>
          <div className="flex items-center px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer">
            <FileText className="h-4 w-4 mr-1" />
            <span className="text-sm">Reports</span>
          </div>
          <Link href="/trends">
            <div className="flex items-center px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="text-sm">Trends</span>
            </div>
          </Link>
          <Link href="/neighborhoods">
            <div className="flex items-center px-3 py-1 rounded-md hover:bg-gray-100 cursor-pointer">
              <Home className="h-4 w-4 mr-1" />
              <span className="text-sm">Neighborhoods</span>
            </div>
          </Link>
        </div>
        
        <div className="mr-4 border-r pr-4">
          <label htmlFor="taxYear" className="block text-xs text-gray-500 mb-1">
            Tax Year
          </label>
          <select
            id="taxYear"
            className="border border-gray-300 rounded px-3 py-1 text-sm"
            value={taxYear}
            onChange={(e) => onTaxYearChange(e.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Accessibility button */}
          <button
            className={`text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 ${
              highContrastMode || keyboardNavigation || screenReaderAnnouncements || reducedMotion 
                ? 'bg-primary/20 text-primary' 
                : ''
            }`}
            aria-label="Accessibility settings"
            onClick={() => setIsAccessibilityDialogOpen(true)}
            title="Accessibility settings"
          >
            <Accessibility className="h-5 w-5" />
          </button>
          
          <button
            className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          
          <button
            className="text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="relative">
            <button
              className="flex items-center"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center text-white font-medium">
                AS
              </div>
              <span className="ml-2 text-sm font-medium">Admin</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Accessibility Dialog */}
      {isAccessibilityDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessibility-dialog-title"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 id="accessibility-dialog-title" className="text-xl font-semibold">Accessibility Settings</h2>
              <button 
                onClick={() => setIsAccessibilityDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Display Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="high-contrast" className="text-sm">High Contrast Mode</label>
                    <button 
                      id="high-contrast"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${highContrastMode ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('highContrast')}
                      role="switch"
                      aria-checked={highContrastMode}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${highContrastMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="reduced-motion" className="text-sm">Reduced Motion</label>
                    <button 
                      id="reduced-motion"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${reducedMotion ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('reducedMotion')}
                      role="switch"
                      aria-checked={reducedMotion}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${reducedMotion ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="pt-2">
                    <label className="text-sm">Font Size</label>
                    <div className="flex items-center space-x-4 mt-2">
                      <button
                        onClick={decreaseFontSize}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded"
                        aria-label="Decrease font size"
                      >
                        A-
                      </button>
                      <div className="flex-grow text-center text-sm">
                        {Math.round(fontSizeScale * 100)}%
                      </div>
                      <button
                        onClick={increaseFontSize}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded"
                        aria-label="Increase font size"
                      >
                        A+
                      </button>
                      <button
                        onClick={resetFontSize}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs py-1 px-3 rounded"
                        aria-label="Reset font size"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Navigation Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="keyboard-nav" className="text-sm">Keyboard Navigation</label>
                    <button 
                      id="keyboard-nav"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${keyboardNavigation ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('keyboard')}
                      role="switch"
                      aria-checked={keyboardNavigation}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${keyboardNavigation ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="screen-reader" className="text-sm">Screen Reader Support</label>
                    <button 
                      id="screen-reader"
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${screenReaderAnnouncements ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('screenReader')}
                      role="switch"
                      aria-checked={screenReaderAnnouncements}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${screenReaderAnnouncements ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Keyboard Shortcuts</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-mono bg-gray-100 px-1 rounded">↑ ↓ ← →</span>: Pan map</p>
                  <p><span className="font-mono bg-gray-100 px-1 rounded">+</span> or <span className="font-mono bg-gray-100 px-1 rounded">-</span>: Zoom in/out</p>
                  <p><span className="font-mono bg-gray-100 px-1 rounded">Tab</span>: Navigate through properties</p>
                  <p><span className="font-mono bg-gray-100 px-1 rounded">Enter</span>: Select focused property</p>
                  <p><span className="font-mono bg-gray-100 px-1 rounded">Esc</span>: Close popups or dialogs</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsAccessibilityDialogOpen(false)}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;