import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface ExportButtonProps {
  onExportPDF?: () => void;
  onExportCSV?: () => void;
  onExportImage?: () => void;
  isExporting?: boolean;
  className?: string;
}

export const ExportButton = ({
  onExportPDF,
  onExportCSV,
  onExportImage,
  isExporting = false,
  className
}: ExportButtonProps) => {
  const [open, setOpen] = useState(false);
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={className} 
          disabled={isExporting}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onExportPDF && (
          <DropdownMenuItem onClick={() => { setOpen(false); onExportPDF(); }}>
            Export as PDF
          </DropdownMenuItem>
        )}
        {onExportCSV && (
          <DropdownMenuItem onClick={() => { setOpen(false); onExportCSV(); }}>
            Export as CSV
          </DropdownMenuItem>
        )}
        {onExportImage && (
          <DropdownMenuItem onClick={() => { setOpen(false); onExportImage(); }}>
            Export as Image
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};