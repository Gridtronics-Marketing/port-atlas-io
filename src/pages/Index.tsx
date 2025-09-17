import { useState } from "react";
import { Plus, MapPin, Users, Building2, Activity, FileText, TrendingUp, AlertTriangle, CheckCircle, Calendar, DollarSign, ArrowRight, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { WorkOrderList } from "@/components/WorkOrderList";
import { AddLocationModal } from "@/components/AddLocationModal";
import { Navigation } from "@/components/Navigation";
import { SeedDataButton } from "@/components/SeedDataButton";
import { useLocations } from "@/hooks/useLocations";
import { useWorkOrders } from "@/hooks/useWorkOrders";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useDropPoints } from "@/hooks/useDropPoints";

const Index = () => {
  const [showAddLocation, setShowAddLocation] = useState(false);
  const { locations } = useLocations();
  const { workOrders } = useWorkOrders();
  const { clients } = useClients();
  const { projects } = useProjects();
  const { dropPoints } = useDropPoints();

  // Calculate key metrics
  const activeLocations = locations.filter(l => l.status === 'Active').length;
  const activeProjects = projects.filter(p => p.status !== 'Completed').length;
  const overdueWorkOrders = workOrders.filter(wo => 
    wo.due_date && 
    new Date(wo.due_date) < new Date() && 
    wo.status !== 'Completed'
  ).length;
  const completionRate = dropPoints.length > 0 ? 
    Math.round((dropPoints.filter(dp => dp.status === 'tested' || dp.status === 'active').length / dropPoints.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-8">
        <SeedDataButton />
        
        {/* Hero Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-hero rounded-2xl opacity-5"></div>
          <div className="relative p-8 rounded-2xl border bg-card/50 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-3">
                  Jobsite Manager
                </h1>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
                  Professional cable installation management system. Track projects, manage teams, and deliver exceptional results.
                </p>
                
                {/* Key Metrics Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-primary">{activeLocations}</div>
                    <div className="text-sm text-muted-foreground">Active Sites</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-primary">{activeProjects}</div>
                    <div className="text-sm text-muted-foreground">Projects</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl font-bold text-primary">{completionRate}%</div>
                    <div className="text-sm text-muted-foreground">Completion</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className={`text-2xl font-bold ${overdueWorkOrders > 0 ? 'text-destructive' : 'text-success'}`}>
                      {overdueWorkOrders}
                    </div>
                    <div className="text-sm text-muted-foreground">Overdue</div>
                  </div>
                </div>
              </div>
              
              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button 
                  onClick={() => setShowAddLocation(true)}
                  size="lg"
                  className="bg-gradient-primary hover:bg-primary-hover shadow-medium"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Location
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/work-orders">
                    <FileText className="h-5 w-5 mr-2" />
                    Work Orders
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {overdueWorkOrders > 0 && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Action Required</h3>
                  <p className="text-sm text-muted-foreground">
                    {overdueWorkOrders} work order{overdueWorkOrders > 1 ? 's are' : ' is'} overdue and need{overdueWorkOrders > 1 ? '' : 's'} immediate attention.
                  </p>
                </div>
                <Button variant="destructive" size="sm" asChild>
                  <Link to="/work-orders">
                    View Overdue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Work Orders - Priority Section */}
          <div className="lg:col-span-2">
            <Card className="h-full shadow-soft hover:shadow-medium transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle>Active Work Orders</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {workOrders.filter(wo => wo.status !== 'Completed').length} Active
                  </Badge>
                </div>
                <CardDescription>
                  Track installation progress and manage field operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkOrderList limit={6} />
                <div className="mt-6 pt-4 border-t">
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to="/work-orders">
                        View All Orders
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/integrations">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Reports
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Access Sidebar */}
          <div className="space-y-6">
            {/* Project Status */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Project Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl font-bold text-success">{projects.filter(p => p.status === 'Completed').length}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{activeProjects}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Essential management tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-between group" asChild>
                  <Link to="/locations">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-3" />
                      Manage Sites
                    </div>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-between group" asChild>
                  <Link to="/employees">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-3" />
                      Team Management
                    </div>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-between group" asChild>
                  <Link to="/clients">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-3" />
                      Client Portal
                    </div>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full justify-between group" asChild>
                  <Link to="/advanced-features">
                    <div className="flex items-center">
                      <Activity className="h-4 w-4 mr-3" />
                      Advanced Tools
                    </div>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Location Modal */}
        <AddLocationModal 
          open={showAddLocation} 
          onOpenChange={setShowAddLocation} 
        />
      </main>
    </div>
  );
};

export default Index;