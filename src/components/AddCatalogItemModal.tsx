import React, { useState } from 'react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useSupplierCatalog } from '@/hooks/useSupplierCatalog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddCatalogItemModalProps {
  onItemAdded?: () => void;
}

export const AddCatalogItemModal = ({ onItemAdded }: AddCatalogItemModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { suppliers } = useSuppliers();
  const { addCatalogItem } = useSupplierCatalog();

  const [formData, setFormData] = useState({
    supplier_id: '',
    item_name: '',
    item_code: '',
    upc_code: '',
    description: '',
    unit_price: '',
    currency: 'USD',
    unit_of_measure: 'each',
    minimum_order_quantity: '1',
    lead_time_days: '7',
    availability_status: 'in_stock' as const,
    custom_fields: {} as Record<string, any>
  });

  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCustomField = () => {
    if (customFieldKey && customFieldValue) {
      setFormData(prev => ({
        ...prev,
        custom_fields: {
          ...prev.custom_fields,
          [customFieldKey]: customFieldValue
        }
      }));
      setCustomFieldKey('');
      setCustomFieldValue('');
    }
  };

  const removeCustomField = (key: string) => {
    setFormData(prev => {
      const newCustomFields = { ...prev.custom_fields };
      delete newCustomFields[key];
      return { ...prev, custom_fields: newCustomFields };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id || !formData.item_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await addCatalogItem({
        ...formData,
        unit_price: parseFloat(formData.unit_price),
        minimum_order_quantity: parseInt(formData.minimum_order_quantity),
        lead_time_days: parseInt(formData.lead_time_days)
      });
      
      toast.success('Catalog item added successfully');
      setOpen(false);
      setFormData({
        supplier_id: '',
        item_name: '',
        item_code: '',
        upc_code: '',
        description: '',
        unit_price: '',
        currency: 'USD',
        unit_of_measure: 'each',
        minimum_order_quantity: '1',
        lead_time_days: '7',
        availability_status: 'in_stock',
        custom_fields: {}
      });
      onItemAdded?.();
    } catch (error) {
      console.error('Error adding catalog item:', error);
      toast.error('Failed to add catalog item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Catalog Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Supplier *</Label>
              <Select 
                value={formData.supplier_id} 
                onValueChange={(value) => handleInputChange('supplier_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item_name">Item Name *</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => handleInputChange('item_name', e.target.value)}
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <Label htmlFor="item_code">Item Code/SKU</Label>
              <Input
                id="item_code"
                value={formData.item_code}
                onChange={(e) => handleInputChange('item_code', e.target.value)}
                placeholder="Enter item code"
              />
            </div>

            <div>
              <Label htmlFor="upc_code">UPC Code</Label>
              <Input
                id="upc_code"
                value={formData.upc_code}
                onChange={(e) => handleInputChange('upc_code', e.target.value)}
                placeholder="Enter UPC code"
              />
            </div>

            <div>
              <Label htmlFor="unit_price">Unit Price *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => handleInputChange('unit_price', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="unit_of_measure">Unit of Measure</Label>
              <Select 
                value={formData.unit_of_measure} 
                onValueChange={(value) => handleInputChange('unit_of_measure', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="each">Each</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="case">Case</SelectItem>
                  <SelectItem value="dozen">Dozen</SelectItem>
                  <SelectItem value="feet">Feet</SelectItem>
                  <SelectItem value="meters">Meters</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="minimum_order_quantity">Min Order Qty</Label>
              <Input
                id="minimum_order_quantity"
                type="number"
                value={formData.minimum_order_quantity}
                onChange={(e) => handleInputChange('minimum_order_quantity', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="lead_time_days">Lead Time (Days)</Label>
              <Input
                id="lead_time_days"
                type="number"
                value={formData.lead_time_days}
                onChange={(e) => handleInputChange('lead_time_days', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="availability_status">Availability</Label>
              <Select 
                value={formData.availability_status} 
                onValueChange={(value: any) => handleInputChange('availability_status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter item description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Custom Fields</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Field name"
                value={customFieldKey}
                onChange={(e) => setCustomFieldKey(e.target.value)}
              />
              <Input
                placeholder="Field value"
                value={customFieldValue}
                onChange={(e) => setCustomFieldValue(e.target.value)}
              />
              <Button type="button" onClick={addCustomField} size="sm">
                Add
              </Button>
            </div>
            
            {Object.entries(formData.custom_fields).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-sm font-medium">{key}:</span>
                <span className="text-sm">{String(value)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCustomField(key)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};