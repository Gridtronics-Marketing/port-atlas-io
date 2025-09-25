import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useContracts } from '@/hooks/useContracts';
import { useLocations } from '@/hooks/useLocations';
import { useConfigurableDropdown } from '@/hooks/useConfigurableDropdown';

interface ServicePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServicePlanModal: React.FC<ServicePlanModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { contracts, createServicePlan } = useContracts();
  const { locations } = useLocations();
  const { options: serviceFrequencies } = useConfigurableDropdown('service_frequency');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    contract_id: '',
    plan_name: '',
    description: '',
    service_frequency: 'monthly',
    service_duration_hours: 4,
    equipment_covered: [] as string[],
    locations_covered: [] as string[],
  });

  const activeContracts = contracts.filter(c => c.status === 'active');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createServicePlan({
        ...formData,
        is_active: true,
      });
      
      // Reset form
      setFormData({
        contract_id: '',
        plan_name: '',
        description: '',
        service_frequency: 'monthly',
        service_duration_hours: 4,
        equipment_covered: [],
        locations_covered: [],
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating service plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationToggle = (locationId: string) => {
    setFormData(prev => ({
      ...prev,
      locations_covered: prev.locations_covered.includes(locationId)
        ? prev.locations_covered.filter(id => id !== locationId)
        : [...prev.locations_covered, locationId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Service Plan</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract_id">Contract *</Label>
            <Select value={formData.contract_id} onValueChange={(value) => setFormData({...formData, contract_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select contract" />
              </SelectTrigger>
              <SelectContent>
                {activeContracts.map((contract) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.title} (#{contract.contract_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan_name">Plan Name *</Label>
            <Input
              id="plan_name"
              value={formData.plan_name}
              onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
              placeholder="e.g., Monthly Network Maintenance"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what this service plan covers"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service_frequency">Service Frequency</Label>
              <Select value={formData.service_frequency} onValueChange={(value) => setFormData({...formData, service_frequency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceFrequencies.map((freq) => (
                    <SelectItem key={freq.key} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_duration_hours">Duration (Hours)</Label>
              <Input
                id="service_duration_hours"
                type="number"
                min="1"
                max="24"
                value={formData.service_duration_hours}
                onChange={(e) => setFormData({...formData, service_duration_hours: parseInt(e.target.value) || 4})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Locations Covered</Label>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${location.id}`}
                    checked={formData.locations_covered.includes(location.id)}
                    onCheckedChange={() => handleLocationToggle(location.id)}
                  />
                  <Label 
                    htmlFor={`location-${location.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {location.name} - {location.address}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipment_covered">Equipment Covered</Label>
            <Textarea
              id="equipment_covered"
              value={formData.equipment_covered.join('\n')}
              onChange={(e) => setFormData({
                ...formData, 
                equipment_covered: e.target.value.split('\n').filter(item => item.trim())
              })}
              placeholder="List equipment covered (one per line)&#10;e.g., Network Switches&#10;Patch Panels&#10;Servers"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              List each piece of equipment on a separate line
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Service Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};