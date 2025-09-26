-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  website TEXT,
  supplier_code TEXT UNIQUE,
  payment_terms TEXT DEFAULT '30 days',
  tax_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_catalogs table for supplier items/pricing
CREATE TABLE public.supplier_catalogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_code TEXT,
  description TEXT,
  category TEXT,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  minimum_order_quantity INTEGER DEFAULT 1,
  lead_time_days INTEGER DEFAULT 0,
  availability_status TEXT DEFAULT 'in_stock' CHECK (availability_status IN ('in_stock', 'out_of_stock', 'limited', 'discontinued')),
  last_price_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  location_id UUID REFERENCES public.locations(id),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled')),
  order_date DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  subtotal NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  shipping_address TEXT,
  billing_address TEXT,
  terms_and_conditions TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  supplier_catalog_id UUID REFERENCES public.supplier_catalogs(id),
  item_name TEXT NOT NULL,
  item_code TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  received_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_price_history table for price tracking
CREATE TABLE public.supplier_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_catalog_id UUID REFERENCES public.supplier_catalogs(id) ON DELETE CASCADE,
  old_price NUMERIC(10,2) NOT NULL,
  new_price NUMERIC(10,2) NOT NULL,
  price_change_percentage NUMERIC(5,2),
  change_reason TEXT,
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create procurement_approvals table for approval workflows
CREATE TABLE public.procurement_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES auth.users(id),
  approval_level INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create openphone_call_logs table for call recording integration
CREATE TABLE public.openphone_call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  openphone_call_id TEXT UNIQUE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  phone_number TEXT NOT NULL,
  contact_id UUID, -- Can link to employees or clients
  contact_type TEXT CHECK (contact_type IN ('employee', 'client', 'supplier', 'unknown')),
  duration_seconds INTEGER DEFAULT 0,
  recording_url TEXT,
  transcription TEXT,
  call_status TEXT DEFAULT 'completed' CHECK (call_status IN ('completed', 'missed', 'voicemail', 'busy')),
  disposition TEXT, -- Follow-up action taken
  notes TEXT,
  work_order_created UUID REFERENCES public.work_orders(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create procurement_settings table for system configuration
CREATE TABLE public.procurement_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openphone_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Staff can view suppliers" ON public.suppliers 
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create suppliers" ON public.suppliers 
FOR INSERT WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can update suppliers" ON public.suppliers 
FOR UPDATE USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Admins can delete suppliers" ON public.suppliers 
FOR DELETE USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- RLS Policies for supplier_catalogs
CREATE POLICY "Staff can view supplier catalogs" ON public.supplier_catalogs 
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create supplier catalog items" ON public.supplier_catalogs 
FOR INSERT WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can update supplier catalog items" ON public.supplier_catalogs 
FOR UPDATE USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Admins can delete supplier catalog items" ON public.supplier_catalogs 
FOR DELETE USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- RLS Policies for purchase_orders
CREATE POLICY "Staff can view purchase orders" ON public.purchase_orders 
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create purchase orders" ON public.purchase_orders 
FOR INSERT WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update purchase orders" ON public.purchase_orders 
FOR UPDATE USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can delete purchase orders" ON public.purchase_orders 
FOR DELETE USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- RLS Policies for purchase_order_items
CREATE POLICY "Staff can view purchase order items" ON public.purchase_order_items 
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create purchase order items" ON public.purchase_order_items 
FOR INSERT WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update purchase order items" ON public.purchase_order_items 
FOR UPDATE USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can delete purchase order items" ON public.purchase_order_items 
FOR DELETE USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- RLS Policies for other tables (similar pattern)
CREATE POLICY "Staff can view price history" ON public.supplier_price_history 
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create price history" ON public.supplier_price_history 
FOR INSERT WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can view approvals" ON public.procurement_approvals 
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can manage approvals" ON public.procurement_approvals 
FOR ALL USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role]));

CREATE POLICY "Staff can view call logs" ON public.openphone_call_logs 
FOR SELECT USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can create call logs" ON public.openphone_call_logs 
FOR INSERT WITH CHECK (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Staff can update call logs" ON public.openphone_call_logs 
FOR UPDATE USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role, 'project_manager'::app_role, 'technician'::app_role]));

CREATE POLICY "Admins can manage procurement settings" ON public.procurement_settings 
FOR ALL USING (has_any_role(ARRAY['admin'::app_role, 'hr_manager'::app_role]));

-- Create indexes for better performance
CREATE INDEX idx_suppliers_status ON public.suppliers(status);
CREATE INDEX idx_supplier_catalogs_supplier_id ON public.supplier_catalogs(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX idx_openphone_call_logs_phone_number ON public.openphone_call_logs(phone_number);
CREATE INDEX idx_openphone_call_logs_contact ON public.openphone_call_logs(contact_id, contact_type);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_catalogs_updated_at
BEFORE UPDATE ON public.supplier_catalogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_order_items_updated_at
BEFORE UPDATE ON public.purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procurement_approvals_updated_at
BEFORE UPDATE ON public.procurement_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_openphone_call_logs_updated_at
BEFORE UPDATE ON public.openphone_call_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_procurement_settings_updated_at
BEFORE UPDATE ON public.procurement_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate PO numbers
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  po_number TEXT;
BEGIN
  -- Get the next PO number from settings or start at 1000
  SELECT COALESCE((setting_value->>'next_po_number')::INTEGER, 1000) INTO next_number
  FROM public.procurement_settings 
  WHERE setting_key = 'po_numbering';
  
  -- If no setting exists, create it
  IF NOT FOUND THEN
    INSERT INTO public.procurement_settings (setting_key, setting_value, description)
    VALUES ('po_numbering', '{"next_po_number": 1001}', 'Purchase Order numbering configuration');
    next_number := 1000;
  END IF;
  
  -- Generate PO number with format PO-YYYY-NNNN
  po_number := 'PO-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(next_number::TEXT, 4, '0');
  
  -- Update the next number
  UPDATE public.procurement_settings 
  SET setting_value = jsonb_set(setting_value, '{next_po_number}', (next_number + 1)::TEXT::jsonb)
  WHERE setting_key = 'po_numbering';
  
  RETURN po_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;