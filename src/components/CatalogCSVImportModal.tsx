import React, { useState } from 'react';
import { useSupplierCatalog } from '@/hooks/useSupplierCatalog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface CatalogCSVImportModalProps {
  onImportComplete?: () => void;
}

interface CSVRow {
  supplier_id: string;
  item_name: string;
  item_code?: string;
  upc_code?: string;
  description?: string;
  unit_price: string;
  currency?: string;
  unit_of_measure?: string;
  minimum_order_quantity?: string;
  lead_time_days?: string;
  availability_status?: string;
  [key: string]: any; // For custom fields
}

export const CatalogCSVImportModal = ({ onImportComplete }: CatalogCSVImportModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  
  const { addCatalogItem } = useSupplierCatalog();

  const downloadTemplate = () => {
    const template = `supplier_id,item_name,item_code,upc_code,description,unit_price,currency,unit_of_measure,minimum_order_quantity,lead_time_days,availability_status,custom_field_1,custom_field_2
uuid-here,Example Cable,CAT6-1000FT,123456789012,Category 6 Cable 1000ft,150.00,USD,feet,1000,7,in_stock,Manufacturer ABC,Color Blue
uuid-here,Network Switch,SW-24P-G,987654321098,24-Port Gigabit Switch,299.99,USD,each,1,14,in_stock,Managed Switch,PoE Enabled`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  const parseCSV = (csvText: string): CSVRow[] => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: CSVRow = {
        supplier_id: '',
        item_name: '',
        unit_price: '0'
      };
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (['supplier_id', 'item_name', 'item_code', 'upc_code', 'description', 'unit_price', 'currency', 'unit_of_measure', 'minimum_order_quantity', 'lead_time_days', 'availability_status'].includes(header)) {
          row[header as keyof CSVRow] = value;
        } else if (header.startsWith('custom_field_') && value) {
          // Handle custom fields
          if (!row.custom_fields) row.custom_fields = {};
          row.custom_fields[header.replace('custom_field_', '')] = value;
        }
      });
      
      return row;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setLoading(true);
    setProgress(0);
    setImportResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length === 0) {
        toast.error('No data found in CSV file');
        return;
      }

      const results = {
        total: rows.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      // Process rows in batches of 10
      const batchSize = 10;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (row, batchIndex) => {
          const rowNumber = i + batchIndex + 2; // +2 for header and 0-based index
          
          try {
            // Validate required fields
            if (!row.supplier_id || !row.item_name || !row.unit_price) {
              throw new Error(`Missing required fields (supplier_id, item_name, unit_price)`);
            }

            const catalogItem = {
              supplier_id: row.supplier_id,
              item_name: row.item_name,
              item_code: row.item_code || '',
              upc_code: row.upc_code || '',
              description: row.description || '',
              unit_price: parseFloat(row.unit_price),
              currency: row.currency || 'USD',
              unit_of_measure: row.unit_of_measure || 'each',
              minimum_order_quantity: parseInt(row.minimum_order_quantity || '1'),
              lead_time_days: parseInt(row.lead_time_days || '7'),
              availability_status: (row.availability_status as any) || 'in_stock',
              custom_fields: row.custom_fields || {}
            };

            await addCatalogItem(catalogItem);
            results.successful++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }));

        setProgress((i + batch.length) / rows.length * 100);
      }

      setImportResults(results);
      
      if (results.successful > 0) {
        toast.success(`Successfully imported ${results.successful} items`);
        onImportComplete?.();
      }
      
      if (results.failed > 0) {
        toast.warning(`${results.failed} items failed to import`);
      }

    } catch (error) {
      console.error('Error processing CSV:', error);
      toast.error('Failed to process CSV file');
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const resetImport = () => {
    setImportResults(null);
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Catalog Items from CSV</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Upload a CSV file to bulk import catalog items. Download the template to see the required format.
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={downloadTemplate}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="mt-1"
            />
          </div>

          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Processing CSV file...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-xs text-muted-foreground text-center">
                {Math.round(progress)}% complete
              </div>
            </div>
          )}

          {importResults && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">Import Results</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-muted-foreground">Total</div>
                  <div className="text-lg">{importResults.total}</div>
                </div>
                <div>
                  <div className="font-medium text-green-600">Successful</div>
                  <div className="text-lg text-green-600">{importResults.successful}</div>
                </div>
                <div>
                  <div className="font-medium text-red-600">Failed</div>
                  <div className="text-lg text-red-600">{importResults.failed}</div>
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="font-medium text-red-600">Errors:</div>
                  <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-red-600">{error}</div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={resetImport} variant="outline" size="sm">
                Import Another File
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};