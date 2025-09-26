import { useState } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, ArrowLeftRight, Eye, CheckCircle } from "lucide-react";
import { CSVFieldMapper } from "./CSVFieldMapper";
import { CSVDataPreview } from "./CSVDataPreview";
import { useSupplierCatalog } from "@/hooks/useSupplierCatalog";
import { useToast } from "@/hooks/use-toast";

interface EnhancedCSVImportModalProps {
  onImportComplete?: () => void;
}

interface CSVRow {
  [key: string]: string;
}

interface FieldMapping {
  csvColumn: string;
  dbField: string;
  isCustomField: boolean;
  dataType: string;
  required: boolean;
}

export function EnhancedCSVImportModal({ onImportComplete }: EnhancedCSVImportModalProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const { addCatalogItem } = useSupplierCatalog();
  const { toast } = useToast();

  const steps = [
    { id: 0, title: "Upload CSV", icon: Upload },
    { id: 1, title: "Map Fields", icon: ArrowLeftRight },
    { id: 2, title: "Preview Data", icon: Eye },
    { id: 3, title: "Import", icon: CheckCircle }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: "", // Auto-detect delimiter
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        // Filter out non-critical errors that shouldn't block import
        const criticalErrors = results.errors.filter(error => 
          error.type === 'Quotes' ||
          (error.type === 'FieldMismatch' && error.code === 'TooManyFields')
        );

        // Delimiter detection warnings are not critical - allow them to proceed
        const nonCriticalErrors = results.errors.filter(error => 
          error.type === 'Delimiter' || 
          error.code === 'UndetectableDelimiter'
        );

        if (criticalErrors.length > 0) {
          toast({
            title: "CSV parsing failed",
            description: `Critical errors: ${criticalErrors.map(e => e.message).join(', ')}`,
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }

        const data = results.data as CSVRow[];
        
        // Ensure we have valid data structure
        if (!data || data.length === 0) {
          toast({
            title: "Empty CSV file",
            description: "The CSV file appears to be empty or contains no valid data.",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }

        // Get headers from first row or detect them
        const headers = Object.keys(data[0] || {}).filter(header => header && header.trim());
        
        if (headers.length === 0) {
          toast({
            title: "No headers detected",
            description: "Unable to detect column headers in the CSV file.",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        setCsvData(data);
        setCsvHeaders(headers);
        
        // Auto-generate initial field mappings with smart suggestions
        const initialMappings = generateSmartMappings(headers);
        setFieldMappings(initialMappings);
        
        setCurrentStep(1);
        setIsProcessing(false);

        // Show info about delimiter detection and other warnings
        let message = `Found ${data.length} rows with ${headers.length} columns`;
        if (nonCriticalErrors.length > 0) {
          const delimiterMsg = nonCriticalErrors.find(e => e.type === 'Delimiter' || e.code === 'UndetectableDelimiter');
          if (delimiterMsg) {
            message += ". Auto-detected delimiter (comma assumed)";
          }
        }
        
        const otherWarnings = results.errors.filter(error => 
          !criticalErrors.includes(error) && !nonCriticalErrors.includes(error)
        );
        
        if (otherWarnings.length > 0) {
          toast({
            title: "CSV uploaded with warnings",
            description: `${message}. ${otherWarnings.length} warning(s) detected.`,
            variant: "default"
          });
        } else {
          toast({
            title: "CSV uploaded successfully",
            description: message
          });
        }
      },
      error: (error) => {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    });
  };

  const generateSmartMappings = (headers: string[]): FieldMapping[] => {
    const fieldSuggestions: { [key: string]: string } = {
      'name': 'item_name',
      'item_name': 'item_name',
      'product_name': 'item_name',
      'description': 'description',
      'price': 'price',
      'cost': 'price',
      'unit_price': 'price',
      'supplier': 'supplier_name',
      'supplier_name': 'supplier_name',
      'vendor': 'supplier_name',
      'manufacturer': 'manufacturer',
      'brand': 'manufacturer',
      'model': 'model_number',
      'model_number': 'model_number',
      'sku': 'sku',
      'part_number': 'sku',
      'upc': 'upc_code',
      'upc_code': 'upc_code',
      'barcode': 'upc_code',
      'category': 'category',
      'availability': 'availability_status',
      'stock': 'availability_status',
      'status': 'availability_status',
      'minimum': 'minimum_order_quantity',
      'min_qty': 'minimum_order_quantity',
      'min_order': 'minimum_order_quantity'
    };

    return headers.map(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const suggestedField = fieldSuggestions[normalizedHeader] || 'custom_fields';
      const isCustom = !['item_name', 'description', 'price', 'supplier_name', 'manufacturer', 'model_number', 'sku', 'upc_code', 'category', 'availability_status', 'minimum_order_quantity'].includes(suggestedField);
      
      return {
        csvColumn: header,
        dbField: suggestedField,
        isCustomField: isCustom,
        dataType: header.toLowerCase().includes('price') || header.toLowerCase().includes('cost') ? 'number' : 'text',
        required: ['item_name', 'price'].includes(suggestedField)
      };
    });
  };

  const processImport = async () => {
    setIsProcessing(true);
    setProgress(0);

    const results = {
      total: csvData.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < csvData.length; i++) {
      try {
        const row = csvData[i];
        const mappedData = mapRowToItem(row);
        
        await addCatalogItem(mappedData);
        results.successful++;
        
        setProgress(((i + 1) / csvData.length) * 100);
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    setImportResults(results);
    setIsProcessing(false);
    setCurrentStep(3);

    if (onImportComplete) {
      onImportComplete();
    }

    toast({
      title: "Import completed",
      description: `${results.successful} items imported successfully, ${results.failed} failed`
    });
  };

  const mapRowToItem = (row: CSVRow) => {
    const mappedItem: any = {};
    const customFields: any = {};

    fieldMappings.forEach(mapping => {
      const value = row[mapping.csvColumn]?.trim();
      
      if (!value && mapping.required) {
        throw new Error(`Required field "${mapping.dbField}" is empty`);
      }

      if (value) {
        if (mapping.isCustomField) {
          let processedValue = value;
          
          // Convert data types for custom fields
          if (mapping.dataType === 'number') {
            processedValue = (parseFloat(value) || 0).toString();
          } else if (mapping.dataType === 'boolean') {
            processedValue = ['true', '1', 'yes', 'y'].includes(value.toLowerCase()) ? 'true' : 'false';
          } else {
            processedValue = value;
          }
          
          customFields[mapping.csvColumn] = processedValue;
        } else {
          if (mapping.dbField === 'price' || mapping.dbField === 'minimum_order_quantity') {
            mappedItem[mapping.dbField] = parseFloat(value) || 0;
          } else {
            mappedItem[mapping.dbField] = value;
          }
        }
      }
    });

    if (Object.keys(customFields).length > 0) {
      mappedItem.custom_fields = customFields;
    }

    return mappedItem;
  };

  const resetImport = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMappings([]);
    setCurrentStep(0);
    setImportResults(null);
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Enhanced CSV Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enhanced CSV Import</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex justify-between mb-6">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`ml-2 text-sm ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                {step.title}
              </span>
              {step.id < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {isProcessing && (
          <div className="mb-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {currentStep === 0 ? 'Parsing CSV file...' : `Processing row ${Math.floor(progress / 100 * csvData.length)} of ${csvData.length}`}
            </p>
          </div>
        )}

        <Tabs value={currentStep.toString()} className="w-full">
          <TabsContent value="0" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Upload CSV File
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="csvFile">Choose CSV File</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Supported formats: CSV files with headers</p>
                  <p>The system will automatically detect and suggest field mappings</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="1" className="space-y-4">
            <CSVFieldMapper
              csvHeaders={csvHeaders}
              fieldMappings={fieldMappings}
              onMappingsChange={setFieldMappings}
              sampleData={csvData.slice(0, 3)}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(0)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(2)}
              >
                Preview Data
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="2" className="space-y-4">
            <CSVDataPreview
              csvData={csvData.slice(0, 10)}
              fieldMappings={fieldMappings}
            />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back to Mapping
              </Button>
              <Button 
                onClick={processImport} 
                disabled={isProcessing || fieldMappings.filter(m => m.dbField && m.dbField !== 'skip').length === 0}
              >
                Start Import ({fieldMappings.filter(m => m.dbField && m.dbField !== 'skip').length} fields mapped)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="3" className="space-y-4">
            {importResults && (
              <Card>
                <CardHeader>
                  <CardTitle>Import Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">{importResults.total}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{importResults.successful}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                  </div>
                  
                  {importResults.errors.length > 0 && (
                    <div>
                      <Label>Errors:</Label>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResults.errors.map((error, index) => (
                          <Badge key={index} variant="destructive" className="block text-left">
                            {error}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetImport}>
                Import Another File
              </Button>
              <Button onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}