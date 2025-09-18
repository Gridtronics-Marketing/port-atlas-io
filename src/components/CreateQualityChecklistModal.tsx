import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { useChecklistManagement, QualityChecklistItem } from '@/hooks/useChecklistManagement';

interface CreateQualityChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChecklistFormData {
  name: string;
  description: string;
  category: 'general' | 'installation' | 'testing' | 'documentation' | 'handover';
}

interface ItemData {
  title: string;
  description: string;
  category: 'quality' | 'performance' | 'documentation' | 'compliance';
  is_required: boolean;
  sort_order: number;
}

export const CreateQualityChecklistModal: React.FC<CreateQualityChecklistModalProps> = ({
  open,
  onOpenChange
}) => {
  const { createQualityChecklist } = useChecklistManagement();

  const [formData, setFormData] = useState<ChecklistFormData>({
    name: '',
    description: '',
    category: 'general',
  });

  const [items, setItems] = useState<ItemData[]>([
    { title: '', description: '', category: 'quality', is_required: false, sort_order: 0 }
  ]);

  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([...items, { title: '', description: '', category: 'quality', is_required: false, sort_order: items.length }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ItemData, value: any) => {
    setItems(items.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < items.length) {
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
      // Update sort_order for all items
      const reorderedItems = newItems.map((item, i) => ({ ...item, sort_order: i }));
      setItems(reorderedItems);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    const validItems = items.filter(item => item.title.trim());
    if (validItems.length === 0) {
      return;
    }

    setLoading(true);

    const result = await createQualityChecklist(
      {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        is_active: true,
      },
      validItems
    );

    if (result) {
      // Reset form
      setFormData({ name: '', description: '', category: 'general' });
      setItems([{ title: '', description: '', category: 'quality', is_required: false, sort_order: 0 }]);
      onOpenChange(false);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quality Checklist</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Checklist Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Network Installation QA"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: 'general' | 'installation' | 'testing' | 'documentation' | 'handover') =>
                    setFormData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="handover">Handover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this checklist's purpose..."
                rows={2}
              />
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Checklist Items</h3>
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        Item {index + 1}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === items.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => updateItem(index, 'title', e.target.value)}
                          placeholder="e.g., Verify cable labeling"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={item.category}
                          onValueChange={(value: 'quality' | 'performance' | 'documentation' | 'compliance') =>
                            updateItem(index, 'category', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quality">Quality</SelectItem>
                            <SelectItem value="performance">Performance</SelectItem>
                            <SelectItem value="documentation">Documentation</SelectItem>
                            <SelectItem value="compliance">Compliance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Additional details or instructions..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${index}`}
                        checked={item.is_required}
                        onCheckedChange={(checked) => updateItem(index, 'is_required', checked)}
                      />
                      <Label htmlFor={`required-${index}`} className="text-sm">
                        Required item
                      </Label>
                      {item.is_required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Checklist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};