import React from 'react';
import { Map, Building, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  taxYear: string;
  onTaxYearChange: (year: string) => void;
}

const Header: React.FC<HeaderProps> = ({ taxYear, onTaxYearChange }) => {
  return (
    <header className="border-b bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-indigo-950 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Map size={24} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Spatial<span className="text-primary">est</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              GIS Property Appraisal Platform
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 flex items-center gap-1 border-primary/20">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="font-normal">Benton County, WA</span>
            </Badge>
            
            <Badge variant="secondary" className="px-3 py-1 flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              <span className="font-normal">Assessment {taxYear}</span>
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Select value={taxYear} onValueChange={onTaxYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Tax Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
            
            <Button size="sm">
              Connect
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
