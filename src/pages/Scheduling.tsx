import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, Users, Clock, Settings } from 'lucide-react';
import { ScheduleCalendar } from '@/components/ScheduleCalendar';
import { ScheduleAssignmentModal } from '@/components/ScheduleAssignmentModal';
import { useScheduling } from '@/hooks/useScheduling';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployeeAvailability } from '@/hooks/useEmployeeAvailability';

export default function Scheduling() {
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTab, setSelectedTab] = useState('calendar');
  
  const { schedules, loading: schedulesLoading } = useScheduling();
  const { employees, loading: employeesLoading } = useEmployees();
  const { availability, loading: availabilityLoading } = useEmployeeAvailability();

  // Calculate stats
  const totalSchedules = schedules.length;
  const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;
  const confirmedCount = schedules.filter(s => s.status === 'confirmed').length;
  const completedCount = schedules.filter(s => s.status === 'completed').length;
  const pendingTimeOff = availability.filter(a => a.status === 'pending').length;

  const handleAddSchedule = (date?: Date) => {
    setSelectedDate(date);
    setShowAddSchedule(true);
  };

  if (schedulesLoading || employeesLoading || availabilityLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading scheduling data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Scheduling</h1>
          <p className="text-muted-foreground">
            Manage employee schedules, assignments, and availability
          </p>
        </div>
        <Button onClick={() => handleAddSchedule()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Schedule
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSchedules}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCount}</div>
            <Badge variant="secondary" className="mt-1">Pending</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
            <Badge variant="default" className="mt-1">Ready</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <Badge variant="outline" className="mt-1">Done</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Off Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTimeOff}</div>
            <Badge variant="destructive" className="mt-1">Pending</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="week">Week View</TabsTrigger>
          <TabsTrigger value="employees">Employee Schedules</TabsTrigger>
          <TabsTrigger value="availability">Time Off Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Calendar</CardTitle>
              <CardDescription>
                View and manage employee schedules in calendar format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleCalendar
                viewMode="calendar"
                onAddSchedule={handleAddSchedule}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Schedule View</CardTitle>
              <CardDescription>
                Week-by-week overview of all employee schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleCalendar
                viewMode="week"
                onAddSchedule={handleAddSchedule}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="grid gap-4">
            {employees.map(employee => (
              <Card key={employee.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {employee.first_name} {employee.last_name}
                      </CardTitle>
                      <CardDescription>
                        {employee.role} - {employee.department}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSchedule()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Schedule
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScheduleCalendar
                    viewMode="week"
                    employeeId={employee.id}
                    onAddSchedule={handleAddSchedule}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Time Off Requests</CardTitle>
              <CardDescription>
                Manage employee availability and time-off requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availability.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No time-off requests found
                  </p>
                ) : (
                  availability.map(request => {
                    const employee = employees.find(e => e.id === request.employee_id);
                    const employeeName = employee 
                      ? `${employee.first_name} ${employee.last_name}` 
                      : 'Unknown Employee';

                    return (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-semibold">{employeeName}</div>
                            <div className="text-sm text-muted-foreground">
                              {request.start_date} to {request.end_date}
                            </div>
                            {request.reason && (
                              <div className="text-sm">Reason: {request.reason}</div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={
                                request.status === 'approved' ? 'default' :
                                request.status === 'denied' ? 'destructive' : 'secondary'
                              }
                            >
                              {request.status}
                            </Badge>
                            {request.status === 'pending' && (
                              <div className="space-x-2">
                                <Button size="sm" variant="outline">
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline">
                                  Deny
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Assignment Modal */}
      <ScheduleAssignmentModal
        open={showAddSchedule}
        onOpenChange={setShowAddSchedule}
        selectedDate={selectedDate}
      />
    </div>
  );
}