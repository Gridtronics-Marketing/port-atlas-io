import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Router, Server, Smartphone, Camera, Wifi, Shield, Battery, Network } from 'lucide-react';
import { useNetworkDevices, NetworkDevice } from '@/hooks/useNetworkDevices';

interface DevicesEndpointsTabProps {
  locationId: string;
}

export const DevicesEndpointsTab: React.FC<DevicesEndpointsTabProps> = ({ locationId }) => {
  const { devices, loading, addDevice, updateDevice, deleteDevice } = useNetworkDevices(locationId);
  const [searchTerm, setSearchTerm] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);
  const [formData, setFormData] = useState<Partial<NetworkDevice>>({
    device_name: '',
    device_type: 'switch',
    poe_status: 'disabled',
    port_count: 0,
    status: 'active',
    device_details: {}
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'switch': return <Network className="h-4 w-4" />;
      case 'router': return <Router className="h-4 w-4" />;
      case 'server': return <Server className="h-4 w-4" />;
      case 'access_point': return <Wifi className="h-4 w-4" />;
      case 'voip_phone': return <Smartphone className="h-4 w-4" />;
      case 'camera': return <Camera className="h-4 w-4" />;
      case 'firewall': return <Shield className="h-4 w-4" />;
      case 'ups': return <Battery className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'decommissioned': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPoeStatusColor = (poeStatus: string) => {
    switch (poeStatus) {
      case 'enabled': return 'bg-green-500';
      case 'disabled': return 'bg-gray-500';
      case 'auto': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.mac_address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = deviceTypeFilter === 'all' || device.device_type === deviceTypeFilter;
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, formData);
      } else {
        await addDevice({ ...formData, location_id: locationId } as any);
      }
      setShowAddModal(false);
      setEditingDevice(null);
      setFormData({
        device_name: '',
        device_type: 'switch',
        poe_status: 'disabled',
        port_count: 0,
        status: 'active',
        device_details: {}
      });
    } catch (error) {
      console.error('Error saving device:', error);
    }
  };

  const handleEdit = (device: NetworkDevice) => {
    setEditingDevice(device);
    setFormData(device);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this device?')) {
      await deleteDevice(id);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading devices...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Device Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="switch">Switch</SelectItem>
              <SelectItem value="router">Router</SelectItem>
              <SelectItem value="server">Server</SelectItem>
              <SelectItem value="access_point">Access Point</SelectItem>
              <SelectItem value="voip_phone">VoIP Phone</SelectItem>
              <SelectItem value="camera">Camera</SelectItem>
              <SelectItem value="firewall">Firewall</SelectItem>
              <SelectItem value="ups">UPS</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="decommissioned">Decommissioned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Device
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{devices.length}</div>
            <div className="text-sm text-muted-foreground">Total Devices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {devices.filter(d => d.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active Devices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {devices.filter(d => d.poe_status === 'enabled').length}
            </div>
            <div className="text-sm text-muted-foreground">PoE Enabled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {devices.reduce((sum, d) => sum + (d.port_count || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Ports</div>
          </CardContent>
        </Card>
      </div>

      {/* Devices List */}
      <div className="space-y-3">
        {filteredDevices.map(device => (
          <Card key={device.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getDeviceIcon(device.device_type)}
                  <div>
                    <div className="font-medium">{device.device_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {device.device_type.replace('_', ' ')} • {device.manufacturer} {device.model}
                    </div>
                    {device.ip_address && (
                      <div className="text-xs text-muted-foreground">
                        IP: {device.ip_address}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(device.status)}>
                    {device.status}
                  </Badge>
                  {device.poe_status !== 'disabled' && (
                    <Badge className={getPoeStatusColor(device.poe_status)}>
                      PoE {device.poe_status}
                    </Badge>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {device.port_count} ports
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(device)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(device.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredDevices.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No devices found. Add devices to start managing your network infrastructure.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDevice ? 'Edit Device' : 'Add Network Device'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="device_name">Device Name *</Label>
                <Input
                  id="device_name"
                  value={formData.device_name || ''}
                  onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="device_type">Device Type *</Label>
                <Select
                  value={formData.device_type || 'switch'}
                  onValueChange={(value) => setFormData({ ...formData, device_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="switch">Switch</SelectItem>
                    <SelectItem value="router">Router</SelectItem>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="access_point">Access Point</SelectItem>
                    <SelectItem value="voip_phone">VoIP Phone</SelectItem>
                    <SelectItem value="camera">Camera</SelectItem>
                    <SelectItem value="firewall">Firewall</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="patch_panel">Patch Panel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ip_address">IP Address</Label>
                <Input
                  id="ip_address"
                  value={formData.ip_address || ''}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  placeholder="192.168.1.100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mac_address">MAC Address</Label>
                <Input
                  id="mac_address"
                  value={formData.mac_address || ''}
                  onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
                  placeholder="00:11:22:33:44:55"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="port_count">Port Count</Label>
                <Input
                  id="port_count"
                  type="number"
                  value={formData.port_count || 0}
                  onChange={(e) => setFormData({ ...formData, port_count: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="poe_status">PoE Status</Label>
                <Select
                  value={formData.poe_status || 'disabled'}
                  onValueChange={(value) => setFormData({ ...formData, poe_status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer || ''}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDevice ? 'Update Device' : 'Add Device'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};