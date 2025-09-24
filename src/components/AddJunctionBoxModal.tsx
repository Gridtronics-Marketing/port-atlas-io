import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useJunctionBoxes } from '@/hooks/useJunctionBoxes';
import { useToast } from '@/hooks/use-toast';

interface AddJunctionBoxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  cableId: string;
  onSuccess?: () => void;
}

interface JunctionFormData {
  junction_type: 'splice' | 'patch_panel' | 'junction_box';
  floor: number;
  label: string;
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
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<JunctionFormData>({
    defaultValues: {
      junction_type: 'junction_box',
      floor: 1,
      label: '',
      notes: ''
    }
  });

  const onSubmit = async (data: JunctionFormData) => {
    try {
      setIsSubmitting(true);
      await addJunctionBox({
        ...data,
        location_id: locationId,
        backbone_cable_id: cableId
      });
      
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