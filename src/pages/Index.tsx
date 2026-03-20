import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  MapPin, 
  Users, 
  Building2, 
  Activity, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  ArrowRight, 
  BarChart3,
  Clock,
  Briefcase,
  ClipboardList,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { WorkOrderList } from "@/components/WorkOrderList";
import { AddLocationModal } from "@/components/AddLocationModal";
import { MetricCard } from "@/components/ui/metric-card";
import { useLocations } from "@/hooks/useLocations";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useDropPoints } from "@/hooks/useDropPoints";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import ClientPortalDashboard from "@/pages/ClientPortalDashboard";

const Index = () => {
  const { isClientPortalUser } = useOrganization();
  const [showAddLocation, setShowAddLocation] = useState(false);
  const { locations } = useLocations();
  const { workOrders } = useWorkOrders();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { dropPoints } = useDropPoints();
  const { toast } = useToast();
  
  // If client portal user, show client dashboard
  if (isClientPortalUser) {
    return <ClientPortalDashboard />;
  }

  // Calculate key metrics
  const activeLocations = locations.filter(l => l.status === 'Active').length;
  const activeProjects = projects.filter(p => p.status !== 'Completed').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const pendingWorkOrders = workOrders.filter(wo => wo.status === 'Pending').length;
  const inProgressWorkOrders = workOrders.filter(wo => wo.status === 'In Progress').length;
  const overdueWorkOrders = workOrders.filter(wo => 
    wo.due_date && 
    new Date(wo.due_date) < new Date() && 
    wo.status !== 'Completed'
  ).length;
  const completionRate = dropPoints.length > 0 ? 
    Math.round((dropPoints.filter(dp => dp.status === 'tested' || dp.status === 'finished').length / dropPoints.length) * 100) : 0;
  const totalDropPoints = dropPoints.length;
  const completedDropPoints = dropPoints.filter(dp => dp.status === 'tested' || dp.status === 'finished').length;

  return (
    <div className="min-h-full bg-background">
      {/* Page Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Overview of your operations and performance metrics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowAddLocation(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Location
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/work-orders">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Work Orders
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-6 py-6 space-y-6">
        
        {/* Alert Banner */}
        {overdueWorkOrders > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div className="flex-shrink-0 h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {overdueWorkOrders} overdue work order{overdueWorkOrders > 1 ? 's' : ''} require attention
              </p>
              <p className="text-xs text-muted-foreground">
                Review and update status to keep projects on track
              </p>
            </div>
            <Button variant="destructive" size="sm" asChild>
              <Link to="/work-orders">
                View All
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        )}

        {/* KPI Metrics Row */}
        <div className="grid-metrics">
          <MetricCard
            title="Active Sites"
            value={activeLocations}
            icon={MapPin}
            trend={{ value: 12, direction: "up", label: "vs last month" }}
          />
          <MetricCard
            title="Active Projects"
            value={activeProjects}
            icon={Briefcase}
            subtitle={`${completedProjects} completed`}
          />
          <MetricCard
            title="Completion Rate"
            value={`${completionRate}%`}
            icon={Target}
            trend={{ 
              value: 5, 
              direction: completionRate >= 75 ? "up" : "neutral",
              label: `${completedDropPoints}/${totalDropPoints} points`
            }}
            variant={completionRate >= 75 ? "success" : "default"}
          />
          <MetricCard
            title="Pending Orders"
            value={pendingWorkOrders + inProgressWorkOrders}
            icon={ClipboardList}
            subtitle={`${pendingWorkOrders} pending, ${inProgressWorkOrders} in progress`}
            variant={overdueWorkOrders > 0 ? "warning" : "default"}
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Work Orders Panel - Primary */}
          <div className="lg:col-span-2">
            <Card className="h-full shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Active Work Orders</CardTitle>
                      <CardDescription className="text-xs">
                        Track and manage field operations
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {workOrders.filter(wo => wo.status !== 'Completed').length} Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <WorkOrderList limit={5} />
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to="/work-orders">
                      View All Orders
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/integrations">
                      <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                      Reports
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Panels */}
          <div className="space-y-6">
            
            {/* Project Progress */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <CardTitle className="text-base">Project Progress</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Overall Completion</span>
                    <span className="font-semibold tabular-nums">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="text-center p-3 rounded-lg bg-success/5 border border-success/10">
                    <div className="text-xl font-bold text-success tabular-nums">{completedProjects}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Completed</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="text-xl font-bold text-primary tabular-nums">{activeProjects}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">In Progress</div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                  <Link to="/projects">
                    View Projects
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription className="text-xs">Common management tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickActionButton
                  to="/locations"
                  icon={MapPin}
                  label="Manage Sites"
                />
                <QuickActionButton
                  to="/employees"
                  icon={Users}
                  label="Team Management"
                />
                <QuickActionButton
                  to="/clients"
                  icon={Building2}
                  label="Client Portal"
                />
                <QuickActionButton
                  to="/scheduling"
                  icon={Calendar}
                  label="Scheduling"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      <AddLocationModal 
        open={showAddLocation} 
        onOpenChange={setShowAddLocation} 
      />
    </div>
  );
};

// Quick Action Button Component
interface QuickActionButtonProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const QuickActionButton = ({ to, icon: Icon, label }: QuickActionButtonProps) => (
  <Button 
    variant="ghost" 
    className="w-full justify-between h-10 px-3 text-sm font-normal hover:bg-muted/50 group" 
    asChild
  >
    <Link to={to}>
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span>{label}</span>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
    </Link>
  </Button>
);

export default Index;