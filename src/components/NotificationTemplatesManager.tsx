import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Mail, Trash2, Edit, Eye, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationTemplates } from '@/hooks/useNotificationTemplates';

export const NotificationTemplatesManager = () => {
  const { toast } = useToast();
  const { templates, loading, addTemplate, updateTemplate, deleteTemplate } = useNotificationTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    template_name: '',
    template_type: 'email',
    subject_template: '',
    body_template: '',
    variables: {} as any,
    is_active: true
  });

  const handleAdd = () => {
    setSelectedTemplate(null);
    setFormData({
      template_name: '',
      template_type: 'email',
      subject_template: '',
      body_template: '',
      variables: {},
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setFormData({
      template_name: template.template_name,
      template_type: template.template_type,
      subject_template: template.subject_template || '',
      body_template: template.body_template,
      variables: template.variables || {},
      is_active: template.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.template_name.trim() || !formData.body_template.trim()) {
      toast({
        title: "Error",
        description: "Template name and body are required",
        variant: "destructive"
      });
      return;
    }

    try {
      if (selectedTemplate) {
        await updateTemplate(selectedTemplate.id, formData);
        toast({
          title: "Success",
          description: "Template updated successfully"
        });
      } else {
        await addTemplate(formData);
        toast({
          title: "Success", 
          description: "Template created successfully"
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the template "${name}"?`)) {
      try {
        await deleteTemplate(id);
        toast({
          title: "Success",
          description: "Template deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error", 
          description: "Failed to delete template",
          variant: "destructive"
        });
      }
    }
  };

  const commonVariables = [
    '{{project_name}}', '{{employee_name}}', '{{client_name}}', 
    '{{work_order_id}}', '{{location_name}}', '{{due_date}}',
    '{{priority}}', '{{status}}', '{{description}}'
  ];

  if (loading) {
    return <div className="text-center py-4">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notification Templates</h2>
          <p className="text-muted-foreground">Create and manage reusable notification templates</p>
        </div>
        <Button onClick={handleAdd} className="bg-gradient-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{template.template_name}</h3>
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{template.template_type}</Badge>
                </div>
                
                {template.subject_template && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Subject:</strong> {template.subject_template}
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground max-w-2xl">
                  <strong>Body:</strong> {template.body_template.substring(0, 150)}
                  {template.body_template.length > 150 && '...'}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id, template.template_name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card className="p-8 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Templates Created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first notification template to standardize communications
            </p>
            <Button onClick={handleAdd} className="bg-gradient-primary hover:bg-primary-hover">
              Create Template
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>

              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select value={formData.template_type} onValueChange={(value) => setFormData({ ...formData, template_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="in_app">In-App Notification</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject Template (for email) */}
            {formData.template_type === 'email' && (
              <div className="space-y-2">
                <Label>Subject Template</Label>
                <Input
                  value={formData.subject_template}
                  onChange={(e) => setFormData({ ...formData, subject_template: e.target.value })}
                  placeholder="Enter email subject template"
                />
              </div>
            )}

            {/* Body Template */}
            <div className="space-y-2">
              <Label>Message Template *</Label>
              <Textarea
                value={formData.body_template}
                onChange={(e) => setFormData({ ...formData, body_template: e.target.value })}
                placeholder="Enter message template with variables like {{project_name}}"
                rows={8}
              />
            </div>

            {/* Available Variables */}
            <div className="space-y-2">
              <Label>Available Variables</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                {commonVariables.map((variable) => (
                  <Badge 
                    key={variable} 
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        body_template: formData.body_template + ' ' + variable
                      });
                    }}
                  >
                    <Code className="h-3 w-3 mr-1" />
                    {variable}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Click on a variable to add it to your template
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-gradient-primary hover:bg-primary-hover">
                {selectedTemplate ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};