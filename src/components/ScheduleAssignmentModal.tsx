import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useScheduling } from '@/hooks/useScheduling';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useLocations } from '@/hooks/useLocations';
import { useWorkOrders } from '@/hooks/useWorkOrders';

interface ScheduleAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  employeeId?: string;
}

interface FormData {
  employee_id: string;
  project_id: string;
  location_id: string;
  work_order_id: string;
  schedule_date: Date | undefined;
  start_time: string;
  end_time: string;
  schedule_type: 'assignment' | 'template' | 'time_off';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
}

export const ScheduleAssignmentModal: React.FC<ScheduleAssignmentModalProps> = ({
  open,
  onOpenChange,
  selectedDate,
  employeeId
}) => {
  const { addSchedule } = useScheduling();
  const { employees } = useEmployees();
  const { projects } = useProjects();
  const { locations } = useLocations();
  const { workOrders } = useWorkOrders();

  const [formData, setFormData] = useState<FormData>({
    employee_id: employeeId || '',
    project_id: 'none',
    location_id: 'none',
    work_order_id: 'none',
    schedule_date: selectedDate,
    start_time: '09:00',
    end_time: '17:00',
    schedule_type: 'assignment',
    status: 'scheduled',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.schedule_date || !formData.start_time || !formData.end_time) {
      return;
    }

    setLoading(true);

    const scheduleData = {
      employee_id: formData.employee_id,
      project_id: formData.project_id && formData.project_id !== 'none' ? formData.project_id : undefined,
      location_id: formData.location_id && formData.location_id !== 'none' ? formData.location_id : undefined,
      work_order_id: formData.work_order_id && formData.work_order_id !== 'none' ? formData.work_order_id : undefined,
      schedule_date: format(formData.schedule_date, 'yyyy-MM-dd'),
      start_time: formData.start_time,
      end_time: formData.end_time,
      schedule_type: formData.schedule_type,
      status: formData.status,
      notes: formData.notes || undefined,
    };

    const result = await addSchedule(scheduleData);
    
    if (result) {
      // Reset form
      setFormData({
        employee_id: employeeId || '',
        project_id: 'none',
        location_id: 'none', 
        work_order_id: 'none',
        schedule_date: selectedDate,
        start_time: '09:00',
        end_time: '17:00',
        schedule_type: 'assignment',
        status: 'scheduled',
        notes: '',
      });
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Schedule Assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) => handleInputChange('employee_id', value)}
                disabled={!!employeeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule_date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.schedule_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon />
                    {formData.schedule_date ? format(formData.schedule_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.schedule_date}
                    onSelect={(date) => handleInputChange('schedule_date', date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule_type">Type</Label>
              <Select
                value={formData.schedule_type}
                onValueChange={(value: 'assignment' | 'template' | 'time_off') => 
                  handleInputChange('schedule_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="time_off">Time Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'scheduled' | 'confirmed' | 'completed' | 'cancelled') => 
                  handleInputChange('status', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Job (Optional)</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => handleInputChange('project_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Select
              value={formData.location_id}
              onValueChange={(value) => handleInputChange('location_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Location</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_order">Work Order (Optional)</Label>
            <Select
              value={formData.work_order_id}
              onValueChange={(value) => handleInputChange('work_order_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select work order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Work Order</SelectItem>
                {workOrders.map((workOrder) => (
                  <SelectItem key={workOrder.id} value={workOrder.id}>
                    {workOrder.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};