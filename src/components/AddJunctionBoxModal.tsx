import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useJunctionBoxes } from '@/hooks/useJunctionBoxes';
import { useBackboneCables } from '@/hooks/useBackboneCables';
import { useToast } from '@/hooks/use-toast';

interface AddJunctionBoxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  cableId: string | null;
  onSuccess?: () => void;
}

interface JunctionFormData {
  junction_type: 'splice' | 'patch_panel' | 'junction_box';
  floor: number;
  label: string;
  backbone_cable_id?: string;
  notes?: string;
}

export const AddJunctionBoxModal = ({ 
  open, 
  onOpenChange, 
  locationId, 
  cableId,
  onSuccess 
}: AddJunctionBoxModalProps) => {
  const { addJunctionBox } = useJunctionBoxes();
  const { cables } = useBackboneCables(locationId);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<JunctionFormData>({
    defaultValues: {
      junction_type: 'junction_box',
      floor: 1,
      label: '',
      backbone_cable_id: cableId || undefined,
      notes: ''
    }
  });

  const onSubmit = async (data: JunctionFormData) => {
    try {
      setIsSubmitting(true);
      const junctionData = {
        ...data,
        location_id: locationId,
        ...(data.backbone_cable_id && { backbone_cable_id: data.backbone_cable_id })
      };
      await addJunctionBox(junctionData);
      
      toast({
        title: "Success",
        description: "Junction box added successfully",
      });
      
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add junction box",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Junction Box</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="junction_type">Junction Type</Label>
            <Select 
              onValueChange={(value) => setValue('junction_type', value as any)}
              defaultValue="junction_box"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="junction_box">Junction Box</SelectItem>
                <SelectItem value="splice">Splice</SelectItem>
                <SelectItem value="patch_panel">Patch Panel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="floor">Floor</Label>
            <Input
              id="floor"
              type="number"
              {...register('floor', { 
                required: true,
                min: 1,
                valueAsNumber: true 
              })}
            />
          </div>

          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              {...register('label', { required: true })}
              placeholder="JB-01, SP-01, etc."
            />
          </div>

          <div>
            <Label htmlFor="backbone_cable_id">Associated Cable (Optional)</Label>
            <Select 
              onValueChange={(value) => setValue('backbone_cable_id', value === 'none' ? undefined : value)}
              defaultValue={cableId || 'none'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a cable or leave unassociated" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No cable association</SelectItem>
                {cables.map(cable => (
                  <SelectItem key={cable.id} value={cable.id}>
                    {cable.cable_label} - {cable.cable_type.toUpperCase()} 
                    {cable.origin_equipment && cable.destination_equipment && 
                      ` (${cable.origin_equipment} → ${cable.destination_equipment})`
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Junction boxes can be created independently or associated with a specific cable run.
            </p>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Junction Box'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};