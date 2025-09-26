import React, { useState } from 'react';
import { usePurchaseOrders, type PurchaseOrderFormData } from '@/hooks/usePurchaseOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useLocations } from '@/hooks/useLocations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Trash2, Search } from 'lucide-react';
import { ItemSearchModal } from '@/components/ItemSearchModal';
import { toast } from 'sonner';

interface CreatePurchaseOrderModalProps {
  onPOCreated?: () => void;
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({ onPOCreated }) => {
  const { createPurchaseOrder } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { locations } = useLocations();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    supplier_id: '',
    location_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    shipping_address: '',
    billing_address: '',
    terms_and_conditions: '',
    notes: '',
    items: [{ item_name: '', item_code: '', description: '', quantity: 1, unit_price: 0 }],
  });

  const handleInputChange = (field: keyof Omit<PurchaseOrderFormData, 'items'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderFormData['items'][0], value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_name: '', item_code: '', description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const addCatalogItem = (catalogItem: any, quantity: number) => {
    const newItem = {
      item_name: catalogItem.item_name,
      item_code: catalogItem.item_code || '',
      description: catalogItem.description || '',
      quantity: quantity,
      unit_price: catalogItem.unit_price,
      upc_code: catalogItem.upc_code || '',
      supplier_catalog_id: catalogItem.id
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    toast.success(`Added ${catalogItem.item_name} to purchase order`);
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id || formData.items.length === 0) return;

    setLoading(true);
    try {
      await createPurchaseOrder(formData);
      setOpen(false);
      setFormData({
        supplier_id: '',
        location_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        shipping_address: '',
        billing_address: '',
        terms_and_conditions: '',
        notes: '',
        items: [{ item_name: '', item_code: '', description: '', quantity: 1, unit_price: 0 }],
      });
      onPOCreated?.();
    } catch (error) {
      console.error('Error creating purchase order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Supplier *</Label>
                  <Select value={formData.supplier_id} onValueChange={(value) => handleInputChange('supplier_id', value)}>
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
                <div className="space-y-2">
                  <Label htmlFor="location_id">Delivery Location</Label>
                  <Select value={formData.location_id} onValueChange={(value) => handleInputChange('location_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order_date">Order Date</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => handleInputChange('order_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                  <Input
                    id="expected_delivery_date"
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => handleInputChange('expected_delivery_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                Items
                <div className="flex gap-2">
                  <ItemSearchModal onItemSelect={addCatalogItem}>
                    <Button type="button" variant="outline" size="sm">
                      <Search className="h-4 w-4 mr-1" />
                      Browse Catalog
                    </Button>
                  </ItemSearchModal>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {formData.items.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Item Name *</Label>
                      <Input
                        value={item.item_name}
                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                        placeholder="Enter item name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Item Code</Label>
                      <Input
                        value={item.item_code}
                        onChange={(e) => handleItemChange(index, 'item_code', e.target.value)}
                        placeholder="Enter item code"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Enter item description"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Line Total</Label>
                      <Input
                        value={`$${(item.quantity * item.unit_price).toFixed(2)}`}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="text-right pt-4 border-t">
                <p className="text-lg font-semibold">
                  Subtotal: ${calculateSubtotal().toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shipping_address">Shipping Address</Label>
                  <Textarea
                    id="shipping_address"
                    value={formData.shipping_address}
                    onChange={(e) => handleInputChange('shipping_address', e.target.value)}
                    placeholder="Enter shipping address"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billing_address">Billing Address</Label>
                  <Textarea
                    id="billing_address"
                    value={formData.billing_address}
                    onChange={(e) => handleInputChange('billing_address', e.target.value)}
                    placeholder="Enter billing address"
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
                <Textarea
                  id="terms_and_conditions"
                  value={formData.terms_and_conditions}
                  onChange={(e) => handleInputChange('terms_and_conditions', e.target.value)}
                  placeholder="Enter terms and conditions"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Purchase Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};