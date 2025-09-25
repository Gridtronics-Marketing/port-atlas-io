import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useDropdownOptions } from '@/hooks/useDropdownOptions';

interface DropdownOptionFormProps {
  option?: any;
  defaultCategory?: string;
  onClose: () => void;
}

export const DropdownOptionForm = ({ option, defaultCategory, onClose }: DropdownOptionFormProps) => {
  const { addOption, updateOption } = useDropdownOptions();
  const [formData, setFormData] = useState({
    category: defaultCategory || '',
    option_key: '',
    option_value: '',
    display_name: '',
    sort_order: 0,
    is_active: true,
    metadata: {},
  });

  useEffect(() => {
    if (option) {
      setFormData({
        category: option.category || '',
        option_key: option.option_key || '',
        option_value: option.option_value || '',
        display_name: option.display_name || '',
        sort_order: option.sort_order || 0,
        is_active: option.is_active ?? true,
        metadata: option.metadata || {},
      });
    }
  }, [option]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (option) {
      await updateOption(option.id, formData);
    } else {
      await addOption(formData);
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
            placeholder="e.g., cable_types"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="option_key">Option Key</Label>
          <Input
            id="option_key"
            value={formData.option_key}
            onChange={(e) => setFormData({ ...formData, option_key: e.target.value })}
            placeholder="e.g., fiber_singlemode"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name">Display Name</Label>
        <Input
          id="display_name"
          value={formData.display_name}
          onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          placeholder="e.g., Fiber - Single Mode"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="option_value">Option Value</Label>
        <Input
          id="option_value"
          value={formData.option_value}
          onChange={(e) => setFormData({ ...formData, option_value: e.target.value })}
          placeholder="Value used in the application"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort_order">Sort Order</Label>
        <Input
          id="sort_order"
          type="number"
          value={formData.sort_order}
          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
          placeholder="0"
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
          {option ? 'Update' : 'Add'} Option
        </Button>
      </div>
    </form>
  );
};