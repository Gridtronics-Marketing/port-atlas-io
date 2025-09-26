import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface FieldMapping {
  csvColumn: string;
  dbField: string;
  isCustomField: boolean;
  dataType: string;
  required: boolean;
}

interface CSVDataPreviewProps {
  csvData: any[];
  fieldMappings: FieldMapping[];
}

export function CSVDataPreview({ csvData, fieldMappings }: CSVDataPreviewProps) {
  const activeMappings = fieldMappings.filter(m => m.dbField && m.dbField !== 'skip');
  
  const transformValue = (value: string, mapping: FieldMapping) => {
    if (!value) return '';
    
    if (mapping.isCustomField) {
      switch (mapping.dataType) {
        case 'number':
          return parseFloat(value) || 0;
        case 'boolean':
          return ['true', '1', 'yes', 'y'].includes(value.toLowerCase()) ? 'Yes' : 'No';
        case 'date':
          try {
            return new Date(value).toLocaleDateString();
          } catch {
            return value;
          }
        default:
          return value;
      }
    }
    
    if (mapping.dbField === 'price' || mapping.dbField === 'minimum_order_quantity') {
      const num = parseFloat(value);
      return isNaN(num) ? value : (mapping.dbField === 'price' ? `$${num.toFixed(2)}` : num.toString());
    }
    
    return value;
  };

  const getFieldLabel = (mapping: FieldMapping) => {
    if (mapping.isCustomField) {
      return mapping.dbField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    const labels: { [key: string]: string } = {
      'item_name': 'Item Name',
      'description': 'Description',
      'price': 'Price',
      'supplier_name': 'Supplier',
      'manufacturer': 'Manufacturer',
      'model_number': 'Model',
      'sku': 'SKU',
      'upc_code': 'UPC',
      'category': 'Category',
      'availability_status': 'Availability',
      'minimum_order_quantity': 'Min Qty'
    };
    
    return labels[mapping.dbField] || mapping.dbField;
  };

  if (csvData.length === 0 || activeMappings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Data Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {csvData.length === 0 ? 'No data to preview' : 'No fields mapped for import'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Data Preview
          <Badge variant="secondary">
            {csvData.length} rows × {activeMappings.length} fields
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {activeMappings.map((mapping, index) => (
                  <TableHead key={index} className="whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="font-medium">{getFieldLabel(mapping)}</div>
                      <div className="flex gap-1">
                        {mapping.isCustomField && (
                          <Badge variant="outline" className="text-xs">
                            Custom
                          </Badge>
                        )}
                        {mapping.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {mapping.isCustomField && (
                          <Badge variant="secondary" className="text-xs">
                            {mapping.dataType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {csvData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {activeMappings.map((mapping, colIndex) => {
                    const rawValue = row[mapping.csvColumn];
                    const transformedValue = transformValue(rawValue, mapping);
                    const isEmpty = !rawValue?.toString().trim();
                    
                    return (
                      <TableCell 
                        key={colIndex} 
                        className={`whitespace-nowrap ${isEmpty && mapping.required ? 'bg-red-50 text-red-700' : ''}`}
                      >
                        {isEmpty && mapping.required ? (
                          <Badge variant="destructive" className="text-xs">
                            Missing Required
                          </Badge>
                        ) : (
                          <span className={isEmpty ? 'text-muted-foreground italic' : ''}>
                            {transformedValue || 'empty'}
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Showing first {csvData.length} rows. Custom fields will be stored in the custom_fields JSON column.</p>
          {activeMappings.some(m => m.required) && (
            <p className="text-red-600 mt-1">
              Red cells indicate missing required fields that will cause import errors.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}