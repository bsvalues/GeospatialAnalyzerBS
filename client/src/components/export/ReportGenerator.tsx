import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Property, RegressionModel } from '@/shared/types';
import { ExportService, formatPropertyValue } from '@/services/exportService';
import { saveAs } from 'file-saver';
import { 
  FileText, 
  BarChart, 
  PieChart, 
  LineChart,
  Table,
  FileJson,
  Download,
  FileSpreadsheet,
  Settings,
  Plus,
  Minus,
  Copy
} from 'lucide-react';

// Schema for the report configuration form
const reportConfigSchema = z.object({
  reportType: z.enum(['basic', 'detailed', 'custom']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  sections: z.array(
    z.object({
      title: z.string(),
      includeInReport: z.boolean().default(true),
    })
  ).optional(),
  includeProperties: z.boolean().default(true),
  includeStatistics: z.boolean().default(true),
  includeCharts: z.boolean().default(true),
  includeMap: z.boolean().default(false),
  customNotes: z.string().optional(),
});

type ReportConfigValues = z.infer<typeof reportConfigSchema>;

interface ReportGeneratorProps {
  properties: Property[];
  metrics?: Record<string, any>[];
  models?: RegressionModel[];
  trigger?: React.ReactNode;
  className?: string;
}

/**
 * Component for generating comprehensive analytical reports 
 * from property data and metrics
 */
export function ReportGenerator({
  properties,
  metrics,
  models,
  trigger,
  className,
}: ReportGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Default sections for the report
  const defaultSections = [
    { title: 'Executive Summary', includeInReport: true },
    { title: 'Property Overview', includeInReport: true },
    { title: 'Statistical Analysis', includeInReport: true },
    { title: 'Comparative Metrics', includeInReport: true },
    { title: 'Regression Analysis', includeInReport: Boolean(models?.length) },
    { title: 'Market Trends', includeInReport: false },
    { title: 'Spatial Analysis', includeInReport: false },
    { title: 'Recommendations', includeInReport: false },
  ];
  
  const form = useForm<ReportConfigValues>({
    resolver: zodResolver(reportConfigSchema),
    defaultValues: {
      reportType: 'detailed',
      title: `Property Analysis Report - ${new Date().toLocaleDateString()}`,
      sections: defaultSections,
      includeProperties: true,
      includeStatistics: true,
      includeCharts: true,
      includeMap: false,
    },
  });
  
  const reportType = form.watch('reportType');
  
  // Update sections based on report type
  React.useEffect(() => {
    switch(reportType) {
      case 'basic':
        form.setValue('sections', defaultSections.map(section => ({
          ...section,
          includeInReport: ['Executive Summary', 'Property Overview'].includes(section.title)
        })));
        form.setValue('includeCharts', false);
        form.setValue('includeMap', false);
        break;
        
      case 'detailed':
        form.setValue('sections', defaultSections.map(section => ({
          ...section,
          includeInReport: !['Market Trends', 'Spatial Analysis', 'Recommendations'].includes(section.title)
        })));
        form.setValue('includeCharts', true);
        form.setValue('includeMap', false);
        break;
        
      case 'custom':
        // Keep current selections
        break;
    }
  }, [reportType]);
  
  // Generate and download the report
  const onSubmit = (values: ReportConfigValues) => {
    // Get selected sections
    const selectedSections = values.sections?.filter(section => section.includeInReport) || [];
    
    // Build a plain text report (more formats could be added later)
    let reportContent = `${values.title.toUpperCase()}\n`;
    reportContent += '='.repeat(values.title.length) + '\n\n';
    
    if (values.description) {
      reportContent += `${values.description}\n\n`;
    }
    
    reportContent += `Generated: ${new Date().toLocaleString()}\n`;
    reportContent += `Properties Analyzed: ${properties.length}\n\n`;
    
    // Add each selected section
    selectedSections.forEach(section => {
      reportContent += `## ${section.title}\n\n`;
      
      switch(section.title) {
        case 'Executive Summary':
          reportContent += generateExecutiveSummary(properties, metrics);
          break;
          
        case 'Property Overview':
          if (values.includeProperties) {
            reportContent += generatePropertyOverview(properties);
          }
          break;
          
        case 'Statistical Analysis':
          if (values.includeStatistics && metrics) {
            reportContent += generateStatisticalAnalysis(metrics);
          }
          break;
          
        case 'Comparative Metrics':
          if (metrics) {
            reportContent += generateComparativeMetrics(properties, metrics);
          }
          break;
          
        case 'Regression Analysis':
          if (models) {
            reportContent += generateRegressionAnalysis(models);
          }
          break;
          
        default:
          reportContent += '[This section will be populated with relevant data in future versions.]\n\n';
      }
      
      reportContent += '\n\n';
    });
    
    // Add custom notes if provided
    if (values.customNotes) {
      reportContent += '## Additional Notes\n\n';
      reportContent += values.customNotes + '\n\n';
    }
    
    // Add appendix with data sources
    reportContent += '## Appendix: Data Sources\n\n';
    reportContent += '- Property data from Benton County Assessor\'s Office\n';
    reportContent += '- Market data analysis performed with Spatialest tools\n';
    reportContent += `- Report generated on ${new Date().toLocaleString()}\n\n`;
    
    // Create and save the file
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const fileName = values.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    saveAs(blob, `${fileName}.txt`);
    
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={className}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Analysis Report</DialogTitle>
          <DialogDescription>
            Configure your report options and generate a comprehensive property analysis report.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Options</TabsTrigger>
                <TabsTrigger value="sections">Report Sections</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="reportType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basic">
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>Basic Report</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="detailed">
                            <div className="flex items-center">
                              <Table className="mr-2 h-4 w-4" />
                              <span>Detailed Analysis</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="custom">
                            <div className="flex items-center">
                              <Settings className="mr-2 h-4 w-4" />
                              <span>Custom Report</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the type of report to generate.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter a description for this report (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="sections" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <div className="text-sm font-medium">Select Report Sections</div>
                  
                  {form.watch('sections')?.map((section, index) => (
                    <div key={index} className="flex items-center space-x-2 border-b pb-2">
                      <Checkbox
                        checked={section.includeInReport}
                        onCheckedChange={(checked) => {
                          const newSections = [...form.getValues('sections') || []];
                          newSections[index] = {
                            ...newSections[index],
                            includeInReport: Boolean(checked),
                          };
                          form.setValue('sections', newSections);
                        }}
                        id={`section-${index}`}
                      />
                      <label
                        htmlFor={`section-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {section.title}
                      </label>
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="includeProperties"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include Property Details</FormLabel>
                          <FormDescription>
                            List all properties with details
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeStatistics"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include Statistics</FormLabel>
                          <FormDescription>
                            Add statistical analysis
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="customNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter any additional notes to include in the report"
                          rows={5}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="includeCharts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include Chart References</FormLabel>
                          <FormDescription>
                            Add chart references (Coming Soon)
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="includeMap"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include Map References</FormLabel>
                          <FormDescription>
                            Add map references (Coming Soon)
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                <span>Generate Report</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Utility functions for generating different report sections

function generateExecutiveSummary(properties: Property[], metrics?: Record<string, any>[]): string {
  let summary = 'This report provides an analysis of selected properties in Benton County, Washington. ';
  
  if (properties.length > 0) {
    summary += `The analysis includes ${properties.length} properties with a focus on `;
    
    if (metrics && metrics.length > 0) {
      // Extract key metrics to highlight in summary
      const metricNames = Object.keys(metrics[0]).slice(0, 3);
      summary += `metrics such as ${metricNames.join(', ')}. `;
    } else {
      summary += 'various valuation and physical characteristics. ';
    }
    
    // Add range of values if available
    const hasValues = properties.filter(p => p.value).length > 0;
    if (hasValues) {
      const values = properties
        .map(p => p.value ? parseFloat(p.value.replace(/[^0-9.]/g, '')) : 0)
        .filter(v => v > 0);
      
      if (values.length > 0) {
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        summary += `The property values range from ${formatPropertyValue(minValue, 'currency')} to ${formatPropertyValue(maxValue, 'currency')}. `;
      }
    }
  }
  
  summary += 'This report is intended for informational purposes and to assist in property valuation and assessment activities.\n\n';
  
  return summary;
}

function generatePropertyOverview(properties: Property[]): string {
  let overview = `PROPERTY LIST (${properties.length} properties)\n\n`;
  
  properties.forEach((property, index) => {
    overview += `${index + 1}. ${property.address}\n`;
    overview += `   ID: ${property.id}\n`;
    overview += `   Parcel ID: ${property.parcelId}\n`;
    
    if (property.owner) {
      overview += `   Owner: ${property.owner}\n`;
    }
    
    if (property.value) {
      overview += `   Assessed Value: ${property.value}\n`;
    }
    
    if (property.squareFeet) {
      overview += `   Square Feet: ${property.squareFeet}\n`;
    }
    
    if (property.yearBuilt) {
      overview += `   Year Built: ${property.yearBuilt}\n`;
    }
    
    overview += '\n';
  });
  
  return overview;
}

function generateStatisticalAnalysis(metrics: Record<string, any>[]): string {
  let analysis = 'STATISTICAL SUMMARY\n\n';
  
  // Get all metric names
  const metricNames = Object.keys(metrics[0]);
  
  metricNames.forEach(metricName => {
    // Extract values for this metric across all properties
    const values = metrics
      .map(m => m[metricName])
      .filter(v => v !== undefined && v !== null)
      .map(v => typeof v === 'string' ? parseFloat(v.replace(/[^0-9.]/g, '')) : v)
      .filter(v => !isNaN(v));
    
    if (values.length > 0) {
      // Determine metric format for display
      let format: 'currency' | 'number' | 'text' | 'percent' = 'number';
      if (metricName.toLowerCase().includes('price') || 
          metricName.toLowerCase().includes('value') ||
          metricName.toLowerCase().includes('cost')) {
        format = 'currency';
      } else if (metricName.toLowerCase().includes('percent') ||
                metricName.toLowerCase().includes('ratio')) {
        format = 'percent';
      }
      
      // Calculate statistics
      const sum = values.reduce((acc, val) => acc + val, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      // Calculate median (requires sorting)
      const sortedValues = [...values].sort((a, b) => a - b);
      const midIndex = Math.floor(sortedValues.length / 2);
      const median = sortedValues.length % 2 !== 0
        ? sortedValues[midIndex]
        : (sortedValues[midIndex - 1] + sortedValues[midIndex]) / 2;
      
      // Calculate standard deviation
      const meanDifferencesSquared = values.map(val => (val - avg) ** 2);
      const variance = meanDifferencesSquared.reduce((acc, val) => acc + val, 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Add to analysis
      analysis += `${metricName}:\n`;
      analysis += `  Average: ${formatPropertyValue(avg, format)}\n`;
      analysis += `  Median: ${formatPropertyValue(median, format)}\n`;
      analysis += `  Minimum: ${formatPropertyValue(min, format)}\n`;
      analysis += `  Maximum: ${formatPropertyValue(max, format)}\n`;
      analysis += `  Range: ${formatPropertyValue(max - min, format)}\n`;
      analysis += `  Standard Deviation: ${formatPropertyValue(stdDev, format)}\n`;
      analysis += '\n';
    }
  });
  
  return analysis;
}

function generateComparativeMetrics(properties: Property[], metrics: Record<string, any>[]): string {
  let comparative = 'COMPARATIVE ANALYSIS\n\n';
  
  // Create a table-like structure with property addresses as rows and metrics as columns
  const metricNames = Object.keys(metrics[0]).slice(0, 5); // Limit to 5 key metrics
  
  // Add header row
  comparative += 'Property'.padEnd(30);
  metricNames.forEach(name => {
    comparative += name.slice(0, 15).padEnd(15);
  });
  comparative += '\n';
  
  // Add separator
  comparative += '-'.repeat(30);
  metricNames.forEach(() => {
    comparative += '-'.repeat(15);
  });
  comparative += '\n';
  
  // Add data rows
  properties.forEach((property, index) => {
    const shortAddress = property.address.slice(0, 27);
    comparative += shortAddress.padEnd(30);
    
    metricNames.forEach(metricName => {
      const metricValue = metrics[index]?.[metricName];
      
      // Format the value
      let formattedValue = '';
      if (metricValue !== undefined && metricValue !== null) {
        // Simple format detection
        let format: 'currency' | 'number' | 'text' | 'percent' = 'text';
        
        if (typeof metricValue === 'number') {
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
        
        formattedValue = formatPropertyValue(metricValue, format).slice(0, 14);
      }
      
      comparative += formattedValue.padEnd(15);
    });
    
    comparative += '\n';
  });
  
  comparative += '\n\nNOTE: This comparison shows key metrics for each property. Detailed analysis is available in other sections of the report.\n';
  
  return comparative;
}

function generateRegressionAnalysis(models: RegressionModel[]): string {
  let regression = 'REGRESSION MODEL SUMMARY\n\n';
  
  if (models.length === 0) {
    regression += 'No regression models are available for analysis.\n';
    return regression;
  }
  
  models.forEach((model, index) => {
    regression += `Model ${index + 1}: ${model.name}\n`;
    regression += `  R-squared: ${(model.r2 * 100).toFixed(2)}%\n`;
    regression += `  Variables: ${model.variables}\n`;
    regression += `  Coefficient of Variation: ${(model.cov * 100).toFixed(2)}%\n`;
    regression += `  Sample Size: ${model.samples}\n`;
    regression += `  Type: ${model.type || 'Multiple Regression'}\n`;
    regression += `  Last Run: ${new Date(model.lastRun).toLocaleDateString()}\n`;
    regression += '\n';
  });
  
  regression += 'The R-squared value indicates how well the model explains the variation in property values. ';
  regression += 'A higher R-squared (closer to 100%) indicates a better fit.\n\n';
  
  return regression;
}