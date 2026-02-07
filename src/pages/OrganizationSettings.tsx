import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Palette, Users, Loader2, Upload, Check, Wrench } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PendingInvitationsManager } from '@/components/PendingInvitationsManager';
import { OrganizationTradesManager } from '@/components/OrganizationTradesManager';

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

const OrganizationSettings = () => {
  const { currentOrganization, refreshOrganizations } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [branding, setBranding] = useState<BrandingSettings>({
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    logoUrl: null
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      setOrganizationName(currentOrganization.name);
      const settings = currentOrganization.settings as any;
      if (settings?.branding) {
        setBranding({
          primaryColor: settings.branding.primaryColor || '#3B82F6',
          secondaryColor: settings.branding.secondaryColor || '#1E40AF',
          logoUrl: settings.branding.logoUrl || null
        });
      }
    }
  }, [currentOrganization]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrganization) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentOrganization.id}-logo.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(filePath);

      setBranding(prev => ({ ...prev, logoUrl: publicUrl }));
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveGeneral = async () => {
    if (!currentOrganization) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: organizationName })
        .eq('id', currentOrganization.id);

      if (error) throw error;

      await refreshOrganizations();
      toast.success('Organization updated successfully');
    } catch (error: any) {
      console.error('Error saving organization:', error);
      toast.error('Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!currentOrganization) return;

    setSaving(true);
    try {
      const currentSettings = (currentOrganization.settings as any) || {};
      const newSettings = {
        ...currentSettings,
        branding: {
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          logoUrl: branding.logoUrl
        }
      };

      const { error } = await supabase
        .from('organizations')
        .update({ settings: newSettings })
        .eq('id', currentOrganization.id);

      if (error) throw error;

      await refreshOrganizations();
      toast.success('Branding settings saved successfully');
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No organization selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization's profile, branding, and invitations
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="trades" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Trades
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Invitations
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic information about your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>

              <div className="space-y-2">
                <Label>Organization Slug</Label>
                <Input
                  value={currentOrganization.slug}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  This is your organization's unique identifier and cannot be changed
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Customize how your portal looks for your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-4">
                <Label>Organization Logo</Label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                    {branding.logoUrl ? (
                      <img
                        src={branding.logoUrl}
                        alt="Organization logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      disabled={uploadingLogo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      {uploadingLogo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </>
                      )}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: Square image, at least 200x200px
                    </p>
                  </div>
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primaryColor"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={branding.primaryColor}
                      onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 rounded object-contain" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center"
                        style={{ backgroundColor: branding.primaryColor }}
                      >
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <span className="font-semibold">{organizationName}</span>
                  </div>
                  <div className="flex gap-3">
                    <Button style={{ backgroundColor: branding.primaryColor }}>
                      Primary Button
                    </Button>
                    <Button
                      variant="outline"
                      style={{ borderColor: branding.secondaryColor, color: branding.secondaryColor }}
                    >
                      Secondary Button
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBranding} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Branding
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trades Tab */}
        <TabsContent value="trades">
          <OrganizationTradesManager organizationId={currentOrganization.id} />
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <PendingInvitationsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationSettings;
