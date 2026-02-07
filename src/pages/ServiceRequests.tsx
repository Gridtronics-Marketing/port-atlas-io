import { useState } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/contexts/OrganizationContext";
import { ServiceRequestsManager } from "@/components/ServiceRequestsManager";
import { CreateServiceRequestModal } from "@/components/CreateServiceRequestModal";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin } from "lucide-react";

const ServiceRequests = () => {
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const { isClientPortalUser } = useOrganization();
  const { serviceRequests, loading } = useServiceRequests();

  // Client portal view - simplified list of their requests
  if (isClientPortalUser) {
    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'pending':
          return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
        case 'reviewed':
          return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Under Review</Badge>;
        case 'approved':
          return <Badge variant="secondary" className="bg-green-500/10 text-green-600">Approved</Badge>;
        case 'in_progress':
          return <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">In Progress</Badge>;
        case 'completed':
          return <Badge className="bg-green-600">Completed</Badge>;
        case 'rejected':
          return <Badge variant="destructive">Rejected</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    const getPriorityBadge = (priority: string) => {
      switch (priority) {
        case 'urgent':
          return <Badge variant="destructive">Urgent</Badge>;
        case 'high':
          return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600">High</Badge>;
        case 'medium':
          return <Badge variant="secondary">Medium</Badge>;
        case 'low':
          return <Badge variant="outline">Low</Badge>;
        default:
          return <Badge variant="outline">{priority}</Badge>;
      }
    };

    if (loading) {
      return (
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">
            Loading service requests...
          </div>
        </main>
      );
    }

    return (
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Service Requests</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage your service requests
            </p>
          </div>
          <Button onClick={() => setShowCreateRequest(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Your Requests</CardTitle>
              <Badge variant="secondary">{serviceRequests.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {serviceRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No service requests yet</p>
                <p className="text-sm mb-4">Submit a request to get started</p>
                <Button onClick={() => setShowCreateRequest(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Request
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceRequests.map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{request.title}</p>
                        {getPriorityBadge(request.priority)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {request.description || 'No description provided'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                        {request.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.location.name}
                          </div>
                        )}
                      </div>
                      {request.review_notes && (
                        <div className="mt-3 p-3 rounded bg-muted/50">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Response:</p>
                          <p className="text-sm">{request.review_notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <CreateServiceRequestModal 
          open={showCreateRequest} 
          onOpenChange={setShowCreateRequest} 
        />
      </main>
    );
  }

  // Parent org view - full management interface
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Service Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage service requests from your clients
          </p>
        </div>
      </div>

      <ServiceRequestsManager />
    </main>
  );
};

export default ServiceRequests;
