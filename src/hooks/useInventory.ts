import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  unit_cost?: number;
  supplier?: string;
  location?: string;
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
  supplier?: string;
  reference_number?: string;
  notes?: string;
  transaction_date: string;
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
  condition_out: string;
  condition_in?: string;
  notes?: string;
  status: 'checked_out' | 'returned' | 'overdue' | 'lost_damaged';
  created_at: string;
}

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [toolCheckouts, setToolCheckouts] = useState<ToolCheckout[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInventory = async () => {
    try {
      // Since we don't have an inventory table, we'll simulate with equipment data
      const { data: equipmentData, error } = await supabase
        .from('equipment')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform equipment to inventory items
      const inventoryItems: InventoryItem[] = equipmentData?.map(eq => ({
        id: eq.id,
        name: eq.name,
        category: eq.equipment_type,
        sku: eq.asset_tag,
        description: `${eq.make} ${eq.model}`.trim(),
        unit_of_measure: 'each',
        current_stock: eq.status === 'Available' ? 1 : 0,
        minimum_stock: 1,
        maximum_stock: 5,
        unit_cost: eq.cost,
        supplier: 'TechCorp Supply',
        location: eq.location_id,
        status: eq.status === 'Available' ? 'available' : 'out_of_stock' as any,
        created_at: eq.created_at,
        updated_at: eq.updated_at,
      })) || [];

      // Add some consumable items
      const consumables: InventoryItem[] = [
        {
          id: 'cable-cat6-1000ft',
          name: 'Cat6 Cable - 1000ft',
          category: 'Cables',
          sku: 'CAB-CAT6-1000',
          description: 'Category 6 UTP Cable, 1000ft spool',
          unit_of_measure: 'feet',
          current_stock: 5000,
          minimum_stock: 1000,
          maximum_stock: 10000,
          unit_cost: 0.25,
          supplier: 'Cable Solutions Inc',
          location: 'Warehouse A',
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'fiber-sm-2000ft',
          name: 'Single Mode Fiber - 2000ft',
          category: 'Cables',
          sku: 'FIB-SM-2000',
          description: 'Single Mode Fiber Optic Cable, 2000ft spool',
          unit_of_measure: 'feet',
          current_stock: 800,
          minimum_stock: 500,
          maximum_stock: 3000,
          unit_cost: 0.45,
          supplier: 'Fiber Optics Corp',
          location: 'Warehouse A',
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'connectors-rj45-100',
          name: 'RJ45 Connectors - Box of 100',
          category: 'Connectors',
          sku: 'CON-RJ45-100',
          description: 'Cat6 RJ45 connectors, box of 100',
          unit_of_measure: 'box',
          current_stock: 25,
          minimum_stock: 10,
          maximum_stock: 50,
          unit_cost: 15.99,
          supplier: 'ConnectTech Supply',
          location: 'Warehouse B',
          status: 'available',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'patch-panels-24port',
          name: '24-Port Patch Panel',
          category: 'Patch Panels',
          sku: 'PP-24-CAT6',
          description: '24-port Cat6 patch panel, 1U rack mount',
          unit_of_measure: 'each',
          current_stock: 8,
          minimum_stock: 5,
          maximum_stock: 20,
          unit_cost: 125.00,
          supplier: 'Network Hardware Pro',
          location: 'Warehouse B',
          status: 'low_stock',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'cable-ties-1000',
          name: 'Cable Ties - Pack of 1000',
          category: 'Accessories',
          sku: 'ACC-TIE-1000',
          description: '8" cable ties, pack of 1000',
          unit_of_measure: 'pack',
          current_stock: 2,
          minimum_stock: 5,
          maximum_stock: 20,
          unit_cost: 12.50,
          supplier: 'General Supply Co',
          location: 'Warehouse A',
          status: 'low_stock',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setInventory([...inventoryItems, ...consumables]);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch inventory',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // In a real implementation, this would create an inventory record
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        ...itemData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setInventory(prev => [newItem, ...prev]);
      toast({
        title: 'Success',
        description: 'Inventory item added successfully',
      });
      
      return newItem;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add inventory item',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateStock = async (
    itemId: string, 
    transactionType: 'in' | 'out' | 'adjustment',
    quantity: number,
    employeeId?: string,
    projectId?: string,
    notes?: string
  ) => {
    try {
      const item = inventory.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      let newStock = item.current_stock;
      switch (transactionType) {
        case 'in':
          newStock += quantity;
          break;
        case 'out':
          newStock -= quantity;
          break;
        case 'adjustment':
          newStock = quantity; // Direct adjustment to specific amount
          break;
      }

      // Update item status based on stock levels
      let newStatus: InventoryItem['status'] = 'available';
      if (newStock <= 0) newStatus = 'out_of_stock';
      else if (newStock <= item.minimum_stock) newStatus = 'low_stock';

      // Create transaction record
      const transaction: StockTransaction = {
        id: crypto.randomUUID(),
        inventory_item_id: itemId,
        transaction_type: transactionType,
        quantity: transactionType === 'adjustment' ? quantity - item.current_stock : quantity,
        employee_id: employeeId,
        project_id: projectId,
        notes,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      setTransactions(prev => [transaction, ...prev]);
      setInventory(prev => 
        prev.map(i => i.id === itemId ? {
          ...i,
          current_stock: newStock,
          status: newStatus,
          last_used_date: transactionType === 'out' ? new Date().toISOString() : i.last_used_date,
          last_restock_date: transactionType === 'in' ? new Date().toISOString() : i.last_restock_date,
          updated_at: new Date().toISOString(),
        } : i)
      );

      toast({
        title: 'Success',
        description: `Stock ${transactionType === 'in' ? 'added' : transactionType === 'out' ? 'removed' : 'adjusted'} successfully`,
      });

      // Check for low stock alerts
      if (newStatus === 'low_stock' || newStatus === 'out_of_stock') {
        toast({
          title: 'Stock Alert',
          description: `${item.name} is ${newStatus === 'out_of_stock' ? 'out of stock' : 'running low'}`,
          variant: 'destructive',
        });
      }

      return transaction;
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const checkoutTool = async (
    toolId: string,
    employeeId: string,
    projectId?: string,
    expectedReturnDate?: string,
    notes?: string
  ) => {
    try {
      const checkout: ToolCheckout = {
        id: crypto.randomUUID(),
        tool_id: toolId,
        employee_id: employeeId,
        project_id: projectId,
        checkout_date: new Date().toISOString(),
        expected_return_date: expectedReturnDate,
        condition_out: 'good',
        notes,
        status: 'checked_out',
        created_at: new Date().toISOString(),
      };

      setToolCheckouts(prev => [checkout, ...prev]);

      // Update inventory item status
      await updateStock(toolId, 'out', 1, employeeId, projectId, `Tool checked out: ${notes || ''}`);

      toast({
        title: 'Success',
        description: 'Tool checked out successfully',
      });

      return checkout;
    } catch (error) {
      console.error('Error checking out tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to check out tool',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const returnTool = async (checkoutId: string, condition: string, notes?: string) => {
    try {
      const checkout = toolCheckouts.find(c => c.id === checkoutId);
      if (!checkout) throw new Error('Checkout record not found');

      setToolCheckouts(prev =>
        prev.map(c => c.id === checkoutId ? {
          ...c,
          actual_return_date: new Date().toISOString(),
          condition_in: condition,
          notes: notes || c.notes,
          status: 'returned',
        } : c)
      );

      // Update inventory item status
      await updateStock(
        checkout.tool_id, 
        'in', 
        1, 
        checkout.employee_id, 
        checkout.project_id, 
        `Tool returned: ${condition} condition. ${notes || ''}`
      );

      toast({
        title: 'Success',
        description: 'Tool returned successfully',
      });
    } catch (error) {
      console.error('Error returning tool:', error);
      toast({
        title: 'Error',
        description: 'Failed to return tool',
        variant: 'destructive',
      });
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
      return total + (item.current_stock * (item.unit_cost || 0));
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