import React from 'react';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

export const PurchaseOrderManager = () => {
  const { purchaseOrders, loading } = usePurchaseOrders();

  if (loading) {
    return <div>Loading purchase orders...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'pending_approval': return 'outline';
      case 'approved': return 'default';
      case 'ordered': return 'default';
      case 'received': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Purchase Orders</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </div>

      <div className="grid gap-4">
        {purchaseOrders.map((po) => (
          <Card key={po.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{po.po_number}</span>
                <Badge variant={getStatusColor(po.status)}>
                  {po.status.replace('_', ' ')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p><strong>Supplier:</strong></p>
                  <p>{po.supplier?.name || 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Total:</strong></p>
                  <p>{po.currency} {po.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p><strong>Order Date:</strong></p>
                  <p>{po.order_date ? new Date(po.order_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p><strong>Expected Delivery:</strong></p>
                  <p>{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};