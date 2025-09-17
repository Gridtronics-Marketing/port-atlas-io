import { useState } from 'react';
import { Plus, Filter, Search, FileText, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddWorkOrderModal } from '@/components/AddWorkOrderModal';
import { WorkOrderList } from '@/components/WorkOrderList';
import { useWorkOrders } from '@/hooks/useWorkOrders';

const WorkOrders = () => {
  const [showAddWorkOrder, setShowAddWorkOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { workOrders, loading } = useWorkOrders();

  const stats = {
    total: workOrders.length,
    open: workOrders.filter(wo => wo.status === 'Open').length,
    inProgress: workOrders.filter(wo => wo.status === 'In Progress').length,
    completed: workOrders.filter(wo => wo.status === 'Completed').length,
  };

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Work Orders
            </h1>
            <p className="text-muted-foreground mt-1">
              Create, assign, and track work orders across all projects
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAddWorkOrder(true)}
            className="bg-gradient-primary hover:bg-primary-hover shadow-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Work Order
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <div className="h-4 w-4 rounded-full bg-gray-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search work orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Work Orders Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({stats.inProgress})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <WorkOrderList filter="all" />
          </TabsContent>
          
          <TabsContent value="open" className="mt-6">
            <WorkOrderList filter="open" />
          </TabsContent>
          
          <TabsContent value="in-progress" className="mt-6">
            <WorkOrderList filter="in-progress" />
          </TabsContent>
          
          <TabsContent value="completed" className="mt-6">
            <WorkOrderList filter="completed" />
          </TabsContent>
        </Tabs>

        {/* Add Work Order Modal */}
        <AddWorkOrderModal 
          open={showAddWorkOrder} 
          onOpenChange={setShowAddWorkOrder} 
        />
      </main>
  );
};

export default WorkOrders;