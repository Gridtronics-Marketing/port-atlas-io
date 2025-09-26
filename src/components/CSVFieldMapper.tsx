import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, Trash2 } from "lucide-react";

interface FieldMapping {
  csvColumn: string;
  dbField: string;
  isCustomField: boolean;
  dataType: string;
  required: boolean;
}

interface CSVFieldMapperProps {
  csvHeaders: string[];
  fieldMappings: FieldMapping[];
  onMappingsChange: (mappings: FieldMapping[]) => void;
  sampleData: any[];
}

export function CSVFieldMapper({ csvHeaders, fieldMappings, onMappingsChange, sampleData }: CSVFieldMapperProps) {
  const [showCreateField, setShowCreateField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [previewColumn, setPreviewColumn] = useState<string | null>(null);

  const standardFields = [
    { value: 'item_name', label: 'Item Name', required: true },
    { value: 'description', label: 'Description', required: false },
    { value: 'price', label: 'Price', required: true },
    { value: 'supplier_name', label: 'Supplier Name', required: false },
    { value: 'manufacturer', label: 'Manufacturer', required: false },
    { value: 'model_number', label: 'Model Number', required: false },
    { value: 'sku', label: 'SKU/Part Number', required: false },
    { value: 'upc_code', label: 'UPC Code', required: false },
    { value: 'category', label: 'Category', required: false },
    { value: 'availability_status', label: 'Availability Status', required: false },
    { value: 'minimum_order_quantity', label: 'Minimum Order Qty', required: false },
    { value: 'skip', label: '--- Skip Column ---', required: false }
  ];

  const updateMapping = (csvColumn: string, dbField: string) => {
    const updatedMappings = fieldMappings.map(mapping => {
      if (mapping.csvColumn === csvColumn) {
        const standardField = standardFields.find(f => f.value === dbField);
        return {
          ...mapping,
          dbField,
          isCustomField: !standardField && dbField !== 'skip',
          required: standardField?.required || false
        };
      }
      return mapping;
    });
    onMappingsChange(updatedMappings);
  };

  const createCustomField = () => {
    if (!newFieldName.trim()) return;
    
    const fieldKey = newFieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Add new custom field option
    const updatedMappings = fieldMappings.map(mapping => {
      if (mapping.csvColumn === previewColumn) {
        return {
          ...mapping,
          dbField: fieldKey,
          isCustomField: true,
          dataType: newFieldType,
          required: false
        };
      }
      return mapping;
    });
    
    onMappingsChange(updatedMappings);
    setShowCreateField(false);
    setNewFieldName("");
    setNewFieldType("text");
    setPreviewColumn(null);
  };

  const getColumnSample = (columnName: string) => {
    return sampleData.slice(0, 3).map(row => row[columnName]).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Field Mapping</span>
            <Badge variant="secondary">{fieldMappings.filter(m => m.dbField && m.dbField !== 'skip').length} mapped</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {fieldMappings.map((mapping, index) => (
              <div key={mapping.csvColumn} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                <div className="col-span-3">
                  <div className="font-medium">{mapping.csvColumn}</div>
                  <div className="text-sm text-muted-foreground">
                    CSV Column
                  </div>
                </div>

                <div className="col-span-1 text-center text-muted-foreground">
                  →
                </div>

                <div className="col-span-4">
                  <Select
                    value={mapping.dbField}
                    onValueChange={(value) => updateMapping(mapping.csvColumn, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent>
                      {standardFields.map(field => (
                        <SelectItem key={field.value} value={field.value}>
                          <div className="flex items-center gap-2">
                            {field.label}
                            {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  {mapping.isCustomField && mapping.dbField !== 'skip' && (
                    <Badge variant="outline">
                      Custom ({mapping.dataType})
                    </Badge>
                  )}
                  {mapping.required && (
                    <Badge variant="destructive">Required</Badge>
                  )}
                </div>

                <div className="col-span-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewColumn(mapping.csvColumn)}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Dialog open={showCreateField && previewColumn === mapping.csvColumn} onOpenChange={(open) => {
                    setShowCreateField(open);
                    if (!open) setPreviewColumn(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewColumn(mapping.csvColumn);
                          setShowCreateField(true);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Custom Field</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Field Name</Label>
                          <Input
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            placeholder="Enter field name..."
                          />
                        </div>
                        <div>
                          <Label>Data Type</Label>
                          <Select value={newFieldType} onValueChange={setNewFieldType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowCreateField(false)}>
                            Cancel
                          </Button>
                          <Button onClick={createCustomField}>
                            Create Field
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Column Preview Dialog */}
      <Dialog open={!!previewColumn && !showCreateField} onOpenChange={(open) => {
        if (!open) setPreviewColumn(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preview: {previewColumn}</DialogTitle>
          </DialogHeader>
          {previewColumn && (
            <div className="space-y-2">
              <Label>Sample Values:</Label>
              <div className="space-y-1">
                {getColumnSample(previewColumn).map((value, index) => (
                  <Badge key={index} variant="outline" className="block w-fit">
                    {String(value)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}