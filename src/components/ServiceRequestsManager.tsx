import { useState } from "react";
import {
  MessageSquare,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  PlayCircle,
  Eye,
  Building2,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useServiceRequests, ServiceRequest } from "@/hooks/useServiceRequests";
import { Skeleton } from "@/components/ui/skeleton";

export function ServiceRequestsManager() {
  const { serviceRequests, loading, updateServiceRequest } = useServiceRequests();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    setUpdating(true);
    await updateServiceRequest(requestId, { 
      status: newStatus,
      review_notes: reviewNotes || undefined,
    });
    setUpdating(false);
    setSelectedRequest(null);
    setReviewNotes("");
  };

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

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'service_addition':
        return 'Service Addition';
      case 'support':
        return 'Support';
      case 'change_request':
        return 'Change Request';
      case 'maintenance':
        return 'Maintenance';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = serviceRequests.filter(r => 
    r.status === 'pending' || r.status === 'reviewed'
  );
  const activeRequests = serviceRequests.filter(r => 
    r.status === 'approved' || r.status === 'in_progress'
  );
  const completedRequests = serviceRequests.filter(r => 
    r.status === 'completed' || r.status === 'rejected'
  );

  return (
    <div className="space-y-6">
      {/* Pending Requests - Needs Attention */}
      {pendingRequests.length > 0 && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <CardTitle>Pending Review</CardTitle>
              <Badge variant="secondary">{pendingRequests.length}</Badge>
            </div>
            <CardDescription>
              Service requests awaiting your review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => (
              <div 
                key={request.id}
                className="flex items-start justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{request.title}</p>
                    {getPriorityBadge(request.priority)}
                    <Badge variant="outline">{getRequestTypeLabel(request.request_type)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {request.description || 'No description provided'}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {request.requesting_organization?.name || 'Unknown'}
                    </div>
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
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {getStatusBadge(request.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Actions
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Review & Respond
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'approved')}>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusUpdate(request.id, 'in_progress')}>
                        <PlayCircle className="h-4 w-4 mr-2 text-purple-600" />
                        Start Work
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setSelectedRequest(request)}
                        className="text-destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-purple-600" />
              <CardTitle>Active Requests</CardTitle>
              <Badge variant="secondary">{activeRequests.length}</Badge>
            </div>
            <CardDescription>
              Approved or in-progress service requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeRequests.map((request) => (
              <div 
                key={request.id}
                className="flex items-start justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{request.title}</p>
                    {getPriorityBadge(request.priority)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {request.requesting_organization?.name || 'Unknown'}
                    </div>
                    {request.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {request.location.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {getStatusBadge(request.status)}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleStatusUpdate(request.id, 'completed')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All Requests Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>All Service Requests</CardTitle>
            <Badge variant="secondary">{serviceRequests.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {serviceRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No service requests from clients yet</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {serviceRequests.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{request.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.requesting_organization?.name} • {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(request.priority)}
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Service Request</DialogTitle>
            <DialogDescription>
              Review the request and add notes before updating the status.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium">{selectedRequest.title}</p>
                  {getPriorityBadge(selectedRequest.priority)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedRequest.description || 'No description provided'}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>From: {selectedRequest.requesting_organization?.name}</span>
                  <span>Type: {getRequestTypeLabel(selectedRequest.request_type)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Review Notes</Label>
                <Textarea
                  id="notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSelectedRequest(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedRequest && handleStatusUpdate(selectedRequest.id, 'rejected')}
              disabled={updating}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
            <Button 
              onClick={() => selectedRequest && handleStatusUpdate(selectedRequest.id, 'approved')}
              disabled={updating}
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
