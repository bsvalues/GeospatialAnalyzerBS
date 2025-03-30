import { saveAs } from 'file-saver';
import { Property } from '@/shared/types';

/**
 * Supported file formats for export operations
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf',
  EXCEL = 'xlsx'
}

/**
 * Configuration options for export operations
 */
export interface ExportOptions {
  fileName?: string;
  includeHeaders?: boolean;
  dateGenerated?: boolean;
  customFields?: string[];
  title?: string;
  description?: string;
}

/**
 * Default options for export operations
 */
const defaultExportOptions: ExportOptions = {
  fileName: 'spatialest-export',
  includeHeaders: true,
  dateGenerated: true,
  customFields: [],
};

/**
 * Service responsible for handling export operations
 */
export class ExportService {
  /**
   * Export property data to a CSV file
   * 
   * @param properties Array of properties to export
   * @param options Export configuration options
   */
  public static exportPropertiesToCSV(
    properties: Property[],
    options: ExportOptions = {}
  ): void {
    const mergedOptions = { ...defaultExportOptions, ...options };
    const { fileName, includeHeaders, dateGenerated } = mergedOptions;
    
    // Define the columns to include
    const headers = [
      'ID',
      'Parcel ID',
      'Address',
      'Owner',
      'Value',
      'Sale Price',
      'Square Feet',
      'Year Built',
      'Land Value',
      'Latitude',
      'Longitude',
      ...mergedOptions.customFields || []
    ];
    
    // Start building the CSV content
    let csvContent = '';
    
    // Add title and description if provided
    if (mergedOptions.title) {
      csvContent += `"${mergedOptions.title}"\r\n`;
    }
    
    if (mergedOptions.description) {
      csvContent += `"${mergedOptions.description}"\r\n`;
    }
    
    // Add generation date if requested
    if (dateGenerated) {
      csvContent += `"Generated: ${new Date().toLocaleString()}"\r\n\r\n`;
    }
    
    // Add headers if requested
    if (includeHeaders) {
      csvContent += headers.map(header => `"${header}"`).join(',') + '\r\n';
    }
    
    // Add data rows
    properties.forEach(property => {
      const row = [
        property.id,
        property.parcelId,
        property.address,
        property.owner || '',
        property.value || '',
        property.salePrice || '',
        property.squareFeet?.toString() || '',
        property.yearBuilt?.toString() || '',
        property.landValue || '',
        property.coordinates ? property.coordinates[0].toString() : '',
        property.coordinates ? property.coordinates[1].toString() : '',
        ...(mergedOptions.customFields || []).map(field => 
          property[field as keyof Property]?.toString() || ''
        )
      ];
      
      // Escape and quote values
      const formattedRow = row.map(value => `"${value.replace(/"/g, '""')}"`);
      csvContent += formattedRow.join(',') + '\r\n';
    });
    
    // Create and save the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${fileName}.csv`);
  }
  
  /**
   * Export property data to a JSON file
   * 
   * @param properties Array of properties to export
   * @param options Export configuration options
   */
  public static exportPropertiesToJSON(
    properties: Property[],
    options: ExportOptions = {}
  ): void {
    const mergedOptions = { ...defaultExportOptions, ...options };
    const { fileName, dateGenerated } = mergedOptions;
    
    // Create the JSON structure
    const exportData: any = {
      properties,
    };
    
    // Add metadata if requested
    if (mergedOptions.title || mergedOptions.description || dateGenerated) {
      exportData.metadata = {};
      
      if (mergedOptions.title) {
        exportData.metadata.title = mergedOptions.title;
      }
      
      if (mergedOptions.description) {
        exportData.metadata.description = mergedOptions.description;
      }
      
      if (dateGenerated) {
        exportData.metadata.generated = new Date().toISOString();
      }
    }
    
    // Create and save the file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], 
      { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${fileName}.json`);
  }
  
  /**
   * Exports analysis report with property metrics
   * 
   * @param properties Array of properties to include in the report
   * @param metrics Analysis metrics for the properties
   * @param options Export configuration options
   */
  public static exportAnalysisReport(
    properties: Property[],
    metrics: Record<string, any>[],
    options: ExportOptions = {}
  ): void {
    const mergedOptions = { ...defaultExportOptions, ...options };
    const { fileName } = mergedOptions;
    
    // Create the CSV content with property details and metrics
    let csvContent = '';
    
    // Add title and description
    if (mergedOptions.title) {
      csvContent += `"${mergedOptions.title}"\r\n`;
    }
    
    if (mergedOptions.description) {
      csvContent += `"${mergedOptions.description}"\r\n`;
    }
    
    // Add generation date
    if (mergedOptions.dateGenerated) {
      csvContent += `"Generated: ${new Date().toLocaleString()}"\r\n\r\n`;
    }
    
    // Create headers from property fields and metrics
    const propertyHeaders = [
      'ID', 
      'Parcel ID', 
      'Address', 
      'Value'
    ];
    
    // Extract metric names from the first metrics object
    const metricHeaders = metrics.length > 0 
      ? Object.keys(metrics[0])
      : [];
    
    const allHeaders = [...propertyHeaders, ...metricHeaders];
    csvContent += allHeaders.map(header => `"${header}"`).join(',') + '\r\n';
    
    // Add data rows for each property
    properties.forEach((property, index) => {
      const propertyValues = [
        property.id,
        property.parcelId,
        property.address,
        property.value || ''
      ];
      
      // Add metrics for this property
      const metricValues = metrics[index] 
        ? metricHeaders.map(header => metrics[index][header]?.toString() || '')
        : metricHeaders.map(() => '');
      
      const row = [...propertyValues, ...metricValues];
      const formattedRow = row.map(value => `"${value.replace(/"/g, '""')}"`);
      csvContent += formattedRow.join(',') + '\r\n';
    });
    
    // Create and save the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${fileName}.csv`);
  }
}

/**
 * Utility function to format a property value for display or export
 * 
 * @param value Property value to format
 * @param format Format to apply (currency, number, text, etc.)
 * @returns Formatted string value
 */
export function formatPropertyValue(
  value: any, 
  format: 'currency' | 'number' | 'text' | 'percent' | 'date' = 'text'
): string {
  if (value === undefined || value === null) {
    return '';
  }
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(Number(value));
      
    case 'number':
      return new Intl.NumberFormat('en-US').format(Number(value));
      
    case 'percent':
      return new Intl.NumberFormat('en-US', { 
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(Number(value) / 100);
      
    case 'date':
      return new Date(value).toLocaleDateString();
      
    case 'text':
    default:
      return value.toString();
  }
}