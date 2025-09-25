import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, MoveUp, MoveDown, Building2, Zap } from 'lucide-react';
import { EquipmentItem } from '@/hooks/useEquipmentList';

interface PathStep {
  id: string;
  equipment: string;
  floor?: number;
  equipmentType?: string;
}

interface PathBuilderStepProps {
  steps: PathStep[];
  onStepsChange: (steps: PathStep[]) => void;
  availableEquipment: EquipmentItem[];
  disabled?: boolean;
}

export const PathBuilderStep = ({ 
  steps, 
  onStepsChange, 
  availableEquipment,
  disabled = false 
}: PathBuilderStepProps) => {
  
  const addStep = () => {
    const newStep: PathStep = {
      id: Math.random().toString(36).substr(2, 9),
      equipment: ''
    };
    onStepsChange([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onStepsChange(newSteps);
  };

  const updateStep = (index: number, equipment: string) => {
    const selectedEquipment = availableEquipment.find(eq => eq.label === equipment);
    const newSteps = [...steps];
    newSteps[index] = {
      ...newSteps[index],
      equipment,
      floor: selectedEquipment?.floor,
      equipmentType: selectedEquipment?.type
    };
    onStepsChange(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      onStepsChange(newSteps);
    }
  };

  const getEquipmentIcon = (type?: string) => {
    switch (type) {
      case 'distribution_frame':
        return <Building2 className="h-4 w-4" />;
      case 'junction_box':
        return <Zap className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getFloorEquipment = (floor?: number) => {
    if (!floor) return availableEquipment;
    return availableEquipment.filter(eq => eq.floor === floor);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Cable Path</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStep}
              disabled={disabled}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Stop
            </Button>
          </div>

          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Click "Add Stop" to create intermediate stops in your cable path
            </p>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {index + 2}
                    </Badge>
                    {getEquipmentIcon(step.equipmentType)}
                  </div>

                  <Select
                    value={step.equipment}
                    onValueChange={(value) => updateStep(index, value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select intermediate equipment" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border shadow-md">
                      {getFloorEquipment(step.floor).map((equipment) => (
                        <SelectItem key={equipment.id} value={equipment.label}>
                          <div className="flex items-center gap-2">
                            {getEquipmentIcon(equipment.type)}
                            <span>{equipment.label}</span>
                            <Badge variant="outline" className="text-xs">
                              Floor {equipment.floor}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStep(index, 'up')}
                      disabled={disabled || index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStep(index, 'down')}
                      disabled={disabled || index === steps.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(index)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {steps.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Path Preview:</strong> Origin → {steps.map(s => s.equipment || 'Unselected').join(' → ')} → Destination
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};