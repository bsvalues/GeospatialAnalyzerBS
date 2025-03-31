import { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface ExportDialogProps {
  trigger?: React.ReactNode;
  onExport: (format: string, options: ExportOptions) => void;
  title?: string;
  description?: string;
  className?: string;
}

export interface ExportOptions {
  fileName?: string;
  includeMetadata?: boolean;
  includeImages?: boolean;
  pageSize?: string;
  orientation?: 'portrait' | 'landscape';
}

export const ExportDialog = ({
  trigger,
  onExport,
  title = 'Export Report',
  description = 'Choose export format and options',
  className,
}: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [fileName, setFileName] = useState('property-report');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [pageSize, setPageSize] = useState('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  const handleExport = () => {
    onExport(exportFormat, {
      fileName,
      includeMetadata,
      includeImages,
      pageSize,
      orientation
    });
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Export</Button>}
      </DialogTrigger>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="export-format" className="text-right">
              Format
            </Label>
            <Select
              value={exportFormat}
              onValueChange={setExportFormat}
            >
              <SelectTrigger id="export-format" className="col-span-3">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                <SelectItem value="png">PNG Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file-name" className="text-right">
              File Name
            </Label>
            <Input
              id="file-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          {exportFormat === 'pdf' && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="page-size" className="text-right">
                  Page Size
                </Label>
                <Select
                  value={pageSize}
                  onValueChange={setPageSize}
                >
                  <SelectTrigger id="page-size" className="col-span-3">
                    <SelectValue placeholder="Select page size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="orientation" className="text-right">
                  Orientation
                </Label>
                <Select
                  value={orientation}
                  onValueChange={(value: 'portrait' | 'landscape') => setOrientation(value)}
                >
                  <SelectTrigger id="orientation" className="col-span-3">
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3 flex items-center space-x-2">
              <Checkbox 
                id="include-metadata" 
                checked={includeMetadata} 
                onCheckedChange={(checked) => {
                  if (typeof checked === 'boolean') {
                    setIncludeMetadata(checked);
                  }
                }}
              />
              <Label htmlFor="include-metadata">Include metadata</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3 flex items-center space-x-2">
              <Checkbox 
                id="include-images"
                checked={includeImages}
                onCheckedChange={(checked) => {
                  if (typeof checked === 'boolean') {
                    setIncludeImages(checked);
                  }
                }}
              />
              <Label htmlFor="include-images">Include images</Label>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};