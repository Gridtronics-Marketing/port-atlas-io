import React, { useState, useEffect, useMemo } from 'react';
import { useSupplierCatalog } from '@/hooks/useSupplierCatalog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ItemSearchModalProps {
  onItemSelect: (item: any, quantity: number) => void;
  children: React.ReactNode;
}

export const ItemSearchModal = ({ onItemSelect, children }: ItemSearchModalProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  
  const { catalogItems, loading, searchCatalogItems } = useSupplierCatalog();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchCatalogItems(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchCatalogItems]);

  const filteredItems = useMemo(() => {
    let items = catalogItems;

    // Apply text search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => {
        switch (searchField) {
          case 'name':
            return item.item_name.toLowerCase().includes(term);
          case 'sku':
            return item.item_code?.toLowerCase().includes(term);
          case 'upc':
            return item.upc_code?.toLowerCase().includes(term);
          case 'vendor':
            return item.supplier?.name?.toLowerCase().includes(term);
          case 'custom':
            return Object.values(item.custom_fields || {}).some(value => 
              String(value).toLowerCase().includes(term)
            );
          case 'all':
          default:
            return (
              item.item_name.toLowerCase().includes(term) ||
              item.item_code?.toLowerCase().includes(term) ||
              item.upc_code?.toLowerCase().includes(term) ||
              item.supplier?.name?.toLowerCase().includes(term) ||
              item.description?.toLowerCase().includes(term) ||
              Object.values(item.custom_fields || {}).some(value => 
                String(value).toLowerCase().includes(term)
              )
            );
        }
      });
    }

    // Apply price range filter
    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min);
      items = items.filter(item => item.unit_price >= minPrice);
    }
    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max);
      items = items.filter(item => item.unit_price <= maxPrice);
    }

    // Apply availability filter
    if (availabilityFilter !== 'all') {
      items = items.filter(item => item.availability_status === availabilityFilter);
    }

    return items;
  }, [catalogItems, searchTerm, searchField, priceRange, availabilityFilter]);

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    setQuantity(item.minimum_order_quantity || 1);
  };

  const handleAddItem = () => {
    if (selectedItem && quantity > 0) {
      onItemSelect(selectedItem, quantity);
      setOpen(false);
      setSelectedItem(null);
      setQuantity(1);
      setSearchTerm('');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSearchField('all');
    setPriceRange({ min: '', max: '' });
    setAvailabilityFilter('all');
    setShowFilters(false);
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'default';
      case 'limited': return 'outline';
      case 'out_of_stock': return 'destructive';
      case 'discontinued': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Catalog Items</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="sku">SKU</SelectItem>
                  <SelectItem value="upc">UPC</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="custom">Custom Fields</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-muted" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {showFilters && (
              <div className="p-3 border rounded-lg space-y-3 bg-muted/50">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Min Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Max Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                      placeholder="999.99"
                    />
                  </div>
                  <div>
                    <Label>Availability</Label>
                    <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="in_stock">In Stock</SelectItem>
                        <SelectItem value="limited">Limited</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden flex">
            {/* Items List */}
            <div className="flex-1 overflow-y-auto pr-4">
              {loading ? (
                <div className="text-center py-8">Loading items...</div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items found matching your search criteria
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedItem?.id === item.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleItemSelect(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">{item.item_name}</div>
                            <div className="text-sm text-muted-foreground flex gap-4">
                              {item.item_code && <span>SKU: {item.item_code}</span>}
                              {item.upc_code && <span>UPC: {item.upc_code}</span>}
                              <span>Vendor: {item.supplier?.name}</span>
                            </div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                              </div>
                            )}
                            {Object.keys(item.custom_fields || {}).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {Object.entries(item.custom_fields || {}).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {key}: {String(value)}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-semibold">
                              {item.currency} {item.unit_price.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              per {item.unit_of_measure}
                            </div>
                            <Badge variant={getAvailabilityColor(item.availability_status)} className="mt-1">
                              {item.availability_status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Selection Panel */}
            {selectedItem && (
              <div className="w-80 pl-4 border-l">
                <div className="sticky top-0 space-y-4">
                  <h3 className="font-semibold">Selected Item</h3>
                  <Card>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="font-medium">{selectedItem.item_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedItem.supplier?.name}
                        </div>
                        <div className="font-semibold">
                          {selectedItem.currency} {selectedItem.unit_price.toFixed(2)} per {selectedItem.unit_of_measure}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Min Order: {selectedItem.minimum_order_quantity}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Lead Time: {selectedItem.lead_time_days} days
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={selectedItem.minimum_order_quantity || 1}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>

                  <div className="text-sm font-medium">
                    Total: {selectedItem.currency} {(selectedItem.unit_price * quantity).toFixed(2)}
                  </div>

                  <Button onClick={handleAddItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to PO
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};