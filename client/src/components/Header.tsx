import React from 'react';
import { 
  HelpCircle, 
  Bell, 
  Map, 
  Database, 
  Calculator, 
  Building, 
  FileText 
} from 'lucide-react';

interface HeaderProps {
  taxYear: string;
  onTaxYearChange: (year: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ taxYear, onTaxYearChange }) => {
  const availableYears = ['2023', '2024', '2025'];
  
  return (
    <header className="bg-primary/5 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <div className="flex items-center">
          <Map className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold text-primary">Spatialest</h1>
        </div>
        <span className="ml-2 text-sm text-gray-500">GIS Property Valuation Tool</span>
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
    </header>
  );
};

export default Header;