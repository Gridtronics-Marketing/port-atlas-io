import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BillingSettings {
  id: string;
  client_id: string;
  business_name: string | null;
  business_email: string | null;
  business_phone: string | null;
  business_address: string | null;
  logo_url: string | null;
  default_payment_terms: number;
  default_tax_rate: number;
  currency: string;
  invoice_prefix: string;
  quote_prefix: string;
  invoice_notes: string | null;
  quote_notes: string | null;
  quickbooks_customer_id: string | null;
}

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  status: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_paid: number;
  notes: string | null;
  created_at: string;
  line_items?: LineItem[];
}

export interface Quote {
  id: string;
  client_id: string;
  quote_number: string;
  status: string;
  issue_date: string;
  valid_until: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  line_items?: LineItem[];
}

export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
}

export interface Expense {
  id: string;
  client_id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  vendor: string | null;
  receipt_url: string | null;
  status: string;
  created_at: string;
}

export function useClientBilling(clientId: string | undefined) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [settingsRes, invoicesRes, quotesRes, expensesRes] = await Promise.all([
        supabase.from('client_billing_settings').select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('client_invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('client_quotes').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('client_expenses').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      ]);
      setSettings(settingsRes.data as BillingSettings | null);
      setInvoices((invoicesRes.data || []) as Invoice[]);
      setQuotes((quotesRes.data || []) as Quote[]);
      setExpenses((expensesRes.data || []) as Expense[]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const upsertSettings = async (data: Partial<BillingSettings>) => {
    if (!clientId) return;
    const payload = { ...data, client_id: clientId };
    const { error } = settings
      ? await supabase.from('client_billing_settings').update(payload).eq('id', settings.id)
      : await supabase.from('client_billing_settings').insert(payload as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Billing settings updated' });
      fetchAll();
    }
  };

  const generateNumber = (prefix: string, existing: { invoice_number?: string; quote_number?: string }[]) => {
    const nums = existing.map(e => {
      const num = (e.invoice_number || e.quote_number || '').replace(/\D/g, '');
      return parseInt(num) || 0;
    });
    const next = Math.max(0, ...nums) + 1;
    return `${prefix}-${String(next).padStart(4, '0')}`;
  };

  const createInvoice = async (data: Partial<Invoice> & { line_items: LineItem[] }) => {
    if (!clientId) return;
    const prefix = settings?.invoice_prefix || 'INV';
    const invoiceNumber = generateNumber(prefix, invoices);
    const { line_items, ...invoiceData } = data;
    const { data: created, error } = await supabase.from('client_invoices').insert({
      client_id: clientId,
      invoice_number: invoiceNumber,
      ...invoiceData,
    } as any).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    if (line_items.length > 0 && created) {
      await supabase.from('billing_line_items').insert(
        line_items.map((li, i) => ({ invoice_id: created.id, description: li.description, quantity: li.quantity, unit_price: li.unit_price, total: li.total, sort_order: i }))
      );
    }
    toast({ title: 'Created', description: `Invoice ${invoiceNumber} created` });
    fetchAll();
  };

  const updateInvoice = async (id: string, data: Partial<Invoice> & { line_items?: LineItem[] }) => {
    const { line_items, ...invoiceData } = data;
    await supabase.from('client_invoices').update(invoiceData as any).eq('id', id);
    if (line_items) {
      await supabase.from('billing_line_items').delete().eq('invoice_id', id);
      if (line_items.length > 0) {
        await supabase.from('billing_line_items').insert(
          line_items.map((li, i) => ({ invoice_id: id, description: li.description, quantity: li.quantity, unit_price: li.unit_price, total: li.total, sort_order: i }))
        );
      }
    }
    toast({ title: 'Updated', description: 'Invoice updated' });
    fetchAll();
  };

  const deleteInvoice = async (id: string) => {
    await supabase.from('client_invoices').delete().eq('id', id);
    toast({ title: 'Deleted', description: 'Invoice deleted' });
    fetchAll();
  };

  const createQuote = async (data: Partial<Quote> & { line_items: LineItem[] }) => {
    if (!clientId) return;
    const prefix = settings?.quote_prefix || 'QTE';
    const quoteNumber = generateNumber(prefix, quotes);
    const { line_items, ...quoteData } = data;
    const { data: created, error } = await supabase.from('client_quotes').insert({
      client_id: clientId,
      quote_number: quoteNumber,
      ...quoteData,
    } as any).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    if (line_items.length > 0 && created) {
      await supabase.from('billing_line_items').insert(
        line_items.map((li, i) => ({ quote_id: created.id, description: li.description, quantity: li.quantity, unit_price: li.unit_price, total: li.total, sort_order: i }))
      );
    }
    toast({ title: 'Created', description: `Quote ${quoteNumber} created` });
    fetchAll();
  };

  const updateQuote = async (id: string, data: Partial<Quote> & { line_items?: LineItem[] }) => {
    const { line_items, ...quoteData } = data;
    await supabase.from('client_quotes').update(quoteData as any).eq('id', id);
    if (line_items) {
      await supabase.from('billing_line_items').delete().eq('quote_id', id);
      if (line_items.length > 0) {
        await supabase.from('billing_line_items').insert(
          line_items.map((li, i) => ({ quote_id: id, description: li.description, quantity: li.quantity, unit_price: li.unit_price, total: li.total, sort_order: i }))
        );
      }
    }
    toast({ title: 'Updated', description: 'Quote updated' });
    fetchAll();
  };

  const deleteQuote = async (id: string) => {
    await supabase.from('client_quotes').delete().eq('id', id);
    toast({ title: 'Deleted', description: 'Quote deleted' });
    fetchAll();
  };

  const convertQuoteToInvoice = async (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    const { data: lineItems } = await supabase.from('billing_line_items').select('*').eq('quote_id', quoteId);
    await createInvoice({
      subtotal: quote.subtotal,
      tax_amount: quote.tax_amount,
      total: quote.total,
      notes: quote.notes,
      due_date: null,
      line_items: (lineItems || []).map(li => ({
        description: li.description,
        quantity: Number(li.quantity),
        unit_price: Number(li.unit_price),
        total: Number(li.total),
        sort_order: li.sort_order || 0,
      })),
    });
    await supabase.from('client_quotes').update({ status: 'accepted' } as any).eq('id', quoteId);
    fetchAll();
  };

  const createExpense = async (data: Omit<Expense, 'id' | 'client_id' | 'created_at'>) => {
    if (!clientId) return;
    const { error } = await supabase.from('client_expenses').insert({ ...data, client_id: clientId } as any);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Created', description: 'Expense logged' });
    fetchAll();
  };

  const updateExpense = async (id: string, data: Partial<Expense>) => {
    await supabase.from('client_expenses').update(data as any).eq('id', id);
    toast({ title: 'Updated', description: 'Expense updated' });
    fetchAll();
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('client_expenses').delete().eq('id', id);
    toast({ title: 'Deleted', description: 'Expense deleted' });
    fetchAll();
  };

  const fetchLineItems = async (invoiceId?: string, quoteId?: string): Promise<LineItem[]> => {
    let query = supabase.from('billing_line_items').select('*').order('sort_order');
    if (invoiceId) query = query.eq('invoice_id', invoiceId);
    if (quoteId) query = query.eq('quote_id', quoteId);
    const { data } = await query;
    return (data || []).map(li => ({
      id: li.id,
      description: li.description,
      quantity: Number(li.quantity),
      unit_price: Number(li.unit_price),
      total: Number(li.total),
      sort_order: li.sort_order || 0,
    }));
  };

  const stats = {
    totalInvoices: invoices.length,
    totalQuotes: quotes.length,
    totalExpenses: expenses.length,
    outstanding: invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((s, i) => s + Number(i.total) - Number(i.amount_paid), 0),
    overdueCount: invoices.filter(i => i.status === 'overdue').length,
    paidTotal: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0),
    expenseTotal: expenses.reduce((s, e) => s + Number(e.amount), 0),
  };

  return {
    settings, invoices, quotes, expenses, loading, stats,
    upsertSettings, fetchAll, fetchLineItems,
    createInvoice, updateInvoice, deleteInvoice,
    createQuote, updateQuote, deleteQuote, convertQuoteToInvoice,
    createExpense, updateExpense, deleteExpense,
  };
}
