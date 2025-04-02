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
  Home,
  Code,
  Settings
} from 'lucide-react';
import { Link } from 'wouter';
import { useMapAccessibility } from '@/contexts/MapAccessibilityContext';
import { useToast } from '@/hooks/use-toast';
import { TourButton } from './TourButton';
import { useTour } from '@/contexts/TourContext';

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
  
  // Set up the guided tour
  const { startTour, hasSeenTour } = useTour();
  
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
    <header className="bg-gradient-to-r from-primary/90 to-primary/70 text-white shadow-md px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <div className="flex items-center">
          <div className="bg-white p-1.5 rounded-lg shadow-sm mr-2">
            <Map className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">GIS_BS</h1>
        </div>
        <span className="ml-3 text-sm text-white/80 font-light tracking-wide border-l border-white/20 pl-3">Property Valuation & Analysis Platform</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-1 text-white/90">
          <div className="flex items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 cursor-pointer">
            <Map className="h-4 w-4 mr-1.5" />
            <span className="text-sm font-medium">Layers</span>
          </div>
          <div className="flex items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 cursor-pointer">
            <Database className="h-4 w-4 mr-1.5" />
            <span className="text-sm font-medium">Data</span>
          </div>
          <div className="flex items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 cursor-pointer">
            <Calculator className="h-4 w-4 mr-1.5" />
            <span className="text-sm font-medium">Analysis</span>
          </div>
          <div className="flex items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 cursor-pointer">
            <Building className="h-4 w-4 mr-1.5" />
            <span className="text-sm font-medium">Properties</span>
          </div>
          <div className="flex items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 cursor-pointer">
            <FileText className="h-4 w-4 mr-1.5" />
            <span className="text-sm font-medium">Reports</span>
          </div>
          <Link href="/trends">
            <div className="flex items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 cursor-pointer">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-medium">Trends</span>
            </div>
          </Link>
          <Link href="/neighborhoods">
            <div className="flex items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 cursor-pointer">
              <Home className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-medium">Neighborhoods</span>
            </div>
          </Link>
          <Link href="/scripting">
            <div className="flex items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 cursor-pointer">
              <Code className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-medium">Scripting</span>
            </div>
          </Link>
          <Link href="/etl">
            <div className="flex items-center px-3 py-1.5 rounded-md hover:bg-white/10 transition-all duration-200 cursor-pointer">
              <Settings className="h-4 w-4 mr-1.5" />
              <span className="text-sm font-medium">ETL</span>
            </div>
          </Link>
        </div>
        
        <div className="mr-4 border-r border-white/20 pr-4">
          <label htmlFor="taxYear" className="block text-xs text-white/80 mb-1">
            Tax Year
          </label>
          <select
            id="taxYear"
            className="bg-white/10 border border-white/20 rounded-md px-3 py-1 text-sm text-white focus:ring-2 focus:ring-white/30 focus:outline-none"
            value={taxYear}
            onChange={(e) => onTaxYearChange(e.target.value)}
          >
            {availableYears.map((year) => (
              <option key={year} value={year} className="text-gray-800">
                {year}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Accessibility button */}
          <button
            className={`text-white hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all duration-200 ${
              highContrastMode || keyboardNavigation || screenReaderAnnouncements || reducedMotion 
                ? 'bg-white/20 ring-2 ring-white/30' 
                : ''
            }`}
            aria-label="Accessibility settings"
            onClick={() => setIsAccessibilityDialogOpen(true)}
            title="Accessibility settings"
          >
            <Accessibility className="h-5 w-5" />
          </button>
          
          {/* Tour Guide Button */}
          <TourButton 
            variant="ghost"
            size="icon"
            className="text-white hover:text-white hover:bg-white/10 transition-colors"
            showTooltip={true}
            tooltipContent={hasSeenTour ? 'Restart guided tour' : 'Start guided tour'}
          />
          
          <button
            className="text-white hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all duration-200 relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full shadow-sm"></span>
          </button>
          
          <div className="relative">
            <button
              className="flex items-center group"
              aria-label="User menu"
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-medium border-2 border-white/30 shadow-sm group-hover:border-white transition-all duration-200">
                AS
              </div>
              <span className="ml-2 text-sm font-medium hidden md:inline">Admin</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Accessibility Dialog */}
      {isAccessibilityDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm transition-all duration-300">
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-100"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessibility-dialog-title"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Accessibility className="h-5 w-5 text-primary" />
                </div>
                <h2 id="accessibility-dialog-title" className="text-xl font-semibold text-gray-800">Accessibility</h2>
              </div>
              <button 
                onClick={() => setIsAccessibilityDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition-colors duration-200"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                  <span className="inline-block p-1 bg-primary/10 rounded-md">
                    <HelpCircle className="h-4 w-4 text-primary" />
                  </span>
                  Display Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <label htmlFor="high-contrast" className="text-sm font-medium">High Contrast Mode</label>
                    <button 
                      id="high-contrast"
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${highContrastMode ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('highContrast')}
                      role="switch"
                      aria-checked={highContrastMode}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${highContrastMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <label htmlFor="reduced-motion" className="text-sm font-medium">Reduced Motion</label>
                    <button 
                      id="reduced-motion"
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${reducedMotion ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('reducedMotion')}
                      role="switch"
                      aria-checked={reducedMotion}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${reducedMotion ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="pt-2 bg-white p-3 rounded-lg shadow-sm">
                    <label className="text-sm font-medium">Font Size</label>
                    <div className="flex items-center space-x-3 mt-3">
                      <button
                        onClick={decreaseFontSize}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1.5 px-3 rounded-lg transition-colors duration-200"
                        aria-label="Decrease font size"
                      >
                        A-
                      </button>
                      <div className="flex-grow text-center">
                        <div className="text-xl font-semibold text-primary">
                          {Math.round(fontSizeScale * 100)}%
                        </div>
                      </div>
                      <button
                        onClick={increaseFontSize}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1.5 px-3 rounded-lg transition-colors duration-200"
                        aria-label="Increase font size"
                      >
                        A+
                      </button>
                      <button
                        onClick={resetFontSize}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs py-1.5 px-3 rounded-lg transition-colors duration-200"
                        aria-label="Reset font size"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                  <span className="inline-block p-1 bg-primary/10 rounded-md">
                    <Map className="h-4 w-4 text-primary" />
                  </span>
                  Navigation Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <label htmlFor="keyboard-nav" className="text-sm font-medium">Keyboard Navigation</label>
                    <button 
                      id="keyboard-nav"
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${keyboardNavigation ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('keyboard')}
                      role="switch"
                      aria-checked={keyboardNavigation}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${keyboardNavigation ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <label htmlFor="screen-reader" className="text-sm font-medium">Screen Reader Support</label>
                    <button 
                      id="screen-reader"
                      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300 ${screenReaderAnnouncements ? 'bg-primary' : 'bg-gray-200'}`}
                      onClick={() => handleAccessibilityToggle('screenReader')}
                      role="switch"
                      aria-checked={screenReaderAnnouncements}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${screenReaderAnnouncements ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                  <span className="inline-block p-1 bg-primary/10 rounded-md">
                    <FileText className="h-4 w-4 text-primary" />
                  </span>
                  Keyboard Shortcuts
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">↑ ↓ ← →</span>
                    <span className="text-gray-700">Pan map</span>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">+</span>
                    <span className="text-gray-500 mx-1">or</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">-</span>
                    <span className="text-gray-700">Zoom in/out</span>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">Tab</span>
                    <span className="text-gray-700">Navigate through properties</span>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">Enter</span>
                    <span className="text-gray-700">Select focused property</span>
                  </div>
                  <div className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded-md mr-2 text-primary font-medium">Esc</span>
                    <span className="text-gray-700">Close popups or dialogs</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsAccessibilityDialogOpen(false)}
                className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary/90 shadow-sm transition-colors duration-200 font-medium"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;