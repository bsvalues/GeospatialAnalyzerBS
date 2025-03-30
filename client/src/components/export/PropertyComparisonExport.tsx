import React from 'react';
import { saveAs } from 'file-saver';
import { Property } from '@/shared/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExportButton } from './ExportButton';
import { ExportDialog } from './ExportDialog';
import { 
  ArrowDownToLine, 
  Table, 
  FileJson, 
  FileText, 
  Settings,
  Filter,
  CheckCircle,
  ChevronDown 
} from 'lucide-react';
import { formatPropertyValue } from '@/services/exportService';

interface PropertyComparisonExportProps {
  properties: Property[];
  metrics: Record<string, any>[];
  visibleMetrics?: string[];
  className?: string;
}

/**
 * Specialized component for exporting property comparison data with
 * enhanced features for metrics filtering and formatting.
 */
export function PropertyComparisonExport({
  properties,
  metrics,
  visibleMetrics,
  className
}: PropertyComparisonExportProps) {
  // Handle CSV export with only visible metrics
  const handleExportFilteredCSV = () => {
    // Start with header row
    let csvContent = '';
    
    // Add title and generation date
    csvContent += '"Property Comparison Report"\r\n';
    csvContent += `"Generated: ${new Date().toLocaleString()}"\r\n\r\n`;
    
    // Determine which metrics to include
    const metricsToInclude = visibleMetrics || 
      (metrics.length > 0 ? Object.keys(metrics[0]) : []);
    
    // Create headers
    const headers = [
      'Property ID',
      'Address',
      ...metricsToInclude
    ];
    
    csvContent += headers.map(header => `"${header}"`).join(',') + '\r\n';
    
    // Add property data rows
    properties.forEach((property, index) => {
      const propertyData = [
        property.id,
        property.address
      ];
      
      // Add metric values for this property
      const metricValues = metricsToInclude.map(metricName => {
        const metricValue = metrics[index]?.[metricName];
        
        // Format the value based on its type
        let formattedValue = '';
        if (metricValue !== undefined && metricValue !== null) {
          // Detect metric format (assuming value format is consistent across properties)
          let format: 'currency' | 'number' | 'text' | 'percent' = 'text';
          
          if (typeof metricValue === 'number') {
            // Simple format detection
            if (metricName.toLowerCase().includes('price') || 
                metricName.toLowerCase().includes('value') ||
                metricName.toLowerCase().includes('cost')) {
              format = 'currency';
            } else if (metricName.toLowerCase().includes('percent') ||
                metricName.toLowerCase().includes('ratio')) {
              format = 'percent';
            } else {
              format = 'number';
            }
          }
          
          formattedValue = formatPropertyValue(metricValue, format);
        }
        
        return formattedValue;
      });
      
      // Combine property data with metric values
      const rowData = [...propertyData, ...metricValues];
      const formattedRow = rowData.map(value => `"${value.replace(/"/g, '""')}"`);
      csvContent += formattedRow.join(',') + '\r\n';
    });
    
    // Create and save the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `property-comparison-${new Date().toISOString().split('T')[0]}.csv`);
  };
  
  // Handle summary export with statistical analysis
  const handleExportSummary = () => {
    // Start with header information
    let txtContent = 'PROPERTY COMPARISON SUMMARY REPORT\r\n';
    txtContent += '=====================================\r\n\r\n';
    txtContent += `Generated: ${new Date().toLocaleString()}\r\n`;
    txtContent += `Properties Analyzed: ${properties.length}\r\n\r\n`;
    
    // Determine which metrics to include
    const metricsToInclude = visibleMetrics || 
      (metrics.length > 0 ? Object.keys(metrics[0]) : []);
    
    // For each metric, calculate summary statistics
    metricsToInclude.forEach(metricName => {
      const metricValues = metrics
        .map(m => m[metricName])
        .filter(v => v !== undefined && v !== null)
        .map(v => typeof v === 'string' ? parseFloat(v) : v)
        .filter(v => !isNaN(v));
      
      if (metricValues.length > 0) {
        // Calculate statistics
        const sum = metricValues.reduce((acc, val) => acc + val, 0);
        const avg = sum / metricValues.length;
        const min = Math.min(...metricValues);
        const max = Math.max(...metricValues);
        
        // Detect metric format for display
        let format: 'currency' | 'number' | 'text' | 'percent' = 'number';
        if (metricName.toLowerCase().includes('price') || 
            metricName.toLowerCase().includes('value') ||
            metricName.toLowerCase().includes('cost')) {
          format = 'currency';
        } else if (metricName.toLowerCase().includes('percent') ||
                  metricName.toLowerCase().includes('ratio')) {
          format = 'percent';
        }
        
        // Add to report
        txtContent += `${metricName}:\r\n`;
        txtContent += `  Average: ${formatPropertyValue(avg, format)}\r\n`;
        txtContent += `  Minimum: ${formatPropertyValue(min, format)}\r\n`;
        txtContent += `  Maximum: ${formatPropertyValue(max, format)}\r\n`;
        txtContent += `  Range: ${formatPropertyValue(max - min, format)}\r\n`;
        txtContent += '\r\n';
      }
    });
    
    // Add property listing
    txtContent += 'PROPERTY DETAILS\r\n';
    txtContent += '===============\r\n\r\n';
    
    properties.forEach((property, index) => {
      txtContent += `Property ${index + 1}: ${property.address}\r\n`;
      txtContent += `  ID: ${property.id}\r\n`;
      txtContent += `  Parcel ID: ${property.parcelId}\r\n`;
      txtContent += `  Value: ${property.value || 'N/A'}\r\n`;
      txtContent += '\r\n';
    });
    
    // Create and save the file
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `property-comparison-summary-${new Date().toISOString().split('T')[0]}.txt`);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={className}
        >
          <ArrowDownToLine className="mr-2 h-4 w-4" />
          Export Comparison
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={handleExportFilteredCSV}>
          <Table className="mr-2 h-4 w-4" />
          <span>Export Visible Metrics (CSV)</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportSummary}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Export Summary Report</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>All Data Formats</DropdownMenuLabel>
        
        {/* Using the generic ExportButton component */}
        <ExportButton 
          properties={properties}
          metrics={metrics}
          exportType="comparison"
          showAdvancedOptions={false}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <FileJson className="mr-2 h-4 w-4" />
              <span>Export All Properties (JSON)</span>
            </DropdownMenuItem>
          }
        />
        
        <DropdownMenuSeparator />
        
        <ExportDialog
          properties={properties}
          metrics={metrics}
          exportType="comparison"
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Advanced Export Options</span>
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}