import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku?: string;
  description?: string;
  unit_of_measure: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  reorder_point: number;
  unit_cost?: number;
  last_purchase_price?: number;
  average_cost?: number;
  preferred_supplier_id?: string;
  alternate_supplier_ids?: string[];
  location_id?: string;
  warehouse_location?: string;
  last_restock_date?: string;
  last_used_date?: string;
  status: 'available' | 'low_stock' | 'out_of_stock' | 'discontinued';
  created_at: string;
  updated_at: string;
}

export interface StockTransaction {
  id: string;
  inventory_item_id: string;
  transaction_type: 'in' | 'out' | 'adjustment' | 'return';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  employee_id?: string;
  project_id?: string;
  work_order_id?: string;
  purchase_order_id?: string;
  supplier_id?: string;
  reference_number?: string;
  transaction_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface ToolCheckout {
  id: string;
  tool_id: string;
  employee_id: string;
  project_id?: string;
  checkout_date: string;
  expected_return_date?: string;
  actual_return_date?: string;
  condition_out?: string;
  condition_in?: string;
  status: 'checked_out' | 'returned' | 'overdue' | 'lost_damaged';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [toolCheckouts, setToolCheckouts] = useState<ToolCheckout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      
      // Fetch inventory items from database
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (inventoryError) throw inventoryError;

      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('stock_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (transactionsError) throw transactionsError;

      // Fetch tool checkouts
      const { data: checkoutsData, error: checkoutsError } = await supabase
        .from('tool_checkouts')
        .select('*')
        .order('checkout_date', { ascending: false });

      if (checkoutsError) throw checkoutsError;

      setInventory((inventoryData || []) as InventoryItem[]);
      setTransactions((transactionsData || []) as StockTransaction[]);
      setToolCheckouts((checkoutsData || []) as ToolCheckout[]);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([itemData])
        .select()
        .single();

      if (error) throw error;

      setInventory(prev => [data as InventoryItem, ...prev]);
      toast.success('Inventory item added successfully');
      return data;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast.error('Failed to add inventory item');
      throw error;
    }
  };

  const updateStock = async (
    itemId: string,
    transactionType: 'in' | 'out' | 'adjustment' | 'return',
    quantity: number,
    employeeId?: string,
    projectId?: string,
    workOrderId?: string,
    notes?: string
  ) => {
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      // Create stock transaction
      const transactionData = {
        inventory_item_id: itemId,
        transaction_type: transactionType,
        quantity,
        employee_id: employeeId,
        project_id: projectId,
        work_order_id: workOrderId,
        notes,
        unit_cost: item.unit_cost,
        total_cost: item.unit_cost ? item.unit_cost * quantity : undefined,
      };

      const { data: transaction, error: transactionError } = await supabase
        .from('stock_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Calculate new stock level
      let newStock = item.current_stock;
      if (transactionType === 'in' || transactionType === 'return') {
        newStock += quantity;
      } else if (transactionType === 'out') {
        newStock -= quantity;
      } else if (transactionType === 'adjustment') {
        newStock = quantity;
      }

      // Determine new status
      let newStatus: InventoryItem['status'] = 'available';
      if (newStock === 0) {
        newStatus = 'out_of_stock';
      } else if (newStock <= item.reorder_point) {
        newStatus = 'low_stock';
      }

      // Update inventory item
      const { data: updatedItem, error: updateError } = await supabase
        .from('inventory_items')
        .update({
          current_stock: newStock,
          status: newStatus,
          last_used_date: transactionType === 'out' ? new Date().toISOString() : item.last_used_date,
        })
        .eq('id', itemId)
        .select()
        .single();

      if (updateError) throw updateError;

      setInventory(prev => prev.map(i => i.id === itemId ? updatedItem as InventoryItem : i));
      setTransactions(prev => [transaction as StockTransaction, ...prev]);
      toast.success('Stock updated successfully');

      if (newStatus === 'low_stock' || newStatus === 'out_of_stock') {
        toast.error(`${item.name} is ${newStatus === 'out_of_stock' ? 'out of stock' : 'running low'}`);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
      throw error;
    }
  };

  const checkoutTool = async (
    toolId: string,
    employeeId: string,
    projectId?: string,
    expectedReturnDate?: string,
    conditionOut?: string,
    notes?: string
  ) => {
    try {
      const checkoutData = {
        tool_id: toolId,
        employee_id: employeeId,
        project_id: projectId,
        expected_return_date: expectedReturnDate,
        condition_out: conditionOut,
        notes,
        status: 'checked_out' as const,
      };

      const { data, error } = await supabase
        .from('tool_checkouts')
        .insert([checkoutData])
        .select()
        .single();

      if (error) throw error;

      await updateStock(toolId, 'out', 1, employeeId, projectId, undefined, `Tool checked out: ${notes || ''}`);

      setToolCheckouts(prev => [data as ToolCheckout, ...prev]);
      toast.success('Tool checked out successfully');
      return data;
    } catch (error) {
      console.error('Error checking out tool:', error);
      toast.error('Failed to check out tool');
      throw error;
    }
  };

  const returnTool = async (
    checkoutId: string,
    conditionIn?: string,
    notes?: string
  ) => {
    try {
      const checkout = toolCheckouts.find(c => c.id === checkoutId);
      if (!checkout) throw new Error('Checkout not found');

      const { data, error } = await supabase
        .from('tool_checkouts')
        .update({
          status: 'returned' as const,
          actual_return_date: new Date().toISOString(),
          condition_in: conditionIn,
          notes: notes || checkout.notes,
        })
        .eq('id', checkoutId)
        .select()
        .single();

      if (error) throw error;

      await updateStock(
        checkout.tool_id,
        'return',
        1,
        checkout.employee_id,
        checkout.project_id,
        undefined,
        `Tool returned: ${notes || ''}`
      );

      setToolCheckouts(prev => prev.map(c => c.id === checkoutId ? data as ToolCheckout : c));
      toast.success('Tool returned successfully');
    } catch (error) {
      console.error('Error returning tool:', error);
      toast.error('Failed to return tool');
      throw error;
    }
  };

  const getLowStockItems = () => {
    return inventory.filter(item => 
      item.status === 'low_stock' || item.status === 'out_of_stock'
    );
  };

  const getInventoryValue = () => {
    return inventory.reduce((total, item) => {
      const itemValue = (item.average_cost || item.unit_cost || 0) * item.current_stock;
      return total + itemValue;
    }, 0);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  return {
    inventory,
    transactions,
    toolCheckouts,
    loading,
    addInventoryItem,
    updateStock,
    checkoutTool,
    returnTool,
    getLowStockItems,
    getInventoryValue,
    refetch: fetchInventory,
  };
}
