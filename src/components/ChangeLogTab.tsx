import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, FileText, Move, Plus, Edit, Trash, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useChangeLog } from '@/hooks/useChangeLog';
import { format } from 'date-fns';

interface ChangeLogTabProps {
  locationId: string;
}

export const ChangeLogTab: React.FC<ChangeLogTabProps> = ({ locationId }) => {
  const { changeLogs, loading } = useChangeLog(locationId);
  const [searchTerm, setSearchTerm] = useState('');
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>('all');
  const [componentTypeFilter, setComponentTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'add': return <Plus className="h-4 w-4" />;
      case 'move': return <Move className="h-4 w-4" />;
      case 'change': return <Edit className="h-4 w-4" />;
      case 'remove': return <Trash className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getChangeTypeColor = (type: string) => {
    switch (type) {
      case 'add': return 'bg-green-500';
      case 'move': return 'bg-blue-500';
      case 'change': return 'bg-yellow-500';
      case 'remove': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredChangeLogs = changeLogs.filter(log => {
    const matchesSearch = log.change_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.component_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChangeType = changeTypeFilter === 'all' || log.change_type === changeTypeFilter;
    const matchesComponentType = componentTypeFilter === 'all' || log.component_type === componentTypeFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesChangeType && matchesComponentType && matchesStatus;
  });

  if (loading) {
    return <div className="text-center py-8">Loading change logs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Change Log & Activity</h3>
        <p className="text-sm text-muted-foreground">
          Track all moves, adds, and changes (MACs) to your network infrastructure
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search changes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="add">Add</SelectItem>
            <SelectItem value="move">Move</SelectItem>
            <SelectItem value="change">Change</SelectItem>
            <SelectItem value="remove">Remove</SelectItem>
          </SelectContent>
        </Select>

        <Select value={componentTypeFilter} onValueChange={setComponentTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Component" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Components</SelectItem>
            <SelectItem value="cable">Cable</SelectItem>
            <SelectItem value="device">Device</SelectItem>
            <SelectItem value="port">Port</SelectItem>
            <SelectItem value="frame">Frame</SelectItem>
            <SelectItem value="vlan">VLAN</SelectItem>
            <SelectItem value="connection">Connection</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{changeLogs.length}</div>
            <div className="text-sm text-muted-foreground">Total Changes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {changeLogs.filter(c => c.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {changeLogs.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {changeLogs.filter(c => c.change_type === 'add').length}
            </div>
            <div className="text-sm text-muted-foreground">New Additions</div>
          </CardContent>
        </Card>
      </div>

      {/* Change Log Timeline */}
      <div className="space-y-3">
        {filteredChangeLogs.map(log => (
          <Card key={log.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Icon and Type */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-2 rounded-full ${getChangeTypeColor(log.change_type)}`}>
                    {getChangeTypeIcon(log.change_type)}
                  </div>
                  <Badge className={getChangeTypeColor(log.change_type)}>
                    {log.change_type.toUpperCase()}
                  </Badge>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium capitalize">
                      {log.component_type.replace('_', ' ')}
                    </span>
                    {log.change_description && (
                      <span className="text-sm text-muted-foreground">
                        • {log.change_description}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                    </div>
                    
                    {log.technician && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.technician.first_name} {log.technician.last_name}
                      </div>
                    )}
                    
                    {log.work_order && (
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        WO: {log.work_order.work_order_number}
                      </div>
                    )}
                  </div>

                  {/* Change Details */}
                  {(log.old_values || log.new_values) && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      {log.old_values && Object.keys(log.old_values).length > 0 && (
                        <div className="mb-1">
                          <span className="font-medium">Before:</span>{' '}
                          {JSON.stringify(log.old_values, null, 0)}
                        </div>
                      )}
                      {log.new_values && Object.keys(log.new_values).length > 0 && (
                        <div>
                          <span className="font-medium">After:</span>{' '}
                          {JSON.stringify(log.new_values, null, 0)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(log.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(log.status)}
                      {log.status.replace('_', ' ')}
                    </div>
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredChangeLogs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No change logs found. Network modifications will appear here automatically.
          </div>
        )}
      </div>
    </div>
  );
};