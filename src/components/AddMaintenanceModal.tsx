import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMaintenanceScheduling } from '@/hooks/useMaintenanceScheduling';
import { useContracts } from '@/hooks/useContracts';
import { useLocations } from '@/hooks/useLocations';
import { useEmployees } from '@/hooks/useEmployees';

interface AddMaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddMaintenanceModal: React.FC<AddMaintenanceModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { createMaintenanceSchedule } = useMaintenanceScheduling();
  const { servicePlans } = useContracts();
  const { locations } = useLocations();
  const { employees } = useEmployees();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    service_plan_id: '',
    location_id: '',
    scheduled_date: '',
    scheduled_time: '',
    assigned_technician_id: '',
  });

  const activeServicePlans = servicePlans.filter(sp => sp.is_active);
  const technicians = employees.filter(emp => emp.role === 'Technician' && emp.status === 'Active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createMaintenanceSchedule({
        ...formData,
        status: 'scheduled',
      });
      
      // Reset form
      setFormData({
        service_plan_id: '',
        location_id: '',
        scheduled_date: '',
        scheduled_time: '',
        assigned_technician_id: '',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating maintenance schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service_plan_id">Service Plan *</Label>
            <Select value={formData.service_plan_id} onValueChange={(value) => setFormData({...formData, service_plan_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select service plan" />
              </SelectTrigger>
              <SelectContent>
                {activeServicePlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.plan_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_id">Location</Label>
            <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Time</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_technician_id">Assigned Technician</Label>
            <Select value={formData.assigned_technician_id} onValueChange={(value) => setFormData({...formData, assigned_technician_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((technician) => (
                  <SelectItem key={technician.id} value={technician.id}>
                    {technician.first_name} {technician.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Maintenance'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};