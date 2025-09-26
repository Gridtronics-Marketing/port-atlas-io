import React from 'react';
import { useSupplierCatalog } from '@/hooks/useSupplierCatalog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { PriceComparisonModal } from '@/components/PriceComparisonModal';

export const SupplierCatalogManager = () => {
  const { catalogItems, loading } = useSupplierCatalog();

  if (loading) {
    return <div>Loading catalog items...</div>;
  }

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Supplier Catalog</h2>
        <div className="space-x-2">
          <PriceComparisonModal />
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {catalogItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span className="text-sm">{item.item_name}</span>
                <Badge variant={getAvailabilityColor(item.availability_status)}>
                  {item.availability_status.replace('_', ' ')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Supplier:</strong> {item.supplier?.name}</p>
                <p><strong>Price:</strong> {item.currency} {item.unit_price.toFixed(2)}</p>
                <p><strong>Min Order:</strong> {item.minimum_order_quantity}</p>
                <p><strong>Lead Time:</strong> {item.lead_time_days} days</p>
                {item.item_code && <p><strong>Code:</strong> {item.item_code}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};