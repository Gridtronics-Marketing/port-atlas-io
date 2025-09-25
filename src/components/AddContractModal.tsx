import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContracts } from '@/hooks/useContracts';
import { useClients } from '@/hooks/useClients';
import { useConfigurableDropdown } from '@/hooks/useConfigurableDropdown';

interface AddContractModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddContractModal: React.FC<AddContractModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { createContract } = useContracts();
  const { clients } = useClients();
  const { options: contractTypes } = useConfigurableDropdown('contract_type');
  const { options: billingFrequencies } = useConfigurableDropdown('billing_frequency');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: '',
    contract_number: '',
    contract_type: 'maintenance',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    contract_value: '',
    billing_frequency: 'monthly',
    terms_and_conditions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createContract({
        ...formData,
        contract_value: parseFloat(formData.contract_value) || 0,
        status: 'draft',
      });
      
      // Reset form
      setFormData({
        client_id: '',
        contract_number: '',
        contract_type: 'maintenance',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        contract_value: '',
        billing_frequency: 'monthly',
        terms_and_conditions: '',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating contract:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Contract</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_number">Contract Number *</Label>
              <Input
                id="contract_number"
                value={formData.contract_number}
                onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
                placeholder="e.g., CNT-2024-001"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Contract Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Network Maintenance Agreement"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief description of the contract"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_type">Contract Type</Label>
              <Select value={formData.contract_type} onValueChange={(value) => setFormData({...formData, contract_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type.key} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_frequency">Billing Frequency</Label>
              <Select value={formData.billing_frequency} onValueChange={(value) => setFormData({...formData, billing_frequency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billingFrequencies.map((freq) => (
                    <SelectItem key={freq.key} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_value">Contract Value *</Label>
              <Input
                id="contract_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.contract_value}
                onChange={(e) => setFormData({...formData, contract_value: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
            <Textarea
              id="terms_and_conditions"
              value={formData.terms_and_conditions}
              onChange={(e) => setFormData({...formData, terms_and_conditions: e.target.value})}
              placeholder="Contract terms and conditions"
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};