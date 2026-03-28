import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Upload, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { BillingSettings } from '@/hooks/useClientBilling';

interface Props {
  settings: BillingSettings | null;
  onSave: (data: Partial<BillingSettings>) => Promise<void>;
}

export const ClientBillingSettings = ({ settings, onSave }: Props) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    logo_url: '',
    default_payment_terms: 30,
    default_tax_rate: 0,
    currency: 'USD',
    invoice_prefix: 'INV',
    quote_prefix: 'QTE',
    invoice_notes: '',
    quote_notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        business_name: settings.business_name || '',
        business_email: settings.business_email || '',
        business_phone: settings.business_phone || '',
        business_address: settings.business_address || '',
        logo_url: settings.logo_url || '',
        default_payment_terms: settings.default_payment_terms || 30,
        default_tax_rate: settings.default_tax_rate || 0,
        currency: settings.currency || 'USD',
        invoice_prefix: settings.invoice_prefix || 'INV',
        quote_prefix: settings.quote_prefix || 'QTE',
        invoice_notes: settings.invoice_notes || '',
        quote_notes: settings.quote_notes || '',
      });
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `logos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('billing-assets').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } else {
      const { data: urlData } = supabase.storage.from('billing-assets').getPublicUrl(path);
      setForm(f => ({ ...f, logo_url: urlData.publicUrl }));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  return (
    <div className="space-y-6">
      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Business Name</Label>
              <Input value={form.business_name} onChange={e => update('business_name', e.target.value)} placeholder="Your Company Name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={form.business_email} onChange={e => update('business_email', e.target.value)} placeholder="billing@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={form.business_phone} onChange={e => update('business_phone', e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Currency</Label>
              <Select value={form.currency} onValueChange={v => update('currency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="CAD">CAD (C$)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Textarea value={form.business_address} onChange={e => update('business_address', e.target.value)} rows={2} placeholder="123 Main St, City, State" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Logo</Label>
            <div className="flex items-center gap-3">
              {form.logo_url && <img src={form.logo_url} alt="Logo" className="h-10 w-10 rounded object-contain border" />}
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span><Upload className="h-3 w-3 mr-1" />{uploading ? 'Uploading…' : 'Upload Logo'}</span>
                </Button>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Invoice & Quote Defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Payment Terms</Label>
              <Select value={String(form.default_payment_terms)} onValueChange={v => update('default_payment_terms', Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Net 15</SelectItem>
                  <SelectItem value="30">Net 30</SelectItem>
                  <SelectItem value="60">Net 60</SelectItem>
                  <SelectItem value="90">Net 90</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tax Rate (%)</Label>
              <Input type="number" step="0.01" value={form.default_tax_rate} onChange={e => update('default_tax_rate', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Invoice Prefix</Label>
              <Input value={form.invoice_prefix} onChange={e => update('invoice_prefix', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quote Prefix</Label>
              <Input value={form.quote_prefix} onChange={e => update('quote_prefix', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default Invoice Notes</Label>
            <Textarea value={form.invoice_notes} onChange={e => update('invoice_notes', e.target.value)} rows={2} placeholder="Thank you for your business!" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default Quote Notes</Label>
            <Textarea value={form.quote_notes} onChange={e => update('quote_notes', e.target.value)} rows={2} placeholder="Quote valid for 30 days" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border-dashed opacity-60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            QuickBooks Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">QuickBooks sync is coming soon. Connect your QuickBooks account to automatically sync invoices and expenses.</p>
          <Button variant="outline" size="sm" className="mt-3" disabled>
            Connect QuickBooks
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};
