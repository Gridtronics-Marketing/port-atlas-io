import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Building2, Shield, Edit, Eye } from 'lucide-react';
import { useLocationAccessGrants } from '@/hooks/useLocationAccessGrants';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/hooks/useLocations';

interface LocationAccessGrantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location;
}

interface Organization {
  id: string;
  name: string;
}

const accessLevelConfig = {
  view: { label: 'View Only', icon: Eye, color: 'bg-blue-500/10 text-blue-600' },
  edit: { label: 'Edit', icon: Edit, color: 'bg-amber-500/10 text-amber-600' },
  full: { label: 'Full Access', icon: Shield, color: 'bg-green-500/10 text-green-600' },
};

export const LocationAccessGrantsModal = ({
  open,
  onOpenChange,
  location,
}: LocationAccessGrantsModalProps) => {
  const { grants, loading, addGrant, revokeGrant, updateGrant } = useLocationAccessGrants(location.id);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit' | 'full'>('edit');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('id, name')
        .neq('id', location.organization_id || '')
        .order('name');
      
      setOrganizations(data || []);
    };

    if (open) {
      fetchOrganizations();
    }
  }, [open, location.organization_id]);

  const handleAddGrant = async () => {
    if (!selectedOrgId) return;

    setIsAdding(true);
    try {
      await addGrant(selectedOrgId, accessLevel, notes || undefined);
      setSelectedOrgId('');
      setNotes('');
      setAccessLevel('edit');
    } finally {
      setIsAdding(false);
    }
  };

  const availableOrgs = organizations.filter(
    org => !grants.some(g => g.granted_organization_id === org.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Location Access
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">{location.name}</p>
            <p className="text-xs text-muted-foreground">{location.address}</p>
          </div>

          {/* Current Grants */}
          <div className="space-y-2">
            <Label>Organizations with Access</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : grants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No organizations have been granted access yet.</p>
            ) : (
              <div className="space-y-2">
                {grants.map((grant) => {
                  const config = accessLevelConfig[grant.access_level];
                  const Icon = config.icon;
                  return (
                    <div
                      key={grant.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {grant.organization?.name || 'Unknown Organization'}
                          </p>
                          {grant.notes && (
                            <p className="text-xs text-muted-foreground">{grant.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={grant.access_level}
                          onValueChange={(value: 'view' | 'edit' | 'full') => 
                            updateGrant(grant.id, { access_level: value })
                          }
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(accessLevelConfig).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <cfg.icon className="h-3 w-3" />
                                  {cfg.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => revokeGrant(grant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add New Grant */}
          {availableOrgs.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <Label>Grant Access to Organization</Label>
              <div className="flex gap-2">
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select organization..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrgs.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={accessLevel} 
                  onValueChange={(v: 'view' | 'edit' | 'full') => setAccessLevel(v)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(accessLevelConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                onClick={handleAddGrant}
                disabled={!selectedOrgId || isAdding}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Grant Access
              </Button>
            </div>
          )}

          {availableOrgs.length === 0 && organizations.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              All organizations already have access to this location.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
