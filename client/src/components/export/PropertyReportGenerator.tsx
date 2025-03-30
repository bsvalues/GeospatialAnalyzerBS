import React from 'react';
import { Button } from '@/components/ui/button';
import { Property, RegressionModel } from '@/shared/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, FileText } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { ExportService } from '@/services/exportService';
import { useToast } from '@/hooks/use-toast';

// Schema for report configuration
const reportConfigSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  includeExecutiveSummary: z.boolean().default(true),
  includePropertyOverview: z.boolean().default(true),
  includeStatisticalAnalysis: z.boolean().default(true),
  includeComparativeMetrics: z.boolean().default(true),
  includeRegressionAnalysis: z.boolean().default(false),
  exportFormat: z.enum(['pdf', 'html', 'docx']).default('pdf'),
  customLogo: z.boolean().default(false),
  logoUrl: z.string().optional(),
});

type ReportConfigValues = z.infer<typeof reportConfigSchema>;

interface PropertyReportGeneratorProps {
  properties: Property[];
  metrics?: Record<string, any>[];
  models?: RegressionModel[];
  trigger?: React.ReactNode;
  className?: string;
}

/**
 * Component for generating comprehensive property reports with
 * customizable sections, charts, and analysis
 */
export function PropertyReportGenerator({
  properties,
  metrics = [],
  models = [],
  trigger,
  className
}: PropertyReportGeneratorProps) {
  const { toast } = useToast();
  const form = useForm<ReportConfigValues>({
    resolver: zodResolver(reportConfigSchema),
    defaultValues: {
      title: `Property Analysis Report - ${new Date().toLocaleDateString()}`,
      description: `Comprehensive analysis of ${properties.length} properties in Benton County, Washington`,
      includeExecutiveSummary: true,
      includePropertyOverview: true,
      includeStatisticalAnalysis: metrics.length > 0,
      includeComparativeMetrics: properties.length > 1,
      includeRegressionAnalysis: models.length > 0,
      exportFormat: 'pdf',
      customLogo: false,
      logoUrl: '',
    },
  });

  const customLogoEnabled = form.watch('customLogo');

  const onSubmit = (values: ReportConfigValues) => {
    // TODO: Implement actual report generation when backend is ready
    // This is currently a placeholder that simulates report generation
    
    toast({
      title: "Report Generating",
      description: "Your report will download shortly.",
    });
    
    // Simulate processing delay
    setTimeout(() => {
      toast({
        title: "Report Generated",
        description: "Your report has been downloaded.",
      });
      
      // For now, we'll just use the CSV export as a placeholder
      ExportService.exportPropertiesToCSV(properties, {
        fileName: values.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase(),
        title: values.title,
        description: values.description,
      });
    }, 1500);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={className}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Generate Property Report</AlertDialogTitle>
          <AlertDialogDescription>
            Create a comprehensive report based on selected properties and analysis metrics.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter report title..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter report description..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="space-y-3">
              <FormLabel>Include Sections</FormLabel>
              
              <FormField
                control={form.control}
                name="includeExecutiveSummary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Executive Summary</FormLabel>
                      <FormDescription>
                        Overview of key findings and analysis results
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="includePropertyOverview"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Property Overview</FormLabel>
                      <FormDescription>
                        Detailed information about each property
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              {metrics.length > 0 && (
                <FormField
                  control={form.control}
                  name="includeStatisticalAnalysis"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Statistical Analysis</FormLabel>
                        <FormDescription>
                          Charts and statistics based on property metrics
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
              
              {properties.length > 1 && (
                <FormField
                  control={form.control}
                  name="includeComparativeMetrics"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Comparative Metrics</FormLabel>
                        <FormDescription>
                          Side-by-side comparison of properties
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
              
              {models.length > 0 && (
                <FormField
                  control={form.control}
                  name="includeRegressionAnalysis"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Regression Analysis</FormLabel>
                        <FormDescription>
                          Results from property valuation models
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <FormField
              control={form.control}
              name="exportFormat"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Export Format</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="pdf" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          PDF
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="html" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          HTML
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="docx" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          DOCX
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customLogo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Use Custom Logo</FormLabel>
                    <FormDescription>
                      Include your organization's logo in the report
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {customLogoEnabled && (
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://your-company.com/logo.png" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a URL to your organization's logo
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button type="submit">
                  <Check className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}