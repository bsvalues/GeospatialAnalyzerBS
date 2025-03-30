import React from 'react';
import { Map, Building } from 'lucide-react';

interface HeaderProps {
  taxYear: string;
  onTaxYearChange: (year: string) => void;
}

const Header: React.FC<HeaderProps> = ({ taxYear, onTaxYearChange }) => {
  return (
    <header className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg">
            <Map size={24} className="text-blue-200" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Spatial<span className="text-blue-300">est</span></h1>
            <p className="text-xs text-blue-200">GIS Property Appraisal Platform</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-1">
            <Building size={16} className="text-blue-300" />
            <span>Benton County Assessment 2024</span>
          </div>
          <div className="flex space-x-2">
            <select 
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
              value={taxYear}
              onChange={(e) => onTaxYearChange(e.target.value)}
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-3 py-1 rounded text-sm flex items-center">
              Connect
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
