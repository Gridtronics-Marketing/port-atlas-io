import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Cable, Zap, Network, Eye, Edit } from 'lucide-react';
import { usePatchConnections } from '@/hooks/usePatchConnections';
import { useDistributionFrames } from '@/hooks/useDistributionFrames';

interface PatchPanelsTabProps {
  locationId: string;
}

export const PatchPanelsTab: React.FC<PatchPanelsTabProps> = ({ locationId }) => {
  const { connections, loading } = usePatchConnections(locationId);
  const { frames } = useDistributionFrames(locationId);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedFrame, setSelectedFrame] = useState<string>('all');

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'fiber': return <Zap className="h-4 w-4" />;
      case 'copper': return <Cable className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  const getConnectionTypeColor = (type: string) => {
    switch (type) {
      case 'fiber': return 'bg-blue-500';
      case 'copper': return 'bg-orange-500';
      case 'coax': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-600';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredConnections = connections.filter(connection => {
    const matchesSearch = !searchTerm || 
      connection.from_port?.toString().includes(searchTerm.toLowerCase()) ||
      connection.to_port?.toString().includes(searchTerm.toLowerCase()) ||
      connection.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || connection.cable_type === filterType;
    const matchesFrame = selectedFrame === 'all' || 
      connection.from_frame_id === selectedFrame || 
      connection.to_frame_id === selectedFrame;
    
    return matchesSearch && matchesType && matchesFrame;
  });

  if (loading) {
    return <div className="text-center">Loading patch panel connections...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Patch Panel Connections</h3>
          <p className="text-sm text-muted-foreground">
            Visual port-to-port connections with color coding and status indicators
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="fiber">Fiber</SelectItem>
            <SelectItem value="copper">Copper</SelectItem>
            <SelectItem value="coax">Coax</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedFrame} onValueChange={setSelectedFrame}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frames</SelectItem>
            {frames.map(frame => (
              <SelectItem key={frame.id} value={frame.id}>
                {frame.frame_type} - Floor {frame.floor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Connection Matrix View */}
      <div className="grid gap-4">
        {filteredConnections.map((connection) => (
          <Card key={connection.id} className="relative">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getConnectionTypeIcon(connection.cable_type || 'copper')}
                    <div className={`w-3 h-3 rounded-full ${getConnectionTypeColor(connection.cable_type || 'copper')}`} />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground">FROM</div>
                      <div className="font-mono text-sm">{connection.from_port}</div>
                    </div>
                    
                    <Cable className="h-4 w-4 text-muted-foreground" />
                    
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground">TO</div>
                      <div className="font-mono text-sm">{connection.to_port}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Badge className={getConnectionTypeColor(connection.cable_type || 'copper')}>
                      {connection.cable_type?.toUpperCase() || 'COPPER'}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(connection.connection_status)}>
                      {connection.connection_status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {connection.notes && (
                <div className="mt-3 p-2 bg-muted/50 rounded text-sm text-muted-foreground">
                  <strong>Notes:</strong> {connection.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {filteredConnections.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {connections.length === 0 
                  ? "No patch panel connections configured yet."
                  : "No connections match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Connection Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{connections.length}</div>
            <div className="text-sm text-muted-foreground">Total Connections</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {connections.filter(c => c.connection_status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active Connections</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {connections.filter(c => c.cable_type === 'fiber').length}
            </div>
            <div className="text-sm text-muted-foreground">Fiber Connections</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {connections.filter(c => c.cable_type === 'copper').length}
            </div>
            <div className="text-sm text-muted-foreground">Copper Connections</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};