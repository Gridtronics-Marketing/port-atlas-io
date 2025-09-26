import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupplierCatalogItem {
  id: string;
  supplier_id: string;
  item_name: string;
  item_code?: string;
  upc_code?: string;
  description?: string;
  category?: string;
  unit_price: number;
  currency: string;
  unit_of_measure?: string;
  minimum_order_quantity: number;
  lead_time_days: number;
  availability_status: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued';
  custom_fields?: Record<string, any>;
  last_price_update: string;
  created_at: string;
  updated_at: string;
  supplier?: {
    name: string;
    supplier_code?: string;
  };
}

export interface CatalogItemFormData {
  supplier_id: string;
  item_name: string;
  item_code?: string;
  upc_code?: string;
  description?: string;
  category?: string;
  unit_price: number;
  currency: string;
  unit_of_measure?: string;
  minimum_order_quantity: number;
  lead_time_days: number;
  availability_status: 'in_stock' | 'out_of_stock' | 'limited' | 'discontinued';
  custom_fields?: Record<string, any>;
}

export interface PriceComparison {
  item_name: string;
  suppliers: Array<{
    supplier_id: string;
    supplier_name: string;
    unit_price: number;
    availability_status: string;
    lead_time_days: number;
    minimum_order_quantity: number;
  }>;
}

export const useSupplierCatalog = () => {
  const [catalogItems, setCatalogItems] = useState<SupplierCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCatalogItems = async (supplierId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('supplier_catalogs')
        .select(`
          *,
          supplier:suppliers(name, supplier_code)
        `)
        .order('item_name');

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCatalogItems((data || []) as SupplierCatalogItem[]);
    } catch (error) {
      console.error('Error fetching catalog items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch catalog items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addCatalogItem = async (itemData: CatalogItemFormData) => {
    try {
      const { data, error } = await supabase
        .from('supplier_catalogs')
        .insert([itemData])
        .select(`
          *,
          supplier:suppliers(name, supplier_code)
        `)
        .single();

      if (error) throw error;

      setCatalogItems(prev => [...prev, data as SupplierCatalogItem]);
      toast({
        title: "Success",
        description: "Catalog item added successfully",
      });
      return data;
    } catch (error) {
      console.error('Error adding catalog item:', error);
      toast({
        title: "Error",
        description: "Failed to add catalog item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCatalogItem = async (id: string, updates: Partial<CatalogItemFormData>) => {
    try {
      // Track price changes
      if (updates.unit_price) {
        const currentItem = catalogItems.find(item => item.id === id);
        if (currentItem && currentItem.unit_price !== updates.unit_price) {
          const priceChangePercentage = ((updates.unit_price - currentItem.unit_price) / currentItem.unit_price) * 100;
          
          await supabase
            .from('supplier_price_history')
            .insert([{
              supplier_catalog_id: id,
              old_price: currentItem.unit_price,
              new_price: updates.unit_price,
              price_change_percentage: priceChangePercentage,
              change_reason: 'Manual update'
            }]);
        }
      }

      const { data, error } = await supabase
        .from('supplier_catalogs')
        .update({ ...updates, last_price_update: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          supplier:suppliers(name, supplier_code)
        `)
        .single();

      if (error) throw error;

      setCatalogItems(prev => 
        prev.map(item => item.id === id ? data as SupplierCatalogItem : item)
      );
      toast({
        title: "Success",
        description: "Catalog item updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating catalog item:', error);
      toast({
        title: "Error",
        description: "Failed to update catalog item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCatalogItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('supplier_catalogs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCatalogItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Success",
        description: "Catalog item deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting catalog item:', error);
      toast({
        title: "Error",
        description: "Failed to delete catalog item",
        variant: "destructive",
      });
      throw error;
    }
  };

  const searchCatalogItems = async (searchTerm: string): Promise<SupplierCatalogItem[]> => {
    try {
      const { data, error } = await supabase
        .from('supplier_catalogs')
        .select(`
          *,
          supplier:suppliers(name, supplier_code)
        `)
        .or(`item_name.ilike.%${searchTerm}%,item_code.ilike.%${searchTerm}%,upc_code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('item_name');

      if (error) throw error;
      setCatalogItems((data || []) as SupplierCatalogItem[]);
      return (data || []) as SupplierCatalogItem[];
    } catch (error) {
      console.error('Error searching catalog items:', error);
      throw error;
    }
  };

  const getPriceComparison = async (itemName: string): Promise<PriceComparison | null> => {
    try {
      const { data, error } = await supabase
        .from('supplier_catalogs')
        .select(`
          supplier_id,
          unit_price,
          availability_status,
          lead_time_days,
          minimum_order_quantity,
          supplier:suppliers(name)
        `)
        .ilike('item_name', `%${itemName}%`)
        .order('unit_price');

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return {
        item_name: itemName,
        suppliers: data.map(item => ({
          supplier_id: item.supplier_id,
          supplier_name: item.supplier?.name || 'Unknown',
          unit_price: item.unit_price,
          availability_status: item.availability_status,
          lead_time_days: item.lead_time_days,
          minimum_order_quantity: item.minimum_order_quantity
        }))
      };
    } catch (error) {
      console.error('Error getting price comparison:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCatalogItems();
  }, []);

  return {
    catalogItems,
    loading,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    searchCatalogItems,
    getPriceComparison,
    refetch: fetchCatalogItems,
  };
};