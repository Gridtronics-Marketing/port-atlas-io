import { useState } from "react";
import { 
  Plus, 
  MapPin, 
  FolderOpen, 
  MessageSquare, 
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { useServiceRequests } from "@/hooks/useServiceRequests";
import { CreateServiceRequestModal } from "@/components/CreateServiceRequestModal";
import { Skeleton } from "@/components/ui/skeleton";

const ClientPortalDashboard = () => {
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const { currentOrganization } = useOrganization();
  const { accessibleLocations, clientProjects, loading: dataLoading } = useClientPortalData();
  const { serviceRequests, loading: requestsLoading } = useServiceRequests();

  const loading = dataLoading || requestsLoading;

  // Calculate metrics
  const activeProjects = clientProjects.filter(p => p.status !== 'Completed' && p.status !== 'Cancelled').length;
  const completedProjects = clientProjects.filter(p => p.status === 'Completed').length;
  const pendingRequests = serviceRequests.filter(r => r.status === 'pending' || r.status === 'reviewed').length;
  const totalDropPoints = accessibleLocations.reduce((sum, loc) => sum + loc.drop_points_count, 0);

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
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600">Completed</Badge>;
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
      <main className="container mx-auto px-4 py-6 space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-8">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-hero rounded-2xl opacity-5"></div>
        <div className="relative p-8 rounded-2xl border bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="h-8 w-8 text-primary" />
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Welcome back
                </h1>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                {currentOrganization?.name} - Client Portal
              </p>
              
              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-primary">{accessibleLocations.length}</div>
                  <div className="text-sm text-muted-foreground">Locations</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-primary">{totalDropPoints}</div>
                  <div className="text-sm text-muted-foreground">Drop Points</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-primary">{activeProjects}</div>
                  <div className="text-sm text-muted-foreground">Active Projects</div>
                </div>
                <div className="text-center lg:text-left">
                  <div className={`text-2xl font-bold ${pendingRequests > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                    {pendingRequests}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Requests</div>
                </div>
              </div>
            </div>
            
            {/* Primary Action */}
            <Button 
              onClick={() => setShowCreateRequest(true)}
              size="lg"
              className="w-full lg:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Service Request
            </Button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Locations & Service Requests - Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* My Locations */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>My Locations</CardTitle>
                </div>
                <Badge variant="secondary">{accessibleLocations.length} Sites</Badge>
              </div>
              <CardDescription>
                Sites you have access to view and manage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessibleLocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No locations assigned yet</p>
                  <p className="text-sm">Contact your service provider to get access to locations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {accessibleLocations.slice(0, 4).map((location) => (
                    <div 
                      key={location.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {location.drop_points_count} drop points • {location.access_level} access
                          </p>
                        </div>
                      </div>
                      <Badge variant={location.status === 'Active' ? 'default' : 'secondary'}>
                        {location.status}
                      </Badge>
                    </div>
                  ))}
                  {accessibleLocations.length > 4 && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/locations">
                        View All Locations
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Service Requests */}
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle>Service Requests</CardTitle>
                </div>
                <Button size="sm" onClick={() => setShowCreateRequest(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Request
                </Button>
              </div>
              <CardDescription>
                Track your service requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {serviceRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No service requests yet</p>
                  <p className="text-sm">Submit a request to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {serviceRequests.slice(0, 5).map((request) => (
                    <div 
                      key={request.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{request.title}</p>
                          {getPriorityBadge(request.priority)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {request.description || 'No description provided'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(request.created_at).toLocaleDateString()}
                          {request.location && (
                            <>
                              <span>•</span>
                              <MapPin className="h-3 w-3" />
                              {request.location.name}
                            </>
                          )}
                        </div>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Status */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clientProjects.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No projects yet</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Completion</span>
                      <span className="text-sm text-muted-foreground">
                        {clientProjects.length > 0 
                          ? Math.round((completedProjects / clientProjects.length) * 100) 
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={clientProjects.length > 0 
                        ? (completedProjects / clientProjects.length) * 100 
                        : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-xl font-bold text-primary">{activeProjects}</div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{completedProjects}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/projects">
                      View All Projects
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Request Stats */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Request Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-medium">
                  {serviceRequests.filter(r => r.status === 'pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Under Review</span>
                </div>
                <span className="font-medium">
                  {serviceRequests.filter(r => r.status === 'reviewed').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-sm">In Progress</span>
                </div>
                <span className="font-medium">
                  {serviceRequests.filter(r => r.status === 'in_progress').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-medium">
                  {serviceRequests.filter(r => r.status === 'completed').length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-between group" asChild>
                <Link to="/locations">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-3" />
                    View Locations
                  </div>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-between group"
                onClick={() => setShowCreateRequest(true)}
              >
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-3" />
                  New Request
                </div>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Service Request Modal */}
      <CreateServiceRequestModal 
        open={showCreateRequest} 
        onOpenChange={setShowCreateRequest} 
      />
    </main>
  );
};

export default ClientPortalDashboard;
