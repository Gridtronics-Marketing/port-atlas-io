-- Phase 1: Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sku TEXT UNIQUE,
  description TEXT,
  unit_of_measure TEXT NOT NULL DEFAULT 'each',
  
  -- Stock tracking
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  maximum_stock INTEGER,
  reorder_point INTEGER NOT NULL DEFAULT 0,
  
  -- Cost tracking
  unit_cost NUMERIC(10,2),
  last_purchase_price NUMERIC(10,2),
  average_cost NUMERIC(10,2),
  
  -- Supplier tracking
  preferred_supplier_id UUID REFERENCES public.suppliers(id),
  alternate_supplier_ids UUID[],
  
  -- Location
  location_id UUID REFERENCES public.locations(id),
  warehouse_location TEXT,
  
  -- Dates
  last_restock_date TIMESTAMP WITH TIME ZONE,
  last_used_date TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'out_of_stock', 'discontinued')),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 1: Create stock_transactions table
CREATE TABLE public.stock_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment', 'return')),
  
  -- Quantities
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(10,2),
  total_cost NUMERIC(10,2),
  
  -- Links
  employee_id UUID REFERENCES public.employees(id),
  project_id UUID REFERENCES public.projects(id),
  work_order_id UUID REFERENCES public.work_orders(id),
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  
  -- Source
  reference_number TEXT,
  
  -- Audit
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 1: Create tool_checkouts table
CREATE TABLE public.tool_checkouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id),
  project_id UUID REFERENCES public.projects(id),
  
  -- Dates
  checkout_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expected_return_date DATE,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  
  -- Condition
  condition_out TEXT,
  condition_in TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'checked_out' CHECK (status IN ('checked_out', 'returned', 'overdue', 'lost_damaged')),
  
  -- Notes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Phase 2: Add inventory_item_id to purchase_order_items
ALTER TABLE public.purchase_order_items 
ADD COLUMN inventory_item_id UUID REFERENCES public.inventory_items(id);

-- Create indexes for performance
CREATE INDEX idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX idx_inventory_items_preferred_supplier ON public.inventory_items(preferred_supplier_id);
CREATE INDEX idx_stock_transactions_item ON public.stock_transactions(inventory_item_id);
CREATE INDEX idx_stock_transactions_date ON public.stock_transactions(transaction_date);
CREATE INDEX idx_tool_checkouts_employee ON public.tool_checkouts(employee_id);
CREATE INDEX idx_tool_checkouts_status ON public.tool_checkouts(status);

-- Enable RLS on new tables
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_checkouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_items
CREATE POLICY "Staff can view all inventory items"
  ON public.inventory_items FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create inventory items"
  ON public.inventory_items FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can update inventory items"
  ON public.inventory_items FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can delete inventory items"
  ON public.inventory_items FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- RLS Policies for stock_transactions
CREATE POLICY "Staff can view stock transactions"
  ON public.stock_transactions FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create stock transactions"
  ON public.stock_transactions FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update stock transactions"
  ON public.stock_transactions FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Admins can delete stock transactions"
  ON public.stock_transactions FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- RLS Policies for tool_checkouts
CREATE POLICY "Staff can view tool checkouts"
  ON public.tool_checkouts FOR SELECT
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create tool checkouts"
  ON public.tool_checkouts FOR INSERT
  WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update tool checkouts"
  ON public.tool_checkouts FOR UPDATE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can delete tool checkouts"
  ON public.tool_checkouts FOR DELETE
  USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Phase 2: Create function to auto-update inventory when PO is received
CREATE OR REPLACE FUNCTION public.update_inventory_on_po_receipt()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'received'
  IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
    -- Insert stock transactions for all items in this PO
    INSERT INTO public.stock_transactions (
      inventory_item_id,
      transaction_type,
      quantity,
      unit_cost,
      total_cost,
      purchase_order_id,
      supplier_id,
      reference_number,
      transaction_date,
      notes
    )
    SELECT 
      poi.inventory_item_id,
      'in'::TEXT,
      poi.quantity,
      poi.unit_price,
      poi.quantity * poi.unit_price,
      NEW.id,
      NEW.supplier_id,
      NEW.po_number,
      now(),
      'Auto-created from PO receipt: ' || NEW.po_number
    FROM public.purchase_order_items poi
    WHERE poi.purchase_order_id = NEW.id
      AND poi.inventory_item_id IS NOT NULL;
    
    -- Update inventory stock levels and costs
    UPDATE public.inventory_items i
    SET 
      current_stock = i.current_stock + poi.quantity,
      last_purchase_price = poi.unit_price,
      last_restock_date = now(),
      average_cost = CASE 
        WHEN i.current_stock = 0 THEN poi.unit_price
        ELSE ((i.current_stock * COALESCE(i.average_cost, 0)) + (poi.quantity * poi.unit_price)) / (i.current_stock + poi.quantity)
      END,
      status = CASE
        WHEN (i.current_stock + poi.quantity) > i.reorder_point THEN 'available'
        WHEN (i.current_stock + poi.quantity) > 0 THEN 'low_stock'
        ELSE 'out_of_stock'
      END,
      updated_at = now()
    FROM public.purchase_order_items poi
    WHERE poi.purchase_order_id = NEW.id
      AND poi.inventory_item_id = i.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on purchase_orders table
CREATE TRIGGER trigger_update_inventory_on_po_receipt
  AFTER INSERT OR UPDATE OF status ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_po_receipt();

-- Add trigger for updated_at on new tables
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tool_checkouts_updated_at
  BEFORE UPDATE ON public.tool_checkouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();