import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Expense } from '@/hooks/useClientBilling';

const CATEGORIES = ['Materials', 'Labor', 'Equipment', 'Travel', 'Permits', 'Subcontractor', 'Other'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Expense, 'id' | 'client_id' | 'created_at'>) => Promise<void>;
  existingExpense?: Expense | null;
}

export const ClientExpenseForm = ({ isOpen, onClose, onSave, existingExpense }: Props) => {
  const [form, setForm] = useState({
    category: 'Materials',
    amount: 0,
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    vendor: '',
    receipt_url: '',
    status: 'pending',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingExpense) {
      setForm({
        category: existingExpense.category,
        amount: Number(existingExpense.amount),
        description: existingExpense.description || '',
        expense_date: existingExpense.expense_date,
        vendor: existingExpense.vendor || '',
        receipt_url: existingExpense.receipt_url || '',
        status: existingExpense.status,
      });
    } else {
      setForm({ category: 'Materials', amount: 0, description: '', expense_date: new Date().toISOString().split('T')[0], vendor: '', receipt_url: '', status: 'pending' });
    }
  }, [existingExpense, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form as any);
    setSaving(false);
    onClose();
  };

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existingExpense ? 'Edit Expense' : 'Log Expense'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => update('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Amount ($)</Label>
              <Input type="number" step="0.01" value={form.amount} onChange={e => update('amount', parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={form.expense_date} onChange={e => update('expense_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Vendor</Label>
              <Input value={form.vendor} onChange={e => update('vendor', e.target.value)} placeholder="Vendor name" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : existingExpense ? 'Update' : 'Log Expense'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
