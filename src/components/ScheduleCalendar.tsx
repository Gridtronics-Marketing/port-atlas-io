import React, { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus, User, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { useScheduling, EmployeeSchedule } from '@/hooks/useScheduling';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useLocations } from '@/hooks/useLocations';

interface ScheduleCalendarProps {
  onAddSchedule?: (date: Date) => void;
  employeeId?: string;
  viewMode?: 'calendar' | 'week' | 'day';
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  onAddSchedule,
  employeeId,
  viewMode = 'week'
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  
  const { schedules, loading } = useScheduling();
  const { employees } = useEmployees();
  const { projects } = useProjects();
  const { locations } = useLocations();

  // Filter schedules based on current view and employee
  const filteredSchedules = useMemo(() => {
    let filtered = schedules;
    
    if (employeeId) {
      filtered = filtered.filter(s => s.employee_id === employeeId);
    }
    
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentWeek);
      const weekEnd = endOfWeek(currentWeek);
      filtered = filtered.filter(s => {
        const scheduleDate = new Date(s.schedule_date);
        return scheduleDate >= weekStart && scheduleDate <= weekEnd;
      });
    }
    
    return filtered;
  }, [schedules, employeeId, viewMode, currentWeek]);

  // Group schedules by date
  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, EmployeeSchedule[]> = {};
    filteredSchedules.forEach(schedule => {
      const dateKey = schedule.schedule_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(schedule);
    });
    return grouped;
  }, [filteredSchedules]);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const getLocationName = (locationId?: string) => {
    if (!locationId) return null;
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentWeek);
    const weekEnd = endOfWeek(currentWeek);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Week of {format(weekStart, 'MMM d, yyyy')}
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {weekDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const daySchedules = schedulesByDate[dateKey] || [];
            
            return (
              <Card key={dateKey} className="min-h-[200px]">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {format(day, 'EEE d')}
                    </CardTitle>
                    {onAddSchedule && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddSchedule(day)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {daySchedules.map(schedule => (
                    <div
                      key={schedule.id}
                      className={cn(
                        "p-2 rounded-md text-xs space-y-1",
                        getStatusColor(schedule.status)
                      )}
                    >
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{schedule.start_time} - {schedule.end_time}</span>
                      </div>
                      
                      {!employeeId && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span className="truncate">
                            {getEmployeeName(schedule.employee_id)}
                          </span>
                        </div>
                      )}
                      
                      {schedule.location_id && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {getLocationName(schedule.location_id)}
                          </span>
                        </div>
                      )}
                      
                      {schedule.project_id && (
                        <div className="text-xs opacity-70 truncate">
                          {getProjectName(schedule.project_id)}
                        </div>
                      )}
                      
                      <Badge variant="secondary" className="text-xs">
                        {schedule.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              modifiers={{
                hasSchedule: (date) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  return !!schedulesByDate[dateKey]?.length;
                }
              }}
              modifiersStyles={{
                hasSchedule: { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </CardTitle>
              {onAddSchedule && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddSchedule(selectedDate)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const dateKey = format(selectedDate, 'yyyy-MM-dd');
                const daySchedules = schedulesByDate[dateKey] || [];
                
                if (daySchedules.length === 0) {
                  return (
                    <p className="text-muted-foreground text-sm">
                      No schedules for this day
                    </p>
                  );
                }
                
                return daySchedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                      </div>
                      <Badge className={getStatusColor(schedule.status)}>
                        {schedule.status}
                      </Badge>
                    </div>
                    
                    {!employeeId && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{getEmployeeName(schedule.employee_id)}</span>
                      </div>
                    )}
                    
                    {schedule.location_id && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{getLocationName(schedule.location_id)}</span>
                      </div>
                    )}
                    
                    {schedule.project_id && (
                      <div className="text-sm text-muted-foreground">
                        Project: {getProjectName(schedule.project_id)}
                      </div>
                    )}
                    
                    {schedule.notes && (
                      <div className="text-sm text-muted-foreground">
                        Notes: {schedule.notes}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading schedules...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'calendar' && renderCalendarView()}
    </div>
  );
};