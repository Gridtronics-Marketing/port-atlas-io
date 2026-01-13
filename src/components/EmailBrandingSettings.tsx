import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Trash2, Image, Save, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EmailBranding {
  logo_url: string | null;
  company_name: string;
  primary_color: string;
}

const defaultBranding: EmailBranding = {
  logo_url: null,
  company_name: 'Trade Atlas',
  primary_color: '#1e3a5f'
};

export const EmailBrandingSettings = () => {
  const { isSuperAdmin } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [branding, setBranding] = useState<EmailBranding>(defaultBranding);

  const fetchBranding = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'email_branding')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.setting_value) {
        const value = data.setting_value as unknown as EmailBranding;
        setBranding({
          logo_url: value.logo_url ?? null,
          company_name: value.company_name ?? 'Trade Atlas',
          primary_color: value.primary_color ?? '#1e3a5f'
        });
      }
    } catch (err: any) {
      console.error('Error fetching branding:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchBranding();
    }
  }, [isSuperAdmin]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `email-logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (branding.logo_url) {
        const oldPath = branding.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('email-assets').remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('email-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('email-assets')
        .getPublicUrl(fileName);

      setBranding(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success('Logo uploaded successfully');
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!branding.logo_url) return;

    try {
      const oldPath = branding.logo_url.split('/').pop();
      if (oldPath) {
        await supabase.storage.from('email-assets').remove([oldPath]);
      }
      setBranding(prev => ({ ...prev, logo_url: null }));
      toast.success('Logo removed');
    } catch (err: any) {
      console.error('Error removing logo:', err);
      toast.error('Failed to remove logo');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          setting_key: 'email_branding',
          setting_value: branding as any,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast.success('Email branding settings saved');
    } catch (err: any) {
      console.error('Error saving branding:', err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Branding
        </CardTitle>
        <CardDescription>
          Customize the appearance of invitation and notification emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-3">
          <Label>Email Logo</Label>
          <div className="flex items-start gap-4">
            <div className="w-48 h-24 border rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
              {branding.logo_url ? (
                <img 
                  src={branding.logo_url} 
                  alt="Email Logo" 
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Image className="h-8 w-8 mx-auto mb-1" />
                  <span className="text-xs">No logo uploaded</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => document.getElementById('logo-upload')?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </>
                  )}
                </Button>
                {branding.logo_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: PNG or SVG, max 2MB, min 120px height
              </p>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="company-name">Company Name</Label>
          <Input
            id="company-name"
            value={branding.company_name}
            onChange={(e) => setBranding(prev => ({ ...prev, company_name: e.target.value }))}
            placeholder="Your Company Name"
          />
          <p className="text-xs text-muted-foreground">
            Displayed in email header when no logo is set
          </p>
        </div>

        {/* Primary Color */}
        <div className="space-y-2">
          <Label htmlFor="primary-color">Primary Color</Label>
          <div className="flex gap-3 items-center">
            <Input
              type="color"
              id="primary-color"
              value={branding.primary_color}
              onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              value={branding.primary_color}
              onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
              placeholder="#1e3a5f"
              className="w-32"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used for email header background and accents
          </p>
        </div>

        {/* Email Preview Note */}
        <div className="bg-muted/50 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Preview Note</p>
            <p>
              Changes will apply to all future invitation emails. To see the full email 
              design, send a test invitation to yourself.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
