import React from 'react';
import { Map, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HeaderProps {
  taxYear: string;
  onTaxYearChange: (year: string) => void;
}

const Header: React.FC<HeaderProps> = ({ taxYear, onTaxYearChange }) => {
  return (
    <header className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white p-4">
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
            <span>Benton County Assessment {taxYear}</span>
          </div>
          <div className="flex space-x-2">
            <Select 
              value={taxYear}
              onValueChange={onTaxYearChange}
            >
              <SelectTrigger className="w-[100px] h-9 bg-gray-800 border border-gray-700 text-white">
                <SelectValue placeholder="Tax Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="default" size="sm">
              Connect
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;