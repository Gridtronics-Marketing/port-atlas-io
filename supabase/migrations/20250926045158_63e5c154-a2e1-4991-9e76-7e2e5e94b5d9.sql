-- Add UPC and custom_fields columns to supplier_catalogs table
ALTER TABLE public.supplier_catalogs 
ADD COLUMN IF NOT EXISTS upc_code TEXT,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_supplier_catalogs_upc_code ON public.supplier_catalogs(upc_code);
CREATE INDEX IF NOT EXISTS idx_supplier_catalogs_custom_fields ON public.supplier_catalogs USING GIN(custom_fields);
CREATE INDEX IF NOT EXISTS idx_supplier_catalogs_item_name ON public.supplier_catalogs(item_name);
CREATE INDEX IF NOT EXISTS idx_supplier_catalogs_item_code ON public.supplier_catalogs(item_code);