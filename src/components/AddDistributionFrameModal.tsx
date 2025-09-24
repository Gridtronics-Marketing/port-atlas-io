import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useDistributionFrames } from '@/hooks/useDistributionFrames';
import { toast } from 'sonner';

interface AddDistributionFrameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
}

interface FrameFormData {
  frame_type: 'MDF' | 'IDF';
  floor: number;
  room?: string;
  rack_position?: number;
  port_count: number;
  capacity: number;
  notes?: string;
}

export const AddDistributionFrameModal: React.FC<AddDistributionFrameModalProps> = ({
  open,
  onOpenChange,
  locationId
}) => {
  const { addFrame } = useDistributionFrames(locationId);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FrameFormData>();

  const frameType = watch('frame_type');

  const onSubmit = async (data: FrameFormData) => {
    try {
      await addFrame({
        ...data,
        location_id: locationId,
        equipment_details: {},
        patch_panels: []
      });
      
      toast.success('Distribution frame added successfully');
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding frame:', error);
      toast.error('Failed to add distribution frame');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Distribution Frame</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="frame_type">Frame Type</Label>
              <Select onValueChange={(value) => setValue('frame_type', value as 'MDF' | 'IDF')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MDF">MDF (Main Distribution Frame)</SelectItem>
                  <SelectItem value="IDF">IDF (Intermediate Distribution Frame)</SelectItem>
                </SelectContent>
              </Select>
              {errors.frame_type && <p className="text-sm text-destructive">Frame type is required</p>}
            </div>

            <div>
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                type="number"
                {...register('floor', { required: true, valueAsNumber: true })}
                placeholder="e.g. 1"
              />
              {errors.floor && <p className="text-sm text-destructive">Floor is required</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="room">Room/Location</Label>
            <Input
              id="room"
              {...register('room')}
              placeholder="e.g. Telecom Room A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="port_count">Port Count</Label>
              <Input
                id="port_count"
                type="number"
                {...register('port_count', { required: true, valueAsNumber: true })}
                placeholder="e.g. 48"
              />
              {errors.port_count && <p className="text-sm text-destructive">Port count is required</p>}
            </div>

            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                {...register('capacity', { required: true, valueAsNumber: true })}
                placeholder="e.g. 96"
              />
              {errors.capacity && <p className="text-sm text-destructive">Capacity is required</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="rack_position">Rack Position (Optional)</Label>
            <Input
              id="rack_position"
              type="number"
              {...register('rack_position', { valueAsNumber: true })}
              placeholder="e.g. 42 (rack units)"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this frame..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Frame</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};