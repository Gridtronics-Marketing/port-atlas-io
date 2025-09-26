import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Calendar as CalendarIcon, Download, Filter, Eye, Edit, Trash2, Plus, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout';
  resource: string;
  resourceId: string;
  resourceName?: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: string;
}

interface AuditFilters {
  userId?: string;
  action?: string;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export const AuditTrailViewer = () => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    // Mock audit data - in real app, fetch from backend
    const mockAuditData: AuditEntry[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        action: 'update',
        resource: 'backbone_cables',
        resourceId: 'cable123',
        resourceName: 'Fiber Run 1A',
        changes: [
          { field: 'capacity_used', oldValue: '12', newValue: '18' },
          { field: 'notes', oldValue: 'Good condition', newValue: 'Good condition - Updated capacity' }
        ],
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: true
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        userId: 'user2',
        userName: 'Jane Smith',
        userEmail: 'jane@example.com',
        action: 'create',
        resource: 'work_orders',
        resourceId: 'wo456',
        resourceName: 'Install Drop Point #101',
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        success: true,
        details: 'Work order created for Building A, Floor 3'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
        userId: 'user1',
        userName: 'John Doe',
        userEmail: 'john@example.com',
        action: 'delete',
        resource: 'drop_points',
        resourceId: 'dp789',
        resourceName: 'Drop Point DP-101-A',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        success: false,
        details: 'Delete failed: Drop point is referenced by active work order'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
        userId: 'user3',
        userName: 'Bob Wilson',
        userEmail: 'bob@example.com',
        action: 'login',
        resource: 'authentication',
        resourceId: 'session_abc123',
        ipAddress: '10.0.1.50',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15',
        success: true,
        details: 'Mobile login from iOS device'
      }
    ];

    setAuditEntries(mockAuditData);
    setFilteredEntries(mockAuditData);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = auditEntries;

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.userName.toLowerCase().includes(term) ||
        entry.resource.toLowerCase().includes(term) ||
        entry.resourceName?.toLowerCase().includes(term) ||
        entry.action.toLowerCase().includes(term)
      );
    }

    if (filters.userId) {
      filtered = filtered.filter(entry => entry.userId === filters.userId);
    }

    if (filters.action) {
      filtered = filtered.filter(entry => entry.action === filters.action);
    }

    if (filters.resource) {
      filtered = filtered.filter(entry => entry.resource === filters.resource);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(entry => 
        new Date(entry.timestamp) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(entry => 
        new Date(entry.timestamp) <= filters.dateTo!
      );
    }

    setFilteredEntries(filtered);
  }, [filters, auditEntries]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4 text-green-600" />;
      case 'read': return <Eye className="h-4 w-4 text-blue-600" />;
      case 'update': return <Edit className="h-4 w-4 text-yellow-600" />;
      case 'delete': return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'login': return <User className="h-4 w-4 text-purple-600" />;
      case 'logout': return <User className="h-4 w-4 text-gray-600" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'update': return 'bg-yellow-100 text-yellow-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'login': return 'bg-purple-100 text-purple-800';
      case 'logout': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const exportAuditData = () => {
    const csvContent = [
      'Timestamp,User,Action,Resource,Resource ID,Success,IP Address,Details',
      ...filteredEntries.map(entry => [
        entry.timestamp,
        entry.userName,
        entry.action,
        entry.resource,
        entry.resourceId,
        entry.success,
        entry.ipAddress,
        entry.details || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({});
    setDateRange({});
  };

  if (loading) {
    return <div className="text-center">Loading audit trail...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Audit Trail</h3>
          <p className="text-sm text-muted-foreground">
            Complete history of user actions and system changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button onClick={exportAuditData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search..."
                value={filters.searchTerm || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select value={filters.action || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value === 'all' ? undefined : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.resource || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, resource: value === 'all' ? undefined : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="backbone_cables">Backbone Cables</SelectItem>
                <SelectItem value="drop_points">Drop Points</SelectItem>
                <SelectItem value="work_orders">Work Orders</SelectItem>
                <SelectItem value="employees">Employees</SelectItem>
                <SelectItem value="authentication">Authentication</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'PPP') : 'From Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => {
                    setDateRange(prev => ({ ...prev, from: date }));
                    setFilters(prev => ({ ...prev, dateFrom: date }));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'PPP') : 'To Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => {
                    setDateRange(prev => ({ ...prev, to: date }));
                    setFilters(prev => ({ ...prev, dateTo: date }));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Audit Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Audit Entries ({filteredEntries.length})</span>
            <Badge variant="outline">{filteredEntries.length} records</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors animate-fade-in"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getActionIcon(entry.action)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{entry.userName}</span>
                          <Badge className={getActionColor(entry.action)}>
                            {entry.action.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {entry.resource.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {!entry.success && (
                            <Badge variant="destructive">FAILED</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {entry.resourceName || entry.resourceId}
                          {entry.details && ` - ${entry.details}`}
                        </div>
                        
                        {entry.changes && entry.changes.length > 0 && (
                          <div className="mt-2 text-xs space-y-1">
                            {entry.changes.map((change, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="font-medium">{change.field}:</span>
                                <span className="text-red-600">{change.oldValue}</span>
                                <span>→</span>
                                <span className="text-green-600">{change.newValue}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(entry.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>IP: {entry.ipAddress}</span>
                    <span>{format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm:ss')}</span>
                  </div>
                </div>
              ))}
              
              {filteredEntries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No audit entries match your current filters
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};