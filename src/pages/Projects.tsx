import { useState } from "react";
import { Plus, FolderOpen, Calendar, DollarSign, Users, MapPin, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddProjectModal } from "@/components/AddProjectModal";
import { EditProjectModal } from "@/components/EditProjectModal";
import { useProjects, Project } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useLocations } from "@/hooks/useLocations";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useClientPortalData } from "@/hooks/useClientPortalData";
import { RequestProjectModal } from "@/components/RequestProjectModal";
import { format } from "date-fns";

const Projects = () => {
  const { isClientPortalUser } = useOrganization();

  if (isClientPortalUser) {
    return <ClientProjectsView />;
  }

  return <AdminProjectsView />;
};

// ─── Client Portal: Read-only project list with request button ───
const ClientProjectsView = () => {
  const { clientProjects, loading } = useClientPortalData();
  const [showRequestProject, setShowRequestProject] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <Badge className="bg-green-500/10 text-green-600">Completed</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-500/10 text-blue-600">In Progress</Badge>;
      case 'Planning':
        return <Badge variant="secondary">Planning</Badge>;
      case 'On Hold':
        return <Badge className="bg-yellow-500/10 text-yellow-600">On Hold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">
          Loading jobs...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-primary" />
            My Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your active and completed projects
          </p>
        </div>
        <Button onClick={() => setShowRequestProject(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Request New Job
        </Button>
      </div>

      {clientProjects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No projects yet</p>
            <p className="text-sm mb-4">Request a new project to get started.</p>
            <Button onClick={() => setShowRequestProject(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Request New Job
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clientProjects.map((project) => (
            <Card key={project.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{project.name}</h3>
                      {getStatusBadge(project.status)}
                      {project.project_type && (
                        <Badge variant="outline">{project.project_type}</Badge>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {project.start_date && (
                        <span>Started: {format(new Date(project.start_date), 'MMM dd, yyyy')}</span>
                      )}
                      {project.end_date && (
                        <span>Due: {format(new Date(project.end_date), 'MMM dd, yyyy')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RequestProjectModal
        open={showRequestProject}
        onOpenChange={setShowRequestProject}
      />
    </div>
  );
};

// ─── Admin: Full Project Management ───
const AdminProjectsView = () => {
  const [showAddProject, setShowAddProject] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { projects, addProject, updateProject, deleteProject, loading } = useProjects();
  const { clients } = useClients();
  const { workOrders } = useWorkOrders();
  const { locations } = useLocations();

  const getClient = (clientId?: string) => {
    return clients.find(c => c.id === clientId);
  };

  const getProjectProgress = (projectId: string) => {
    const projectWorkOrders = workOrders.filter(wo => wo.project_id === projectId);
    if (projectWorkOrders.length === 0) return 0;
    
    const completedOrders = projectWorkOrders.filter(wo => wo.status === 'Completed');
    return Math.round((completedOrders.length / projectWorkOrders.length) * 100);
  };

  const getProjectLocations = (projectId: string) => {
    return locations.filter(l => l.project_id === projectId).length;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-success text-success-foreground';
      case 'In Progress': return 'bg-primary text-primary-foreground';
      case 'Planning': return 'bg-secondary text-secondary-foreground';
      case 'On Hold': return 'bg-warning text-warning-foreground';
      case 'Cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-destructive text-destructive-foreground';
      case 'High': return 'bg-warning text-warning-foreground';
      case 'Medium': return 'bg-primary text-primary-foreground';
      case 'Low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditProject(true);
  };

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject(id);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading jobs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            Job Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your projects, track progress, and coordinate teams
          </p>
        </div>
        
        <Button 
          onClick={() => setShowAddProject(true)}
          size="lg"
          className="bg-gradient-primary hover:bg-primary-hover shadow-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Job
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold text-foreground">{projects.length}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold text-primary">
                  {projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Jobs</p>
                <p className="text-2xl font-bold text-success">
                  {projects.filter(p => p.status === 'Completed').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-foreground">
                  ${projects.reduce((sum, p) => sum + (p.estimated_budget || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first project to start organizing your work orders and locations.
            </p>
            <Button 
              onClick={() => setShowAddProject(true)}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => {
            const client = getClient(project.client_id);
            const progress = getProjectProgress(project.id);
            const locationCount = getProjectLocations(project.id);
            
            return (
              <Card key={project.id} className="shadow-soft hover:shadow-medium transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-foreground line-clamp-1">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {client ? client.name : 'No client assigned'}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={getPriorityColor(project.priority || 'Medium')}>
                        {project.priority}
                      </Badge>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border">
                          <DropdownMenuItem onClick={() => handleEditProject(project)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary" className={getStatusColor(project.status || 'Planning')}>
                      {project.status}
                    </Badge>
                    <Badge variant="outline">{project.project_type}</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Project Info */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{locationCount} location{locationCount !== 1 ? 's' : ''}</span>
                      </div>
                      
                      {project.estimated_budget && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>${project.estimated_budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {project.start_date 
                            ? `Started: ${format(new Date(project.start_date), 'MMM dd, yyyy')}`
                            : 'No start date'
                          }
                        </span>
                        {project.end_date && (
                          <span>Due: {format(new Date(project.end_date), 'MMM dd, yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      <AddProjectModal 
        isOpen={showAddProject} 
        onClose={() => setShowAddProject(false)}
        onAddProject={addProject}
      />

      {/* Edit Project Modal */}
      <EditProjectModal 
        isOpen={showEditProject} 
        onClose={() => setShowEditProject(false)}
        onUpdateProject={updateProject}
        project={editingProject}
      />
    </div>
  );
};

export default Projects;
