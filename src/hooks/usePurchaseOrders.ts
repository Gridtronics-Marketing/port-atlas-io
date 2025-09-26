import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id?: string;
  location_id?: string;
  created_by?: string;
  approved_by?: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  order_date?: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  currency: string;
  shipping_address?: string;
  billing_address?: string;
  terms_and_conditions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  supplier?: {
    name: string;
    contact_name?: string;
  };
  location?: {
    name: string;
    address: string;
  };
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  supplier_catalog_id?: string;
  item_name: string;
  item_code?: string;
  description?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  received_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderFormData {
  supplier_id?: string;
  location_id?: string;
  order_date?: string;
  expected_delivery_date?: string;
  shipping_address?: string;
  billing_address?: string;
  terms_and_conditions?: string;
  notes?: string;
  items: Array<{
    item_name: string;
    item_code?: string;
    description?: string;
    quantity: number;
    unit_price: number;
  }>;
}

export const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(name, contact_name),
          location:locations(name, address)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchaseOrders((data || []) as PurchaseOrder[]);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePONumber = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('generate_po_number');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating PO number:', error);
      throw error;
    }
  };

  const createPurchaseOrder = async (poData: PurchaseOrderFormData) => {
    try {
      // Generate PO number
      const poNumber = await generatePONumber();
      
      // Calculate totals
      const subtotal = poData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = subtotal * 0.1; // 10% tax rate - should be configurable
      const totalAmount = subtotal + taxAmount;

      // Create PO
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert([{
          po_number: poNumber,
          supplier_id: poData.supplier_id,
          location_id: poData.location_id,
          order_date: poData.order_date,
          expected_delivery_date: poData.expected_delivery_date,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          shipping_address: poData.shipping_address,
          billing_address: poData.billing_address,
          terms_and_conditions: poData.terms_and_conditions,
          notes: poData.notes,
          status: 'draft'
        }])
        .select()
        .single();

      if (poError) throw poError;

      // Create PO items
      const items = poData.items.map(item => ({
        purchase_order_id: po.id,
        item_name: item.item_name,
        item_code: item.item_code,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(items);

      if (itemsError) throw itemsError;

      await fetchPurchaseOrders();
      toast({
        title: "Success",
        description: `Purchase Order ${poNumber} created successfully`,
      });
      return po;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePurchaseOrderStatus = async (id: string, status: PurchaseOrder['status']) => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPurchaseOrders(prev => 
        prev.map(po => po.id === id ? { ...po, status } : po)
      );
      
      toast({
        title: "Success",
        description: "Purchase order status updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      toast({
        title: "Error",
        description: "Failed to update purchase order status",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getPurchaseOrderItems = async (purchaseOrderId: string): Promise<PurchaseOrderItem[]> => {
    try {
      const { data, error } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId)
        .order('created_at');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching purchase order items:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  return {
    purchaseOrders,
    loading,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    getPurchaseOrderItems,
    refetch: fetchPurchaseOrders,
  };
};