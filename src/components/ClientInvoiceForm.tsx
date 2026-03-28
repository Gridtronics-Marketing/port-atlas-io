import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { Invoice, LineItem } from '@/hooks/useClientBilling';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Invoice> & { line_items: LineItem[] }) => Promise<void>;
  existingInvoice?: Invoice | null;
  existingLineItems?: LineItem[];
  defaultTaxRate?: number;
  defaultNotes?: string;
  defaultPaymentTerms?: number;
}

export const ClientInvoiceForm = ({ isOpen, onClose, onSave, existingInvoice, existingLineItems, defaultTaxRate = 0, defaultNotes = '', defaultPaymentTerms = 30 }: Props) => {
  const [status, setStatus] = useState('draft');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [taxRate, setTaxRate] = useState(defaultTaxRate);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0, total: 0, sort_order: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingInvoice) {
      setStatus(existingInvoice.status);
      setIssueDate(existingInvoice.issue_date);
      setDueDate(existingInvoice.due_date || '');
      setNotes(existingInvoice.notes || '');
      setTaxRate(existingInvoice.subtotal > 0 ? (Number(existingInvoice.tax_amount) / Number(existingInvoice.subtotal)) * 100 : defaultTaxRate);
    } else {
      setStatus('draft');
      setIssueDate(new Date().toISOString().split('T')[0]);
      const due = new Date();
      due.setDate(due.getDate() + defaultPaymentTerms);
      setDueDate(due.toISOString().split('T')[0]);
      setNotes(defaultNotes);
      setTaxRate(defaultTaxRate);
      setLineItems([{ description: '', quantity: 1, unit_price: 0, total: 0, sort_order: 0 }]);
    }
  }, [existingInvoice, isOpen]);

  useEffect(() => {
    if (existingLineItems && existingLineItems.length > 0) setLineItems(existingLineItems);
  }, [existingLineItems]);

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    setLineItems(items => items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = Number(updated.quantity) * Number(updated.unit_price);
      }
      return updated;
    }));
  };

  const subtotal = lineItems.reduce((s, li) => s + li.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      status,
      issue_date: issueDate,
      due_date: dueDate || null,
      subtotal,
      tax_amount: taxAmount,
      total,
      notes: notes || null,
      line_items: lineItems.filter(li => li.description.trim()),
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingInvoice ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['draft', 'sent', 'viewed', 'paid', 'overdue', 'void'].map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Issue Date</Label>
              <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tax Rate (%)</Label>
              <Input type="number" step="0.01" value={taxRate} onChange={e => setTaxRate(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Line Items</Label>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-2 p-2 bg-muted text-xs font-medium text-muted-foreground">
                <span>Description</span><span>Qty</span><span>Price</span><span>Total</span><span></span>
              </div>
              {lineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-2 p-2 border-t items-center">
                  <Input value={li.description} onChange={e => updateLineItem(i, 'description', e.target.value)} placeholder="Item description" className="h-8 text-sm" />
                  <Input type="number" value={li.quantity} onChange={e => updateLineItem(i, 'quantity', parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                  <Input type="number" step="0.01" value={li.unit_price} onChange={e => updateLineItem(i, 'unit_price', parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                  <span className="text-sm text-muted-foreground pl-1">${li.total.toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLineItems(items => items.filter((_, idx) => idx !== i))} disabled={lineItems.length <= 1}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, total: 0, sort_order: lineItems.length }])}>
              <Plus className="h-3 w-3 mr-1" /> Add Line
            </Button>
          </div>

          <div className="flex justify-end">
            <div className="text-right text-sm space-y-1">
              <p>Subtotal: <span className="font-medium">${subtotal.toFixed(2)}</span></p>
              <p>Tax ({taxRate}%): <span className="font-medium">${taxAmount.toFixed(2)}</span></p>
              <p className="text-base font-bold">Total: ${total.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : existingInvoice ? 'Update Invoice' : 'Create Invoice'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
