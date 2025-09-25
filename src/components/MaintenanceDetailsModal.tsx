import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, User, MapPin, Wrench, CheckCircle } from 'lucide-react';
import { useMaintenanceScheduling } from '@/hooks/useMaintenanceScheduling';
import { format } from 'date-fns';

interface MaintenanceDetailsModalProps {
  scheduleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MaintenanceDetailsModal: React.FC<MaintenanceDetailsModalProps> = ({
  scheduleId,
  open,
  onOpenChange,
}) => {
  const { schedules, updateScheduleStatus } = useMaintenanceScheduling();
  const [completionNotes, setCompletionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  
  const schedule = schedules.find(s => s.id === scheduleId);

  if (!schedule) {
    return null;
  }

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

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      await updateScheduleStatus(
        schedule.id, 
        newStatus, 
        newStatus === 'completed' ? completionNotes : undefined
      );
      if (newStatus === 'completed') {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {schedule.service_plan?.plan_name || 'Maintenance Schedule'}
            </DialogTitle>
            <Badge className={getStatusColor(schedule.status)}>
              {schedule.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Schedule Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Schedule Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(schedule.scheduled_date), 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
                {schedule.scheduled_time && (
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">{schedule.scheduled_time}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge className={getStatusColor(schedule.status)}>
                    {schedule.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Location & Team
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.location?.name || 'Not specified'}
                  </p>
                  {schedule.location?.address && (
                    <p className="text-xs text-muted-foreground">
                      {schedule.location.address}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Assigned Technician</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.technician 
                      ? `${schedule.technician.first_name} ${schedule.technician.last_name}`
                      : 'Unassigned'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Service Plan Details */}
          {schedule.service_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="h-4 w-4" />
                  Service Plan Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Plan Name</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.service_plan.plan_name}
                  </p>
                  {schedule.service_plan.contract && (
                    <>
                      <p className="text-sm font-medium">Contract</p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.service_plan.contract.title}
                      </p>
                      {schedule.service_plan.contract.client && (
                        <>
                          <p className="text-sm font-medium">Client</p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.service_plan.contract.client.name}
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completion Details */}
          {schedule.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="h-4 w-4" />
                  Completion Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {schedule.completed_at && (
                  <div>
                    <p className="text-sm font-medium">Completed At</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(schedule.completed_at), 'MMMM dd, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                )}
                {schedule.completion_notes && (
                  <div>
                    <p className="text-sm font-medium">Completion Notes</p>
                    <p className="text-sm text-muted-foreground">{schedule.completion_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Section */}
          {schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {schedule.status === 'scheduled' && (
                  <Button 
                    onClick={() => handleStatusUpdate('in-progress')}
                    disabled={loading}
                    className="w-full"
                  >
                    Start Maintenance
                  </Button>
                )}
                
                {schedule.status === 'in-progress' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="completion_notes">Completion Notes</Label>
                      <Textarea
                        id="completion_notes"
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        placeholder="Enter details about the maintenance work completed..."
                        rows={4}
                      />
                    </div>
                    <Button 
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={loading}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </Button>
                  </>
                )}

                <Button 
                  variant="outline" 
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={loading}
                  className="w-full"
                >
                  Cancel Maintenance
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};