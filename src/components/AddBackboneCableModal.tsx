import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfigurableSelect } from '@/components/ui/configurable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useBackboneCables } from '@/hooks/useBackboneCables';
import { useEquipmentList } from '@/hooks/useEquipmentList';
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
  const { equipment, loading: equipmentLoading, getEquipmentByFloor, findPathSuggestions, generateCableLabel } = useEquipmentList(locationId);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CableFormData>();

  const cableType = watch('cable_type');
  const originFloor = watch('origin_floor');
  const destinationFloor = watch('destination_floor');
  const cableLabel = watch('cable_label');

  const originEquipment = getEquipmentByFloor(originFloor);
  const destinationEquipment = getEquipmentByFloor(destinationFloor);
  const pathSuggestions = findPathSuggestions(originFloor, destinationFloor);

  // Auto-generate cable label when floors or type change
  useEffect(() => {
    if (originFloor && destinationFloor && cableType && !cableLabel) {
      const autoLabel = generateCableLabel(originFloor, destinationFloor, cableType);
      setValue('cable_label', autoLabel);
    }
  }, [originFloor, destinationFloor, cableType, cableLabel, setValue, generateCableLabel]);

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
              <Select 
                onValueChange={(value) => setValue('origin_equipment', value)}
                disabled={!originFloor || equipmentLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !originFloor ? "Select origin floor first" : 
                    equipmentLoading ? "Loading equipment..." :
                    "Select origin equipment"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-md">
                  {originEquipment.map((item) => (
                    <SelectItem key={item.id} value={item.label}>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === 'distribution_frame' ? 'default' : 'secondary'} className="text-xs">
                          {item.equipment_type || item.junction_type}
                        </Badge>
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="destination_equipment">Destination Equipment</Label>
              <Select 
                onValueChange={(value) => setValue('destination_equipment', value)}
                disabled={!destinationFloor || equipmentLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !destinationFloor ? "Select destination floor first" : 
                    equipmentLoading ? "Loading equipment..." :
                    "Select destination equipment"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-md">
                  {destinationEquipment.map((item) => (
                    <SelectItem key={item.id} value={item.label}>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === 'distribution_frame' ? 'default' : 'secondary'} className="text-xs">
                          {item.equipment_type || item.junction_type}
                        </Badge>
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {pathSuggestions.length > 0 && (
            <Card className="border-accent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Suggested Path Route
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Floor {originFloor}</span>
                  {pathSuggestions.map((suggestion, index) => (
                    <React.Fragment key={suggestion.id}>
                      <ArrowRight className="h-3 w-3" />
                      <Badge variant="outline" className="text-xs">
                        {suggestion.label}
                      </Badge>
                    </React.Fragment>
                  ))}
                  <ArrowRight className="h-3 w-3" />
                  <span>Floor {destinationFloor}</span>
                </div>
                <div className="flex items-start gap-2 mt-2 p-2 bg-muted rounded text-xs">
                  <AlertCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Consider routing through the suggested junction boxes for optimal cable management.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

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