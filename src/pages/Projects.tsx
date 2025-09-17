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
import { useProjects } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useLocations } from "@/hooks/useLocations";
import { format } from "date-fns";

const Projects = () => {
  const [showAddProject, setShowAddProject] = useState(false);
  const { projects, addProject, deleteProject, loading } = useProjects();
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

  const handleDeleteProject = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject(id);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading projects...</div>
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
            Project Management
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
          New Project
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
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
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
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
                <p className="text-sm font-medium text-muted-foreground">Completed Projects</p>
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
                          <DropdownMenuItem>
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
    </div>
  );
};

export default Projects;