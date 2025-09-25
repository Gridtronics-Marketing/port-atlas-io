import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useSystemConfigurations } from '@/hooks/useSystemConfigurations';

interface SystemConfigurationFormProps {
  configuration?: any;
  onClose: () => void;
}

export const SystemConfigurationForm = ({ configuration, onClose }: SystemConfigurationFormProps) => {
  const { addConfiguration, updateConfiguration } = useSystemConfigurations();
  const [formData, setFormData] = useState({
    category: '',
    key: '',
    value: '',
    data_type: 'string' as const,
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (configuration) {
      setFormData({
        category: configuration.category || '',
        key: configuration.key || '',
        value: configuration.value || '',
        data_type: configuration.data_type || 'string',
        description: configuration.description || '',
        is_active: configuration.is_active ?? true,
      });
    }
  }, [configuration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (configuration) {
      await updateConfiguration(configuration.id, formData);
    } else {
      await addConfiguration(formData);
    }
    
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., email, notifications"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="key">Key</Label>
          <Input
            id="key"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="e.g., smtp_host"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Value</Label>
        <Input
          id="value"
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          placeholder="Configuration value"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="data_type">Data Type</Label>
        <Select
          value={formData.data_type}
          onValueChange={(value) => setFormData({ ...formData, data_type: value as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="string">String</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="boolean">Boolean</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this configuration does"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          {configuration ? 'Update' : 'Add'} Configuration
        </Button>
      </div>
    </form>
  );
};