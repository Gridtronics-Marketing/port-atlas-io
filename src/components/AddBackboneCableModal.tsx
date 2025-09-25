import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfigurableSelect } from '@/components/ui/configurable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useBackboneCables } from '@/hooks/useBackboneCables';
import { toast } from 'sonner';

interface AddBackboneCableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  onSuccess?: () => void;
}

interface CableFormData {
  cable_type: 'fiber' | 'copper' | 'coax';
  cable_subtype?: string;
  strand_count?: number;
  pair_count?: number;
  jacket_rating?: 'plenum' | 'riser' | 'LSZH';
  origin_floor?: number;
  destination_floor?: number;
  origin_equipment?: string;
  destination_equipment?: string;
  cable_label: string;
  unique_id?: string;
  capacity_total?: number;
  notes?: string;
}

export const AddBackboneCableModal: React.FC<AddBackboneCableModalProps> = ({
  open,
  onOpenChange,
  locationId,
  onSuccess
}) => {
  const { addCable } = useBackboneCables(locationId);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CableFormData>();

  const cableType = watch('cable_type');

  const onSubmit = async (data: CableFormData) => {
    try {
      await addCable({
        ...data,
        location_id: locationId,
        labeling_standard: 'TIA-606',
        capacity_used: 0,
        test_results: {}
      });
      
      toast.success('Backbone cable added successfully');
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding cable:', error);
      toast.error('Failed to add backbone cable');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Backbone Cable</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cable_type">Cable Type</Label>
              <ConfigurableSelect
                category="cable_types"
                onValueChange={(value) => setValue('cable_type', value as 'fiber' | 'copper' | 'coax')}
                placeholder="Select type"
              />
              {errors.cable_type && <p className="text-sm text-destructive">Cable type is required</p>}
            </div>

            <div>
              <Label htmlFor="cable_label">Cable Label</Label>
              <Input
                id="cable_label"
                {...register('cable_label', { required: true })}
                placeholder="e.g. FB-001"
              />
              {errors.cable_label && <p className="text-sm text-destructive">Cable label is required</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="cable_subtype">Cable Subtype</Label>
            <Input
              id="cable_subtype"
              {...register('cable_subtype')}
              placeholder="e.g. OM3, Cat6A, RG-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {cableType === 'fiber' && (
              <div>
                <Label htmlFor="strand_count">Strand Count</Label>
                <Input
                  id="strand_count"
                  type="number"
                  {...register('strand_count', { valueAsNumber: true })}
                  placeholder="e.g. 12"
                />
              </div>
            )}
            
            {cableType === 'copper' && (
              <div>
                <Label htmlFor="pair_count">Pair Count</Label>
                <Input
                  id="pair_count"
                  type="number"
                  {...register('pair_count', { valueAsNumber: true })}
                  placeholder="e.g. 25"
                />
              </div>
            )}

            <div>
              <Label htmlFor="jacket_rating">Jacket Rating</Label>
              <ConfigurableSelect
                category="jacket_ratings"
                onValueChange={(value) => setValue('jacket_rating', value as 'plenum' | 'riser' | 'LSZH')}
                placeholder="Select rating"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin_floor">Origin Floor</Label>
              <Input
                id="origin_floor"
                type="number"
                {...register('origin_floor', { valueAsNumber: true })}
                placeholder="e.g. 1"
              />
            </div>

            <div>
              <Label htmlFor="destination_floor">Destination Floor</Label>
              <Input
                id="destination_floor"
                type="number"
                {...register('destination_floor', { valueAsNumber: true })}
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin_equipment">Origin Equipment</Label>
              <Input
                id="origin_equipment"
                {...register('origin_equipment')}
                placeholder="e.g. MDF-01"
              />
            </div>

            <div>
              <Label htmlFor="destination_equipment">Destination Equipment</Label>
              <Input
                id="destination_equipment"
                {...register('destination_equipment')}
                placeholder="e.g. IDF-05"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="capacity_total">Total Capacity</Label>
              <Input
                id="capacity_total"
                type="number"
                {...register('capacity_total', { valueAsNumber: true })}
                placeholder="e.g. 48"
              />
            </div>

            <div>
              <Label htmlFor="unique_id">Unique ID</Label>
              <Input
                id="unique_id"
                {...register('unique_id')}
                placeholder="Optional system ID"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this cable run..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Cable</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};