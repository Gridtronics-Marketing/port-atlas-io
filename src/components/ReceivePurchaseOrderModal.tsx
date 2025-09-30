import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, CheckCircle } from 'lucide-react';

interface PurchaseOrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  inventory_item_id?: string;
}

interface ReceivePurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrder: {
    id: string;
    po_number: string;
    status: string;
  };
  items: PurchaseOrderItem[];
  onSuccess: () => void;
}

export const ReceivePurchaseOrderModal = ({
  open,
  onClose,
  purchaseOrder,
  items,
  onSuccess,
}: ReceivePurchaseOrderModalProps) => {
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>(
    items.reduce((acc, item) => ({ ...acc, [item.id]: item.quantity }), {})
  );
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReceive = async () => {
    try {
      setLoading(true);

      // Check if all items are fully received
      const allReceived = items.every(
        item => receivedQuantities[item.id] === item.quantity
      );

      const newStatus = allReceived ? 'received' : 'partially_received';

      // Update PO status - this will trigger the auto-inventory update
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({
          status: newStatus,
          received_date: new Date().toISOString(),
        })
        .eq('id', purchaseOrder.id);

      if (updateError) throw updateError;

      // If partial receipt, create a note about what was received
      if (!allReceived) {
        const partialNotes = items
          .map(item => `${item.item_name}: ${receivedQuantities[item.id]}/${item.quantity}`)
          .join(', ');
        
        await supabase
          .from('purchase_orders')
          .update({
            notes: `Partial receipt: ${partialNotes}. ${notes}`,
          })
          .eq('id', purchaseOrder.id);
      }

      toast.success(
        allReceived 
          ? 'Purchase order received! Inventory updated automatically.'
          : 'Partial receipt recorded. Update status to "received" when complete.'
      );
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error receiving PO:', error);
      toast.error('Failed to receive purchase order');
    } finally {
      setLoading(false);
    }
  };

  const itemsWithInventory = items.filter(item => item.inventory_item_id);
  const itemsWithoutInventory = items.filter(item => !item.inventory_item_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Receive Purchase Order: {purchaseOrder.po_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {itemsWithInventory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Items that will update inventory
              </h3>
              <div className="space-y-3">
                {itemsWithInventory.map(item => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{item.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Ordered: {item.quantity} @ ${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Label className="text-xs">Received Qty</Label>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={receivedQuantities[item.id]}
                          onChange={(e) =>
                            setReceivedQuantities(prev => ({
                              ...prev,
                              [item.id]: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20 mt-1"
                        />
                      </div>
                    </div>
                    {receivedQuantities[item.id] !== item.quantity && (
                      <p className="text-xs text-amber-600">
                        Partial receipt: {receivedQuantities[item.id]}/{item.quantity}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {itemsWithoutInventory.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                Items not linked to inventory (record only)
              </h3>
              <div className="space-y-2">
                {itemsWithoutInventory.map(item => (
                  <div key={item.id} className="border rounded-lg p-3 bg-muted/30">
                    <p className="font-medium text-sm">{item.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Quantity: {item.quantity} @ ${item.unit_price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Receipt Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any notes about this receipt (damage, quality issues, etc.)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {itemsWithInventory.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Auto-update:</strong> Marking this as received will automatically:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 ml-4 list-disc space-y-1">
                <li>Add received quantities to inventory stock</li>
                <li>Update average costs and last purchase prices</li>
                <li>Create stock transaction records</li>
                <li>Update item status (available/low stock)</li>
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleReceive} disabled={loading}>
              {loading ? 'Receiving...' : 'Confirm Receipt'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
