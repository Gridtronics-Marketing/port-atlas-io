import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useRiserPathways } from '@/hooks/useRiserPathways';
import { toast } from 'sonner';

interface AddRiserPathwayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
}

interface PathwayFormData {
  pathway_name: string;
  pathway_type: 'conduit' | 'cable_tray' | 'riser_shaft' | 'plenum' | 'other';
  floors_served: string;
  pathway_capacity?: number;
  utilization_percentage?: number;
  notes?: string;
}

export const AddRiserPathwayModal: React.FC<AddRiserPathwayModalProps> = ({
  open,
  onOpenChange,
  locationId
}) => {
  const { addPathway } = useRiserPathways(locationId);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PathwayFormData>();

  const onSubmit = async (data: PathwayFormData) => {
    try {
      const floorsArray = data.floors_served
        .split(',')
        .map(f => parseInt(f.trim()))
        .filter(f => !isNaN(f));

      await addPathway({
        ...data,
        location_id: locationId,
        floors_served: floorsArray,
        fire_stops: []
      });
      
      toast.success('Riser pathway added successfully');
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding pathway:', error);
      toast.error('Failed to add riser pathway');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Riser Pathway</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="pathway_name">Pathway Name</Label>
            <Input
              id="pathway_name"
              {...register('pathway_name', { required: true })}
              placeholder="e.g. Main Riser Shaft A"
            />
            {errors.pathway_name && <p className="text-sm text-destructive">Pathway name is required</p>}
          </div>

          <div>
            <Label htmlFor="pathway_type">Pathway Type</Label>
            <Select onValueChange={(value) => setValue('pathway_type', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="riser_shaft">Riser Shaft</SelectItem>
                <SelectItem value="cable_tray">Cable Tray</SelectItem>
                <SelectItem value="conduit">Conduit</SelectItem>
                <SelectItem value="plenum">Plenum Space</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.pathway_type && <p className="text-sm text-destructive">Pathway type is required</p>}
          </div>

          <div>
            <Label htmlFor="floors_served">Floors Served</Label>
            <Input
              id="floors_served"
              {...register('floors_served', { required: true })}
              placeholder="e.g. 1,2,3,4,5"
            />
            <p className="text-xs text-muted-foreground">Comma-separated floor numbers</p>
            {errors.floors_served && <p className="text-sm text-destructive">Floors served is required</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pathway_capacity">Capacity (cables)</Label>
              <Input
                id="pathway_capacity"
                type="number"
                {...register('pathway_capacity', { valueAsNumber: true })}
                placeholder="e.g. 50"
              />
            </div>

            <div>
              <Label htmlFor="utilization_percentage">Current Utilization %</Label>
              <Input
                id="utilization_percentage"
                type="number"
                max="100"
                {...register('utilization_percentage', { valueAsNumber: true })}
                placeholder="e.g. 25"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Fire stops, access restrictions, etc..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Pathway</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};