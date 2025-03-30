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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Property } from '@/shared/types';
import { ExportFormat, ExportOptions, ExportService } from '@/services/exportService';
import { 
  FileText, 
  Table, 
  FileJson, 
  FileSpreadsheet, 
  FilePdf,
  ArrowDownToLine
} from 'lucide-react';

const exportFormSchema = z.object({
  format: z.enum(['csv', 'json', 'pdf', 'xlsx']),
  fileName: z.string()
    .min(1, 'File name is required')
    .max(50, 'File name cannot exceed 50 characters')
    .refine(name => /^[a-zA-Z0-9_-]+$/.test(name), {
      message: 'File name can only contain letters, numbers, underscores, and hyphens',
    }),
  title: z.string().optional(),
  description: z.string().optional(),
  includeHeaders: z.boolean().default(true),
  includeDateGenerated: z.boolean().default(true),
  includeMetadata: z.boolean().default(true),
});

type ExportFormValues = z.infer<typeof exportFormSchema>;

interface ExportDialogProps {
  properties: Property[];
  metrics?: Record<string, any>[];
  exportType?: 'properties' | 'analysis' | 'comparison';
  trigger?: React.ReactNode;
  className?: string;
}

export function ExportDialog({
  properties,
  metrics,
  exportType = 'properties',
  trigger,
  className,
}: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      format: 'csv',
      fileName: `spatialest-${exportType}-${new Date().toISOString().split('T')[0]}`,
      includeHeaders: true,
      includeDateGenerated: true,
      includeMetadata: true,
    },
  });
  
  const onSubmit = (values: ExportFormValues) => {
    const exportOptions: ExportOptions = {
      fileName: values.fileName,
      includeHeaders: values.includeHeaders,
      dateGenerated: values.includeDateGenerated,
      title: values.title,
      description: values.description,
    };
    
    switch (values.format) {
      case 'csv':
        if (exportType === 'analysis' && metrics) {
          ExportService.exportAnalysisReport(properties, metrics, exportOptions);
        } else {
          ExportService.exportPropertiesToCSV(properties, exportOptions);
        }
        break;
        
      case 'json':
        ExportService.exportPropertiesToJSON(properties, exportOptions);
        break;
        
      // Future implementation for PDF and Excel formats
      case 'pdf':
      case 'xlsx':
        alert(`Export to ${values.format.toUpperCase()} format is coming soon!`);
        break;
    }
    
    setIsOpen(false);
  };
  
  // Get icon based on format
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <Table className="w-4 h-4" />;
      case 'json':
        return <FileJson className="w-4 h-4" />;
      case 'pdf':
        return <FilePdf className="w-4 h-4" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };
  
  // Generate dialog title based on export type
  const getDialogTitle = () => {
    switch (exportType) {
      case 'properties':
        return 'Export Properties';
      case 'analysis':
        return 'Export Analysis Report';
      case 'comparison':
        return 'Export Property Comparison';
      default:
        return 'Export Data';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={className}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            Configure export options and download your data in the preferred format.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Export Format</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="csv">
                        <div className="flex items-center">
                          <Table className="mr-2 h-4 w-4" />
                          <span>CSV (Comma Separated Values)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center">
                          <FileJson className="mr-2 h-4 w-4" />
                          <span>JSON (JavaScript Object Notation)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf" disabled>
                        <div className="flex items-center">
                          <FilePdf className="mr-2 h-4 w-4" />
                          <span>PDF Document (Coming Soon)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="xlsx" disabled>
                        <div className="flex items-center">
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          <span>Excel Spreadsheet (Coming Soon)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the file format for your exported data.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fileName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input {...field} />
                      <div className="ml-2 text-gray-500">
                        .{form.watch('format')}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter a name for your export file (no spaces or special characters).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="includeHeaders"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include Headers</FormLabel>
                      <FormDescription>
                        Add column headers to CSV exports.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="includeDateGenerated"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include Date</FormLabel>
                      <FormDescription>
                        Add generation timestamp to exports.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional title for your export report.
                  </FormDescription>
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
                      placeholder="Enter a description for this export (optional)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="submit" className="w-full sm:w-auto">
                {getFormatIcon(form.watch('format'))}
                <span className="ml-2">Export as {form.watch('format').toUpperCase()}</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}