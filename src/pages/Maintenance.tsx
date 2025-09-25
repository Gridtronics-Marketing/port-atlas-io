import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Plus, Calendar, Wrench, Clock, AlertTriangle, Search, CheckCircle } from 'lucide-react';
import { useMaintenanceScheduling } from '@/hooks/useMaintenanceScheduling';
import { AddMaintenanceModal } from '@/components/AddMaintenanceModal';
import { MaintenanceDetailsModal } from '@/components/MaintenanceDetailsModal';
import { format } from 'date-fns';

export default function Maintenance() {
  const { 
    schedules, 
    billing, 
    loading,
    getUpcomingMaintenance,
    getOverdueBilling 
  } = useMaintenanceScheduling();
  
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const upcomingMaintenance = getUpcomingMaintenance(30);
  const overdueBilling = getOverdueBilling();

  const filteredSchedules = schedules.filter(schedule =>
    schedule.service_plan?.plan_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schedule.location?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading maintenance schedules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Maintenance Scheduling</h1>
          <p className="text-muted-foreground">
            Schedule and track preventive maintenance for client locations
          </p>
        </div>
        <Button onClick={() => setShowAddMaintenance(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming (30 days)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMaintenance.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter(s => 
                s.status === 'completed' && 
                new Date(s.scheduled_date).getMonth() === new Date().getMonth()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Billing</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueBilling.length}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search maintenance schedules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({schedules.filter(s => s.status === 'scheduled').length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({schedules.filter(s => s.status === 'in-progress').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({schedules.filter(s => s.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="billing">
            Billing ({billing.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4">
            {filteredSchedules.filter(s => s.status === 'scheduled').map((schedule) => (
              <Card 
                key={schedule.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedSchedule(schedule.id)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {schedule.service_plan?.plan_name || 'Maintenance'}
                        </h3>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Location: {schedule.location?.name || 'TBD'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Technician: {
                          schedule.technician 
                            ? `${schedule.technician.first_name} ${schedule.technician.last_name}`
                            : 'Unassigned'
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {format(new Date(schedule.scheduled_date), 'MMM dd, yyyy')}
                      </div>
                      {schedule.scheduled_time && (
                        <div className="text-sm text-muted-foreground">
                          {schedule.scheduled_time}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <div className="grid gap-4">
            {filteredSchedules.filter(s => s.status === 'in-progress').map((schedule) => (
              <Card 
                key={schedule.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedSchedule(schedule.id)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {schedule.service_plan?.plan_name || 'Maintenance'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {schedule.location?.name}
                      </p>
                    </div>
                    <Badge className={getStatusColor(schedule.status)}>
                      {schedule.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {filteredSchedules.filter(s => s.status === 'completed').map((schedule) => (
              <Card 
                key={schedule.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedSchedule(schedule.id)}
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {schedule.service_plan?.plan_name || 'Maintenance'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {schedule.location?.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed: {schedule.completed_at ? format(new Date(schedule.completed_at), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                    <Badge className={getStatusColor(schedule.status)}>
                      {schedule.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid gap-4">
            {billing.map((bill) => (
              <Card key={bill.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {bill.contract?.title || 'Contract'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Billing Period: {format(new Date(bill.billing_period_start), 'MMM dd')} - {format(new Date(bill.billing_period_end), 'MMM dd, yyyy')}
                      </p>
                      {bill.due_date && (
                        <p className="text-sm text-muted-foreground">
                          Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">${bill.amount.toLocaleString()}</div>
                      <Badge 
                        className={
                          bill.status === 'paid' 
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : bill.status === 'overdue'
                            ? 'bg-destructive/10 text-destructive border-destructive/20'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }
                      >
                        {bill.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddMaintenanceModal 
        open={showAddMaintenance} 
        onOpenChange={setShowAddMaintenance}
      />

      {selectedSchedule && (
        <MaintenanceDetailsModal
          scheduleId={selectedSchedule}
          open={!!selectedSchedule}
          onOpenChange={(open) => !open && setSelectedSchedule(null)}
        />
      )}
    </div>
  );
}