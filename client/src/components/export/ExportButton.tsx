import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  ArrowDownToLine, 
  Table, 
  FileJson, 
  FilePdf, 
  FileSpreadsheet,
  Settings,
} from 'lucide-react';
import { Property } from '@/shared/types';
import { ExportService } from '@/services/exportService';
import { ExportDialog } from './ExportDialog';

interface ExportButtonProps extends Omit<ButtonProps, 'onClick'> {
  properties: Property[];
  metrics?: Record<string, any>[];
  exportType?: 'properties' | 'analysis' | 'comparison';
  showAdvancedOptions?: boolean;
  fileName?: string;
}

export function ExportButton({
  properties,
  metrics,
  exportType = 'properties',
  showAdvancedOptions = true,
  fileName,
  ...props
}: ExportButtonProps) {
  const defaultFileName = fileName || `spatialest-${exportType}-${new Date().toISOString().split('T')[0]}`;
  
  const handleExportCSV = () => {
    ExportService.exportPropertiesToCSV(properties, {
      fileName: defaultFileName,
    });
  };
  
  const handleExportJSON = () => {
    ExportService.exportPropertiesToJSON(properties, {
      fileName: defaultFileName,
    });
  };
  
  const handleExportAnalysisReport = () => {
    if (metrics) {
      ExportService.exportAnalysisReport(properties, metrics, {
        fileName: defaultFileName,
      });
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={props.variant || "outline"} 
          size={props.size || "sm"}
          className={props.className}
        >
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <Table className="mr-2 h-4 w-4" />
          <span>Export as CSV</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}>
          <FileJson className="mr-2 h-4 w-4" />
          <span>Export as JSON</span>
        </DropdownMenuItem>
        
        {/* Disabled options for future implementation */}
        <DropdownMenuItem disabled>
          <FilePdf className="mr-2 h-4 w-4" />
          <span>Export as PDF (Coming Soon)</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Export as Excel (Coming Soon)</span>
        </DropdownMenuItem>
        
        {exportType === 'analysis' && metrics && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportAnalysisReport}>
              <Table className="mr-2 h-4 w-4" />
              <span>Export Analysis Report</span>
            </DropdownMenuItem>
          </>
        )}
        
        {showAdvancedOptions && (
          <>
            <DropdownMenuSeparator />
            <ExportDialog
              properties={properties}
              metrics={metrics}
              exportType={exportType}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Advanced Export Options</span>
                </DropdownMenuItem>
              }
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}