

# Invoice / Quote / Expenses System (Client-Level)

## Summary
Build a full billing system tied to each client, with Invoices, Quotes, and Expenses tables, a per-client settings panel (business name, contact, logo, templates), and a tabbed UI inside Client Details. Designed for future QuickBooks sync.

## Database Schema

### `client_billing_settings`
Per-client billing configuration (company name, logo, payment terms, default templates).
```sql
CREATE TABLE public.client_billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
  business_name TEXT,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  logo_url TEXT,
  default_payment_terms INTEGER DEFAULT 30,
  default_tax_rate NUMERIC(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  invoice_prefix TEXT DEFAULT 'INV',
  quote_prefix TEXT DEFAULT 'QTE',
  invoice_notes TEXT,
  quote_notes TEXT,
  quickbooks_customer_id TEXT, -- future QB sync
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `client_invoices`
```sql
CREATE TABLE public.client_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft | sent | viewed | paid | overdue | void
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  quickbooks_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `client_quotes`
Same structure as invoices but with quote-specific statuses.
```sql
CREATE TABLE public.client_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  quote_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft | sent | accepted | declined | expired
  issue_date DATE DEFAULT CURRENT_DATE,
  valid_until DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `billing_line_items`
Shared line items for both invoices and quotes.
```sql
CREATE TABLE public.billing_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.client_invoices(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.client_quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT line_item_parent CHECK (
    (invoice_id IS NOT NULL AND quote_id IS NULL) OR
    (invoice_id IS NULL AND quote_id IS NOT NULL)
  )
);
```

### `client_expenses`
```sql
CREATE TABLE public.client_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  expense_date DATE DEFAULT CURRENT_DATE,
  vendor TEXT,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending', -- pending | approved | rejected
  created_by UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

All tables get RLS with authenticated access policies.

### Storage
Create a `billing-assets` bucket (public) for client logos and receipt uploads.

## New Files

### Hooks
- **`src/hooks/useClientBilling.ts`** — CRUD for invoices, quotes, expenses, billing settings, and line items. Auto-generates sequential invoice/quote numbers using prefixes from settings. Includes summary stats (total outstanding, overdue count, etc.).

### Components
- **`src/components/ClientBillingTab.tsx`** — Main tabbed container with sub-tabs: **Invoices**, **Quotes**, **Expenses**, **Settings**. Renders inside Client Details modal as a new section below Overview.
  
- **`src/components/ClientInvoiceForm.tsx`** — Create/edit invoice dialog with line items editor (add row, description, qty, price, auto-calc total), tax, notes, and status selector. "Convert to Invoice" button when viewing a quote.

- **`src/components/ClientQuoteForm.tsx`** — Similar to invoice form but with quote-specific fields (valid_until, quote statuses).

- **`src/components/ClientExpenseForm.tsx`** — Simple dialog for logging expenses (category, amount, vendor, date, receipt upload).

- **`src/components/ClientBillingSettings.tsx`** — Settings panel with: editable business name, email, phone, address, logo upload, default payment terms (Net 15/30/60/90), tax rate, invoice/quote number prefixes, default notes/templates, and a disabled "QuickBooks Sync" placeholder section.

## Modified Files

### `src/components/ClientDetailsModal.tsx`
- Add a **"Billing"** tab/section in the left column below Overview
- Wire up the `ClientBillingTab` component
- Update the Overview counters to show real quote/invoice counts from the billing hook

### `src/hooks/useClients.ts`
- No changes needed — billing is separate from client record

## UI Layout (inside Client Details)

```text
┌─────────────────────────────────────────────┐
│ Overview                                     │
│ [Active Work] [Requests] [Quotes] [Invoices]│ ← live counts
├─────────────────────────────────────────────┤
│ Billing                                      │
│ ┌──────────────────────────────────────────┐ │
│ │ [Invoices] [Quotes] [Expenses] [Settings]│ │
│ ├──────────────────────────────────────────┤ │
│ │  + New Invoice          Filter: All ▾    │ │
│ │ ┌────┬──────────┬────────┬───────┬─────┐ │ │
│ │ │ #  │ Date     │ Total  │Status │  ⋮  │ │ │
│ │ │INV-│ Mar 28   │$1,250  │ Draft │     │ │ │
│ │ └────┴──────────┴────────┴───────┴─────┘ │ │
│ └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## File Summary
- **New migration**: 6 tables + RLS + storage bucket
- **New hooks**: `useClientBilling.ts`
- **New components**: `ClientBillingTab.tsx`, `ClientInvoiceForm.tsx`, `ClientQuoteForm.tsx`, `ClientExpenseForm.tsx`, `ClientBillingSettings.tsx`
- **Modified**: `ClientDetailsModal.tsx`

