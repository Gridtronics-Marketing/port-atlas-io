import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Network, Globe, Shield, Edit, Trash2 } from 'lucide-react';
import { useVlans, VLAN } from '@/hooks/useVlans';

interface VLANsTabProps {
  locationId: string;
}

export const VLANsTab: React.FC<VLANsTabProps> = ({ locationId }) => {
  const { vlans, loading, addVlan, updateVlan, deleteVlan } = useVlans(locationId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVlan, setEditingVlan] = useState<VLAN | null>(null);
  const [formData, setFormData] = useState<Partial<VLAN>>({
    vlan_id: 1,
    vlan_name: '',
    description: '',
    subnet: '',
    security_zone: '',
    is_active: true
  });

  const getSecurityZoneColor = (zone?: string) => {
    switch (zone?.toLowerCase()) {
      case 'dmz': return 'bg-orange-500';
      case 'guest': return 'bg-blue-500';
      case 'management': return 'bg-purple-500';
      case 'production': return 'bg-green-500';
      case 'development': return 'bg-yellow-500';
      case 'restricted': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVlan) {
        await updateVlan(editingVlan.id, formData);
      } else {
        await addVlan({ ...formData, location_id: locationId } as any);
      }
      setShowAddModal(false);
      setEditingVlan(null);
      setFormData({
        vlan_id: Math.max(...vlans.map(v => v.vlan_id), 0) + 1,
        vlan_name: '',
        description: '',
        subnet: '',
        security_zone: '',
        is_active: true
      });
    } catch (error) {
      console.error('Error saving VLAN:', error);
    }
  };

  const handleEdit = (vlan: VLAN) => {
    setEditingVlan(vlan);
    setFormData(vlan);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this VLAN?')) {
      await deleteVlan(id);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading VLANs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">VLAN Management</h3>
          <p className="text-sm text-muted-foreground">
            Configure virtual LANs and network segmentation
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add VLAN
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{vlans.length}</div>
            <div className="text-sm text-muted-foreground">Total VLANs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {vlans.filter(v => v.security_zone).length}
            </div>
            <div className="text-sm text-muted-foreground">Security Zones</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {vlans.filter(v => v.subnet).length}
            </div>
            <div className="text-sm text-muted-foreground">With Subnets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {new Set(vlans.map(v => v.security_zone).filter(Boolean)).size}
            </div>
            <div className="text-sm text-muted-foreground">Unique Zones</div>
          </CardContent>
        </Card>
      </div>

      {/* VLANs List */}
      <div className="space-y-3">
        {vlans.map(vlan => (
          <Card key={vlan.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    <div className="font-mono text-lg font-bold">
                      {vlan.vlan_id}
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-medium">{vlan.vlan_name}</div>
                    {vlan.description && (
                      <div className="text-sm text-muted-foreground">
                        {vlan.description}
                      </div>
                    )}
                    {vlan.subnet && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {vlan.subnet}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {vlan.security_zone && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <Badge className={getSecurityZoneColor(vlan.security_zone)}>
                        {vlan.security_zone}
                      </Badge>
                    </div>
                  )}
                  
                  <Badge variant={vlan.is_active ? 'default' : 'secondary'}>
                    {vlan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(vlan)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(vlan.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {vlans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No VLANs configured. Add VLANs to manage network segmentation.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVlan ? 'Edit VLAN' : 'Add New VLAN'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vlan_id">VLAN ID *</Label>
                <Input
                  id="vlan_id"
                  type="number"
                  min="1"
                  max="4094"
                  value={formData.vlan_id || 1}
                  onChange={(e) => setFormData({ ...formData, vlan_id: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vlan_name">VLAN Name *</Label>
                <Input
                  id="vlan_name"
                  value={formData.vlan_name || ''}
                  onChange={(e) => setFormData({ ...formData, vlan_name: e.target.value })}
                  placeholder="Production Network"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description of this VLAN's purpose..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subnet">Subnet (CIDR)</Label>
                <Input
                  id="subnet"
                  value={formData.subnet || ''}
                  onChange={(e) => setFormData({ ...formData, subnet: e.target.value })}
                  placeholder="192.168.10.0/24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="security_zone">Security Zone</Label>
                <Input
                  id="security_zone"
                  value={formData.security_zone || ''}
                  onChange={(e) => setFormData({ ...formData, security_zone: e.target.value })}
                  placeholder="Production, DMZ, Guest, etc."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingVlan ? 'Update VLAN' : 'Create VLAN'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};