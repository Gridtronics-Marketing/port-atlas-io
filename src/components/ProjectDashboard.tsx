import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  DollarSign, 
  MapPin, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useLocations } from '@/hooks/useLocations';

export function ProjectDashboard() {
  const { projects, loading: projectsLoading } = useProjects();
  const { workOrders } = useWorkOrders();
  const { locations } = useLocations();

  if (projectsLoading) {
    return <div className="text-center py-4">Loading projects...</div>;
  }

  const activeProjects = projects.filter(p => p.status !== 'Completed');
  const completedProjects = projects.filter(p => p.status === 'Completed');

  // Calculate project metrics
  const getProjectWorkOrders = (projectId: string) => 
    workOrders.filter(wo => wo.project_id === projectId);

  const getProjectProgress = (projectId: string) => {
    const projectWorkOrders = getProjectWorkOrders(projectId);
    if (projectWorkOrders.length === 0) return 0;
    const completed = projectWorkOrders.filter(wo => wo.status === 'Completed').length;
    return Math.round((completed / projectWorkOrders.length) * 100);
  };

  const getProjectLocation = (locationId?: string) => 
    locations.find(l => l.id === locationId);

  const statusColors = {
    Planning: 'bg-blue-100 text-blue-800 border-blue-200',
    'In Progress': 'bg-orange-100 text-orange-800 border-orange-200',
    'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Completed: 'bg-green-100 text-green-800 border-green-200',
  };

  const priorityColors = {
    Low: 'bg-gray-100 text-gray-600',
    Medium: 'bg-blue-100 text-blue-600',
    High: 'bg-orange-100 text-orange-600',
    Critical: 'bg-red-100 text-red-600',
  };

  return (
    <div className="space-y-6">
      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects.length}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${projects.reduce((sum, p) => sum + (p.estimated_budget || 0), 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Work Orders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {workOrders.filter(wo => 
                wo.due_date && 
                new Date(wo.due_date) < new Date() && 
                wo.status !== 'Completed'
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Projects List */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Active Projects
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active projects
            </div>
          ) : (
            <div className="space-y-4">
              {activeProjects.slice(0, 5).map((project) => {
                const progress = getProjectProgress(project.id);
                const projectWorkOrders = getProjectWorkOrders(project.id);
                const location = getProjectLocation(project.client_id); // Assuming client_id might be location for now
                
                return (
                  <div key={project.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge 
                          variant="outline" 
                          className={statusColors[project.status as keyof typeof statusColors] || statusColors.Planning}
                        >
                          {project.status}
                        </Badge>
                        {project.priority && (
                          <Badge 
                            variant="secondary" 
                            className={priorityColors[project.priority as keyof typeof priorityColors] || priorityColors.Medium}
                          >
                            {project.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {project.start_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Started {new Date(project.start_date).toLocaleDateString()}
                        </div>
                      )}
                      
                      {project.end_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {new Date(project.end_date).toLocaleDateString()}
                        </div>
                      )}
                      
                      {project.estimated_budget && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ${project.estimated_budget.toLocaleString()} budget
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress ({projectWorkOrders.length} work orders)</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}