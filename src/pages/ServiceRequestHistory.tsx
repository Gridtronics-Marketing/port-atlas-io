import { useState, useMemo } from 'react';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { ServiceRequestFilters, ServiceRequestFiltersState } from '@/components/ServiceRequestFilters';
import { ServiceRequestHistoryCard } from '@/components/ServiceRequestHistoryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

const initialFilters: ServiceRequestFiltersState = {
  status: 'all',
  priority: 'all',
  searchQuery: '',
  dateFrom: undefined,
  dateTo: undefined,
};

const ServiceRequestHistory = () => {
  const { serviceRequests, loading } = useServiceRequests();
  const [filters, setFilters] = useState<ServiceRequestFiltersState>(initialFilters);

  // Filter requests based on current filters
  const filteredRequests = useMemo(() => {
    return serviceRequests.filter((request) => {
      // Status filter
      if (filters.status !== 'all' && request.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && request.priority !== filters.priority) {
        return false;
      }

      // Search filter
      if (filters.searchQuery) {
        const search = filters.searchQuery.toLowerCase();
        const matchesTitle = request.title.toLowerCase().includes(search);
        const matchesDescription = request.description?.toLowerCase().includes(search);
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      // Date range filter
      const requestDate = new Date(request.created_at);
      if (filters.dateFrom && requestDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (requestDate > endOfDay) {
          return false;
        }
      }

      return true;
    });
  }, [serviceRequests, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = serviceRequests.length;
    const open = serviceRequests.filter(
      (r) => ['pending', 'under_review', 'approved', 'in_progress'].includes(r.status)
    ).length;
    const completed = serviceRequests.filter((r) => r.status === 'completed').length;
    const rejected = serviceRequests.filter((r) => r.status === 'rejected').length;
    return { total, open, completed, rejected };
  }, [serviceRequests]);

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Request History</h1>
        <p className="text-muted-foreground mt-1">
          View and track all your service requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.open}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats.completed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{stats.rejected}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <ServiceRequestFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
          />
        </CardContent>
      </Card>

      {/* Request List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
            </Card>
          ))
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No requests found</h3>
              <p className="text-muted-foreground">
                {serviceRequests.length === 0
                  ? "You haven't submitted any service requests yet."
                  : 'No requests match your current filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <ServiceRequestHistoryCard key={request.id} request={request} />
          ))
        )}
      </div>

      {/* Results count */}
      {!loading && filteredRequests.length > 0 && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Showing {filteredRequests.length} of {serviceRequests.length} requests
        </p>
      )}
    </div>
  );
};

export default ServiceRequestHistory;
