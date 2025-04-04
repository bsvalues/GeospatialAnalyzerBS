import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle, CheckCircle, FileUp, FileX, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Property Bulk Import Component
 * 
 * This component allows users to bulk import property data from JSON format.
 */
const PropertyBulkImport: React.FC = () => {
  const { toast } = useToast();
  const [jsonData, setJsonData] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [validatedData, setValidatedData] = useState<any[]>([]);
  
  // Mutation for bulk importing properties
  const importMutation = useMutation({
    mutationFn: async (properties: any[]) => {
      return apiRequest('/api/properties/bulk-import', 'POST', properties);
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${response.count} properties.`,
        variant: 'default'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import properties. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  /**
   * Validate JSON data
   */
  const validateData = () => {
    setValidationStatus('validating');
    setValidationErrors([]);
    
    try {
      // Parse JSON
      const parsed = JSON.parse(jsonData);
      
      // Ensure it's an array
      if (!Array.isArray(parsed)) {
        setValidationStatus('invalid');
        setValidationErrors([{ message: 'Data must be an array of properties' }]);
        return;
      }
      
      // Check if it's empty
      if (parsed.length === 0) {
        setValidationStatus('invalid');
        setValidationErrors([{ message: 'No properties found in data' }]);
        return;
      }
      
      // Validate required fields for each property
      const errors: any[] = [];
      const valid = parsed.every((property, index) => {
        const localErrors: string[] = [];
        
        if (!property.parcelId) {
          localErrors.push('Missing parcelId');
        }
        
        if (!property.address) {
          localErrors.push('Missing address');
        }
        
        if (property.squareFeet === undefined || isNaN(Number(property.squareFeet))) {
          localErrors.push('Invalid or missing squareFeet (must be a number)');
        }
        
        if (localErrors.length > 0) {
          errors.push({
            index,
            property,
            messages: localErrors
          });
          return false;
        }
        
        return true;
      });
      
      if (!valid) {
        setValidationStatus('invalid');
        setValidationErrors(errors);
        return;
      }
      
      // Data is valid
      setValidationStatus('valid');
      setValidatedData(parsed);
    } catch (error: any) {
      setValidationStatus('invalid');
      setValidationErrors([{ message: `Invalid JSON: ${error.message}` }]);
    }
  };
  
  /**
   * Handle bulk import
   */
  const handleImport = () => {
    if (validatedData.length === 0 || validationStatus !== 'valid') {
      toast({
        title: 'Validation Required',
        description: 'Please validate the data before importing.',
        variant: 'destructive'
      });
      return;
    }
    
    importMutation.mutate(validatedData);
  };
  
  /**
   * Clear form
   */
  const handleClear = () => {
    setJsonData('');
    setValidationStatus('idle');
    setValidationErrors([]);
    setValidatedData([]);
  };
  
  /**
   * Load sample data
   */
  const loadSampleData = () => {
    const sampleData = [
      {
        parcelId: 'P123456',
        address: '123 Main St, Richland, WA',
        squareFeet: 2500,
        owner: 'John Doe',
        value: '450000',
        yearBuilt: 1998,
        landValue: '120000',
        coordinates: [46.2804, -119.2752],
        neighborhood: 'North Richland',
        bedrooms: 3,
        bathrooms: 2.5,
        lotSize: 8500,
        propertyType: 'residential'
      },
      {
        parcelId: 'P789012',
        address: '456 Oak Ave, Kennewick, WA',
        squareFeet: 2100,
        owner: 'Jane Smith',
        value: '375000',
        yearBuilt: 2004,
        landValue: '95000',
        coordinates: [46.2087, -119.1361],
        neighborhood: 'South Kennewick',
        bedrooms: 3,
        bathrooms: 2,
        lotSize: 7200,
        propertyType: 'residential'
      }
    ];
    
    setJsonData(JSON.stringify(sampleData, null, 2));
    setValidationStatus('idle');
    setValidationErrors([]);
    setValidatedData([]);
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Bulk Property Import</CardTitle>
        <CardDescription>
          Import multiple properties at once by pasting JSON data below.
          Each property must have at minimum: parcelId, address, and squareFeet.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="json-data">Property Data (JSON format)</Label>
            <Textarea
              id="json-data"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Paste JSON array of properties here..."
              className="font-mono h-64"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSampleData}
              type="button"
            >
              Load Sample Data
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={validateData}
              disabled={!jsonData.trim() || validationStatus === 'validating'}
              type="button"
            >
              {validationStatus === 'validating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate Data'
              )}
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClear}
              type="button"
            >
              Clear
            </Button>
          </div>
          
          {validationStatus === 'valid' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-800 font-medium">
                  Data validated successfully: {validatedData.length} properties ready to import
                </span>
              </div>
            </div>
          )}
          
          {validationStatus === 'invalid' && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-800 font-medium">
                  Validation failed
                </span>
              </div>
              
              <div className="text-red-700 text-sm max-h-40 overflow-y-auto">
                {validationErrors.map((error, index) => (
                  <div key={index} className="mb-2">
                    {error.message ? (
                      <p>{error.message}</p>
                    ) : (
                      <>
                        <p>Error in property at index {error.index}:</p>
                        <ul className="list-disc list-inside pl-4">
                          {error.messages.map((msg: string, i: number) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {validationStatus === 'valid' && validatedData.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcel ID</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Square Feet</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validatedData.slice(0, 5).map((property, index) => (
                    <TableRow key={index}>
                      <TableCell>{property.parcelId}</TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>{property.squareFeet}</TableCell>
                      <TableCell>{property.propertyType || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                  {validatedData.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        ... and {validatedData.length - 5} more properties
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          {importMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Importing properties...</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleClear}
          type="button"
        >
          <FileX className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        
        <Button
          disabled={validationStatus !== 'valid' || importMutation.isPending}
          onClick={handleImport}
          type="button"
        >
          {importMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <FileUp className="mr-2 h-4 w-4" />
              Import Properties
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PropertyBulkImport;