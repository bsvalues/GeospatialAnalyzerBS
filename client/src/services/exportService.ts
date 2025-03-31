import { saveAs } from 'file-saver';
import { Property } from '@shared/schema';

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
 * Available export templates
 */
export enum ExportTemplate {
  DEFAULT = 'default',
  RESIDENTIAL_DETAIL = 'residential-detail',
  COMMERCIAL_DETAIL = 'commercial-detail',
  VALUATION_SUMMARY = 'valuation-summary',
  COMPARATIVE_ANALYSIS = 'comparative-analysis',
  NEIGHBORHOOD_REPORT = 'neighborhood-report'
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
  pageSize?: 'letter' | 'legal' | 'a4' | 'a3';
  orientation?: 'portrait' | 'landscape';
  includeImages?: boolean;
  templateOptions?: Record<string, any>;
}

/**
 * Default options for export operations
 */
const defaultExportOptions: ExportOptions = {
  fileName: 'spatialest-export',
  includeHeaders: true,
  dateGenerated: true,
  customFields: [],
  pageSize: 'letter',
  orientation: 'portrait',
  includeImages: true
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
        property.coordinates ? (property.coordinates as any)[0]?.toString() : '',
        property.coordinates ? (property.coordinates as any)[1]?.toString() : '',
        ...(mergedOptions.customFields || []).map(field => 
          property[field as keyof Property]?.toString() || ''
        )
      ];
      
      // Escape and quote values
      const formattedRow = row.map(value => `"${String(value).replace(/"/g, '""')}"`);
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
   * Export property data to an Excel file
   * 
   * @param properties Array of properties to export
   * @param options Export configuration options
   */
  public static exportPropertiesToExcel(
    properties: Property[],
    options: ExportOptions = {}
  ): void {
    const mergedOptions = { ...defaultExportOptions, ...options };
    const { fileName } = mergedOptions;
    
    // For Excel format, we'll first convert to CSV
    // Then use a library in the future to convert to proper Excel format
    // For now, we'll create a CSV with Excel extension
    
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
      'Neighborhood',
      'Property Type',
      ...mergedOptions.customFields || []
    ];
    
    // Start building the Excel-compatible CSV content
    let csvContent = '';
    
    // Add metadata as a header section
    if (mergedOptions.title) {
      csvContent += `"${mergedOptions.title}"\r\n`;
    }
    
    if (mergedOptions.description) {
      csvContent += `"${mergedOptions.description}"\r\n`;
    }
    
    if (mergedOptions.dateGenerated) {
      csvContent += `"Generated: ${new Date().toLocaleString()}"\r\n\r\n`;
    }
    
    // Add column headers
    csvContent += headers.map(header => `"${header}"`).join(',') + '\r\n';
    
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
        property.latitude?.toString() || '',
        property.longitude?.toString() || '',
        property.neighborhood || '',
        property.propertyType || '',
        ...(mergedOptions.customFields || []).map(field => 
          property[field as keyof Property]?.toString() || ''
        )
      ];
      
      // Escape and quote values for Excel compatibility
      const formattedRow = row.map(value => `"${String(value).replace(/"/g, '""')}"`);
      csvContent += formattedRow.join(',') + '\r\n';
    });
    
    // Create and save the file with .xlsx extension
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
    saveAs(blob, `${fileName}.xlsx`);
  }
  
  /**
   * Export property data to a PDF file
   * 
   * @param properties Array of properties to export
   * @param options Export configuration options
   */
  public static exportPropertiesToPDF(
    properties: Property[],
    options: ExportOptions = {}
  ): void {
    const mergedOptions = { ...defaultExportOptions, ...options };
    
    // Create a simple PDF document structure in HTML
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${mergedOptions.title || 'Property Export'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          h1 { color: #2c3e50; }
          .metadata { margin-bottom: 20px; color: #7f8c8d; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #3498db; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <h1>${mergedOptions.title || 'Property Export'}</h1>
        
        <div class="metadata">
          ${mergedOptions.description ? `<p>${mergedOptions.description}</p>` : ''}
          ${mergedOptions.dateGenerated ? `<p>Generated: ${new Date().toLocaleString()}</p>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Parcel ID</th>
              <th>Address</th>
              <th>Value</th>
              <th>Square Feet</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Add property rows
    properties.forEach(property => {
      htmlContent += `
        <tr>
          <td>${property.parcelId}</td>
          <td>${property.address}</td>
          <td>${property.value || 'N/A'}</td>
          <td>${property.squareFeet || 'N/A'}</td>
          <td>${property.propertyType || 'N/A'}</td>
        </tr>
      `;
    });
    
    // Close the HTML structure
    htmlContent += `
          </tbody>
        </table>
        
        <div class="footer">
          <p>Spatialest Property Appraisal Platform</p>
          <p>Copyright © ${new Date().getFullYear()} Spatialest</p>
        </div>
      </body>
      </html>
    `;
    
    // For now, output an HTML file with PDF mime type
    // In a production app, we would use a proper PDF generation library
    const blob = new Blob([htmlContent], { type: 'application/pdf' });
    saveAs(blob, `${mergedOptions.fileName}.pdf`);
  }
  
  /**
   * Export property data using a specific template
   * 
   * @param properties Array of properties to export
   * @param templateName Name of the template to use
   * @param format Export file format
   * @param options Export configuration options
   */
  public static exportWithTemplate(
    properties: Property[],
    templateName: string,
    format: ExportFormat = ExportFormat.PDF,
    options: ExportOptions = {}
  ): void {
    const mergedOptions = { ...defaultExportOptions, ...options };
    
    // Load a template based on the name
    let templateHtml = '';
    
    switch (templateName) {
      case ExportTemplate.RESIDENTIAL_DETAIL:
        templateHtml = ExportService.getResidentialDetailTemplate(properties, mergedOptions);
        break;
      case ExportTemplate.COMMERCIAL_DETAIL:
        templateHtml = ExportService.getCommercialDetailTemplate(properties, mergedOptions);
        break;
      case ExportTemplate.VALUATION_SUMMARY:
        templateHtml = ExportService.getValuationSummaryTemplate(properties, mergedOptions);
        break;
      case ExportTemplate.COMPARATIVE_ANALYSIS:
        templateHtml = ExportService.getComparativeAnalysisTemplate(properties, mergedOptions);
        break;
      case ExportTemplate.NEIGHBORHOOD_REPORT:
        templateHtml = ExportService.getNeighborhoodReportTemplate(properties, mergedOptions);
        break;
      default:
        templateHtml = ExportService.getDefaultTemplate(properties, mergedOptions);
    }
    
    // Export in the requested format
    switch (format) {
      case ExportFormat.PDF:
        const pdfBlob = new Blob([templateHtml], { type: 'application/pdf' });
        saveAs(pdfBlob, `${mergedOptions.fileName}.pdf`);
        break;
      case ExportFormat.EXCEL:
        // Convert the template to Excel compatible format
        ExportService.exportPropertiesToExcel(properties, mergedOptions);
        break;
      case ExportFormat.JSON:
        // Add template metadata to JSON export
        mergedOptions.templateOptions = { templateName };
        ExportService.exportPropertiesToJSON(properties, mergedOptions);
        break;
      case ExportFormat.CSV:
      default:
        ExportService.exportPropertiesToCSV(properties, mergedOptions);
    }
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
      const formattedRow = row.map(value => `"${String(value).replace(/"/g, '""')}"`);
      csvContent += formattedRow.join(',') + '\r\n';
    });
    
    // Create and save the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${fileName}.csv`);
  }
  
  // Private template generation methods
  private static getDefaultTemplate(properties: Property[], options: ExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${options.title || 'Property Report'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          h1 { color: #2c3e50; }
          .metadata { margin-bottom: 20px; color: #7f8c8d; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #3498db; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <h1>${options.title || 'Property Report'}</h1>
        
        <div class="metadata">
          ${options.description ? `<p>${options.description}</p>` : ''}
          ${options.dateGenerated ? `<p>Generated: ${new Date().toLocaleString()}</p>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Parcel ID</th>
              <th>Address</th>
              <th>Value</th>
              <th>Square Feet</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            ${properties.map(property => `
              <tr>
                <td>${property.parcelId}</td>
                <td>${property.address}</td>
                <td>${property.value || 'N/A'}</td>
                <td>${property.squareFeet || 'N/A'}</td>
                <td>${property.propertyType || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Spatialest Property Appraisal Platform</p>
          <p>Copyright © ${new Date().getFullYear()} Spatialest</p>
        </div>
      </body>
      </html>
    `;
  }
  
  private static getResidentialDetailTemplate(properties: Property[], options: ExportOptions): string {
    // Specialized template for residential properties with more detailed information
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Residential Property Detail Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          h1 { color: #2c3e50; }
          .property-card { border: 1px solid #ddd; margin-bottom: 30px; padding: 20px; }
          .property-header { background-color: #3498db; color: white; padding: 10px; margin: -20px -20px 20px; }
          .property-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .detail-item { margin-bottom: 10px; }
          .label { font-weight: bold; color: #7f8c8d; }
          .value { font-size: 16px; }
        </style>
      </head>
      <body>
        <h1>Residential Property Detail Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        ${properties.map(property => `
          <div class="property-card">
            <div class="property-header">
              <h2>${property.address}</h2>
              <p>Parcel ID: ${property.parcelId}</p>
            </div>
            
            <div class="property-details">
              <div class="detail-item">
                <div class="label">Property Value</div>
                <div class="value">${property.value || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Year Built</div>
                <div class="value">${property.yearBuilt || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Square Feet</div>
                <div class="value">${property.squareFeet || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Land Value</div>
                <div class="value">${property.landValue || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Bedrooms</div>
                <div class="value">${property.bedrooms || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Bathrooms</div>
                <div class="value">${property.bathrooms || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Lot Size</div>
                <div class="value">${property.lotSize || 'N/A'} sq ft</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Neighborhood</div>
                <div class="value">${property.neighborhood || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Last Sale Date</div>
                <div class="value">${property.lastSaleDate || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Last Sale Price</div>
                <div class="value">${property.salePrice || 'N/A'}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  }
  
  private static getCommercialDetailTemplate(properties: Property[], options: ExportOptions): string {
    // Template specialized for commercial properties
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Commercial Property Detail Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          h1 { color: #2c3e50; }
          .property-card { border: 1px solid #ddd; margin-bottom: 30px; padding: 20px; }
          .property-header { background-color: #e74c3c; color: white; padding: 10px; margin: -20px -20px 20px; }
          .property-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .detail-item { margin-bottom: 10px; }
          .label { font-weight: bold; color: #7f8c8d; }
          .value { font-size: 16px; }
        </style>
      </head>
      <body>
        <h1>Commercial Property Detail Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        ${properties.map(property => `
          <div class="property-card">
            <div class="property-header">
              <h2>${property.address}</h2>
              <p>Parcel ID: ${property.parcelId}</p>
            </div>
            
            <div class="property-details">
              <div class="detail-item">
                <div class="label">Property Value</div>
                <div class="value">${property.value || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Year Built</div>
                <div class="value">${property.yearBuilt || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Square Feet</div>
                <div class="value">${property.squareFeet || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Land Value</div>
                <div class="value">${property.landValue || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Zoning</div>
                <div class="value">${property.zoning || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Lot Size</div>
                <div class="value">${property.lotSize || 'N/A'} sq ft</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Tax Assessment</div>
                <div class="value">${property.taxAssessment || 'N/A'}</div>
              </div>
              
              <div class="detail-item">
                <div class="label">Price Per Sq Ft</div>
                <div class="value">${property.pricePerSqFt || 'N/A'}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  }
  
  private static getValuationSummaryTemplate(properties: Property[], options: ExportOptions): string {
    // Calculate summary statistics
    const calculateTotalValue = () => {
      return properties.reduce((sum, prop) => {
        const value = prop.value ? parseFloat(prop.value.replace(/[^0-9.-]+/g, '')) : 0;
        return sum + value;
      }, 0);
    };
    
    const calculateAverageValue = () => {
      const total = calculateTotalValue();
      return properties.length > 0 ? total / properties.length : 0;
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Valuation Summary Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          h1, h2 { color: #2c3e50; }
          .summary-box { background-color: #f8f9fa; border: 1px solid #ddd; padding: 20px; margin-bottom: 30px; }
          .summary-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { background-color: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #3498db; margin: 10px 0; }
          .stat-label { font-size: 14px; color: #7f8c8d; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #3498db; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Valuation Summary Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <div class="summary-box">
          <h2>Summary Statistics</h2>
          <div class="summary-stats">
            <div class="stat-card">
              <div class="stat-label">Total Properties</div>
              <div class="stat-value">${properties.length}</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-label">Total Value</div>
              <div class="stat-value">$${calculateTotalValue().toLocaleString()}</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-label">Average Value</div>
              <div class="stat-value">$${calculateAverageValue().toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
        </div>
        
        <h2>Property Listing</h2>
        <table>
          <thead>
            <tr>
              <th>Parcel ID</th>
              <th>Address</th>
              <th>Value</th>
              <th>Type</th>
              <th>Square Feet</th>
              <th>Year Built</th>
            </tr>
          </thead>
          <tbody>
            ${properties.map(property => `
              <tr>
                <td>${property.parcelId}</td>
                <td>${property.address}</td>
                <td>${property.value || 'N/A'}</td>
                <td>${property.propertyType || 'N/A'}</td>
                <td>${property.squareFeet || 'N/A'}</td>
                <td>${property.yearBuilt || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }
  
  private static getComparativeAnalysisTemplate(properties: Property[], options: ExportOptions): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comparative Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          h1, h2 { color: #2c3e50; }
          .comparison-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .property-column { background-color: #f8f9fa; }
          th { background-color: #3498db; color: white; padding: 8px; position: sticky; top: 0; }
          td { padding: 8px; border: 1px solid #ddd; }
          .header-row th:first-child { background-color: #2c3e50; }
          .metric-label { font-weight: bold; }
          .better-value { background-color: #d5f5e3; }
          .worse-value { background-color: #f5b7b1; }
        </style>
      </head>
      <body>
        <h1>Comparative Analysis Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <h2>Property Comparison</h2>
        <table class="comparison-table">
          <tr class="header-row">
            <th>Metrics</th>
            ${properties.map((property, index) => `
              <th class="property-column">Property ${index + 1}</th>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Address</td>
            ${properties.map(property => `
              <td>${property.address}</td>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Parcel ID</td>
            ${properties.map(property => `
              <td>${property.parcelId}</td>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Property Value</td>
            ${properties.map(property => `
              <td>${property.value || 'N/A'}</td>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Square Feet</td>
            ${properties.map(property => `
              <td>${property.squareFeet || 'N/A'}</td>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Year Built</td>
            ${properties.map(property => `
              <td>${property.yearBuilt || 'N/A'}</td>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Property Type</td>
            ${properties.map(property => `
              <td>${property.propertyType || 'N/A'}</td>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Land Value</td>
            ${properties.map(property => `
              <td>${property.landValue || 'N/A'}</td>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Bedrooms</td>
            ${properties.map(property => `
              <td>${property.bedrooms || 'N/A'}</td>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Bathrooms</td>
            ${properties.map(property => `
              <td>${property.bathrooms || 'N/A'}</td>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Lot Size</td>
            ${properties.map(property => `
              <td>${property.lotSize || 'N/A'}</td>
            `).join('')}
          </tr>
          
          <tr>
            <td class="metric-label">Neighborhood</td>
            ${properties.map(property => `
              <td>${property.neighborhood || 'N/A'}</td>
            `).join('')}
          </tr>
        </table>
      </body>
      </html>
    `;
  }
  
  private static getNeighborhoodReportTemplate(properties: Property[], options: ExportOptions): string {
    // Group properties by neighborhood
    const neighborhoodMap = new Map<string, Property[]>();
    
    properties.forEach(property => {
      const neighborhood = property.neighborhood || 'Unknown';
      if (!neighborhoodMap.has(neighborhood)) {
        neighborhoodMap.set(neighborhood, []);
      }
      neighborhoodMap.get(neighborhood)?.push(property);
    });
    
    // Calculate neighborhood statistics
    const neighborhoodStats = Array.from(neighborhoodMap.entries()).map(([name, props]) => {
      const totalValue = props.reduce((sum, prop) => {
        const value = prop.value ? parseFloat(prop.value.replace(/[^0-9.-]+/g, '')) : 0;
        return sum + value;
      }, 0);
      
      const avgValue = props.length > 0 ? totalValue / props.length : 0;
      
      return {
        name,
        propertyCount: props.length,
        totalValue,
        avgValue,
        properties: props
      };
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Neighborhood Analysis Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; }
          h1, h2, h3 { color: #2c3e50; }
          .neighborhood-section { margin-bottom: 40px; }
          .neighborhood-header { background-color: #3498db; color: white; padding: 10px; }
          .neighborhood-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background-color: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
          .stat-value { font-size: 20px; font-weight: bold; color: #3498db; margin: 10px 0; }
          .stat-label { font-size: 14px; color: #7f8c8d; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #3498db; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Neighborhood Analysis Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        ${neighborhoodStats.map(neighborhood => `
          <div class="neighborhood-section">
            <div class="neighborhood-header">
              <h2>${neighborhood.name}</h2>
            </div>
            
            <div class="neighborhood-stats">
              <div class="stat-card">
                <div class="stat-label">Total Properties</div>
                <div class="stat-value">${neighborhood.propertyCount}</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-label">Total Value</div>
                <div class="stat-value">$${neighborhood.totalValue.toLocaleString()}</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-label">Average Value</div>
                <div class="stat-value">$${neighborhood.avgValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            </div>
            
            <h3>Properties in ${neighborhood.name}</h3>
            <table>
              <thead>
                <tr>
                  <th>Parcel ID</th>
                  <th>Address</th>
                  <th>Value</th>
                  <th>Type</th>
                  <th>Square Feet</th>
                  <th>Year Built</th>
                </tr>
              </thead>
              <tbody>
                ${neighborhood.properties.map(property => `
                  <tr>
                    <td>${property.parcelId}</td>
                    <td>${property.address}</td>
                    <td>${property.value || 'N/A'}</td>
                    <td>${property.propertyType || 'N/A'}</td>
                    <td>${property.squareFeet || 'N/A'}</td>
                    <td>${property.yearBuilt || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </body>
      </html>
    `;
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