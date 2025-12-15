import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  User, 
  MapPin, 
  Calendar, 
  AlertTriangle,
  Edit,
  Save,
  X
} from 'lucide-react';
import { WorkOrder, useWorkOrders } from '@/hooks/useWorkOrders';

interface WorkOrderDetailsModalProps {
  workOrder: WorkOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkOrderDetailsModal({ workOrder, open, onOpenChange }: WorkOrderDetailsModalProps) {
  const { updateWorkOrder } = useWorkOrders();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: workOrder.status || 'Open',
    actual_hours: workOrder.actual_hours?.toString() || '',
    completion_notes: workOrder.completion_notes || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates: Partial<WorkOrder> = {
        status: formData.status,
        actual_hours: formData.actual_hours ? parseFloat(formData.actual_hours) : undefined,
        completion_notes: formData.completion_notes || undefined,
      };

      if (formData.status === 'Completed') {
        updates.completed_date = new Date().toISOString();
      }

      await updateWorkOrder(workOrder.id, updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating work order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      status: workOrder.status || 'Open',
      actual_hours: workOrder.actual_hours?.toString() || '',
      completion_notes: workOrder.completion_notes || '',
    });
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto lg:max-w-[95vw] lg:w-[95vw] lg:h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{workOrder.title}</DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-1" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Status</Label>
              {isEditing ? (
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="mt-1 block w-fit">
                  {workOrder.status}
                </Badge>
              )}
            </div>
            <div className="flex-1">
              <Label>Priority</Label>
              <Badge variant="outline" className="mt-1 block w-fit">
                {workOrder.priority}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {workOrder.description && (
            <div>
              <Label>Description</Label>
              <p className="mt-1 text-sm text-muted-foreground">
                {workOrder.description}
              </p>
            </div>
          )}

          {/* Work Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Type:</span>
              <span>{workOrder.work_type}</span>
            </div>
            
            {workOrder.estimated_hours && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Est. Hours:</span>
                <span>{workOrder.estimated_hours}h</span>
              </div>
            )}
            
            {workOrder.due_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Due:</span>
                <span>{new Date(workOrder.due_date).toLocaleString()}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Actual Hours */}
          <div>
            <Label>Actual Hours</Label>
            {isEditing ? (
              <Input
                type="number"
                step="0.5"
                value={formData.actual_hours}
                onChange={(e) => setFormData(prev => ({ ...prev, actual_hours: e.target.value }))}
                placeholder="Enter actual hours worked"
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm">
                {workOrder.actual_hours ? `${workOrder.actual_hours}h` : 'Not recorded'}
              </p>
            )}
          </div>

          {/* Completion Notes */}
          <div>
            <Label>Completion Notes</Label>
            {isEditing ? (
              <Textarea
                value={formData.completion_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, completion_notes: e.target.value }))}
                placeholder="Add notes about the work completed..."
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                {workOrder.completion_notes || 'No completion notes'}
              </p>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Created:</span>
              <br />
              {new Date(workOrder.created_at).toLocaleString()}
            </div>
            {workOrder.completed_date && (
              <div>
                <span className="font-medium">Completed:</span>
                <br />
                {new Date(workOrder.completed_date).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}