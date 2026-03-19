import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Key, ExternalLink, Eye, EyeOff, CheckCircle2, Trash2, Plus, Copy, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationData } from '@/hooks/useOrganizationData';
import { useSystemConfigurations } from '@/hooks/useSystemConfigurations';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ApiKeyRow {
  id: string;
  key_prefix: string;
  name: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const ALL_SCOPES = [
  { value: 'locations:read', label: 'Locations (read)' },
  { value: 'locations:write', label: 'Locations (write)' },
  { value: 'drop-points:read', label: 'Drop Points (read)' },
  { value: 'work-orders:write', label: 'Work Orders (write)' },
  { value: 'employees:read', label: 'Employees (read)' },
];

async function hashKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `ta_live_${raw}`;
}

export const APIKeysManager = () => {
  const { toast } = useToast();
  const { organizationId } = useOrganizationData();
  const { configurations, loading: configLoading, addConfiguration, updateConfiguration } = useSystemConfigurations('external_apis');

  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Google Maps key state
  const [showGoogleKey, setShowGoogleKey] = useState(false);
  const [googleMapsKey, setGoogleMapsKey] = useState('');

  useEffect(() => {
    const found = configurations.find(c => c.key === 'google_maps_api_key');
    if (found) setGoogleMapsKey(found.value || '');
  }, [configurations]);

  const fetchKeys = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    const { data } = await supabase
      .from('api_keys')
      .select('id, key_prefix, name, scopes, is_active, last_used_at, expires_at, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    setApiKeys((data as ApiKeyRow[]) || []);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim() || !organizationId) return;
    setCreating(true);
    const rawKey = generateApiKey();
    const keyHash = await hashKey(rawKey);

    const { error } = await supabase.from('api_keys').insert({
      organization_id: organizationId,
      key_hash: keyHash,
      key_prefix: rawKey.slice(0, 12),
      name: newKeyName.trim(),
      scopes: newKeyScopes,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setRevealedKey(rawKey);
      toast({ title: 'API Key Created', description: 'Copy it now — it won\'t be shown again.' });
      fetchKeys();
    }
    setCreating(false);
  };

  const handleRevoke = async (id: string) => {
    await supabase.from('api_keys').update({ is_active: false }).eq('id', id);
    toast({ title: 'Key Revoked' });
    fetchKeys();
  };

  const handleSaveGoogleKey = async () => {
    if (!googleMapsKey.trim()) {
      toast({ title: 'Validation Error', description: 'API key cannot be empty', variant: 'destructive' });
      return;
    }
    const existing = configurations.find(c => c.key === 'google_maps_api_key');
    try {
      if (existing) {
        await updateConfiguration(existing.id, { value: googleMapsKey, is_active: true });
      } else {
        await addConfiguration({ category: 'external_apis', key: 'google_maps_api_key', value: googleMapsKey, data_type: 'string', description: 'Google Maps Platform API Key for location services', is_active: true });
      }
      toast({ title: 'Success', description: 'Google Maps API Key saved' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Maps Key */}
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          Configure your Google Maps Platform API key and manage Trade Atlas REST API keys below.
          <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-primary hover:underline">
            Get Google Key <ExternalLink className="h-3 w-3" />
          </a>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />Google Maps Platform API Key</CardTitle>
          <CardDescription>Single unified key for Maps, Places, Geocoding, and Directions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showGoogleKey ? 'text' : 'password'}
                value={googleMapsKey}
                onChange={(e) => setGoogleMapsKey(e.target.value)}
                placeholder="AIza..."
                className="pr-10"
              />
              <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowGoogleKey(!showGoogleKey)}>
                {showGoogleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleSaveGoogleKey}>Save</Button>
          </div>
          {configurations.find(c => c.key === 'google_maps_api_key' && c.is_active) && (
            <div className="flex items-center gap-2 text-sm text-green-600"><CheckCircle2 className="h-4 w-4" /><span>Configured and active</span></div>
          )}
        </CardContent>
      </Card>

      {/* REST API Keys */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />REST API Keys</CardTitle>
            <CardDescription>Manage API keys for external integrations with the Trade Atlas REST API</CardDescription>
          </div>
          <Button size="sm" onClick={() => { setShowCreate(true); setNewKeyName(''); setNewKeyScopes([]); setRevealedKey(null); }}>
            <Plus className="h-4 w-4 mr-1" />New Key
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Loading…</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No API keys yet. Create one to get started.</p>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((k) => (
                <div key={k.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{k.name}</span>
                      <Badge variant={k.is_active ? 'default' : 'secondary'}>{k.is_active ? 'Active' : 'Revoked'}</Badge>
                    </div>
                    <code className="text-xs text-muted-foreground">{k.key_prefix}••••••••</code>
                    <div className="flex gap-2 flex-wrap">
                      {k.scopes.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                      {k.scopes.length === 0 && <Badge variant="outline" className="text-xs">all scopes</Badge>}
                    </div>
                    {k.last_used_at && <p className="text-xs text-muted-foreground">Last used: {new Date(k.last_used_at).toLocaleDateString()}</p>}
                  </div>
                  {k.is_active && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRevoke(k.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>Generate a new key for the Trade Atlas REST API.</DialogDescription>
          </DialogHeader>

          {revealedKey ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Copy this key now. It will not be shown again.</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Input readOnly value={revealedKey} className="font-mono text-xs" />
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(revealedKey); toast({ title: 'Copied!' }); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => { setShowCreate(false); setRevealedKey(null); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="e.g. Production Integration" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Scopes (leave empty for full access)</Label>
                <div className="space-y-2">
                  {ALL_SCOPES.map((s) => (
                    <div key={s.value} className="flex items-center gap-2">
                      <Checkbox
                        id={s.value}
                        checked={newKeyScopes.includes(s.value)}
                        onCheckedChange={(checked) => {
                          setNewKeyScopes(prev => checked ? [...prev, s.value] : prev.filter(x => x !== s.value));
                        }}
                      />
                      <label htmlFor={s.value} className="text-sm">{s.label}</label>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating || !newKeyName.trim()}>
                  {creating ? 'Creating…' : 'Create Key'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Setup Instructions */}
      <div className="rounded-lg border border-border bg-muted/50 p-4">
        <h4 className="text-sm font-medium mb-2">REST API Quick Start</h4>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Create an API key above</li>
          <li>Use it in the <code className="text-primary">Authorization: Bearer YOUR_KEY</code> header</li>
          <li>Call endpoints at <code className="text-primary">https://mhrekppksiekhstnteyu.supabase.co/functions/v1/api-v1/locations</code></li>
          <li>See the <a href="/api" className="text-primary hover:underline">API Documentation</a> for all available endpoints</li>
        </ol>
      </div>
    </div>
  );
};
