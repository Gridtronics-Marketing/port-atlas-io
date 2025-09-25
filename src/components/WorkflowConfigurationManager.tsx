import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Settings, Trash2, Edit, Play, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkflowConfigurations } from '@/hooks/useWorkflowConfigurations';

export const WorkflowConfigurationManager = () => {
  const { toast } = useToast();
  const { workflows, loading, addWorkflow, updateWorkflow, deleteWorkflow } = useWorkflowConfigurations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [formData, setFormData] = useState({
    workflow_name: '',
    workflow_type: 'approval',
    steps: [] as any[],
    approval_rules: {} as any,
    is_active: true
  });

  const handleAdd = () => {
    setSelectedWorkflow(null);
    setFormData({
      workflow_name: '',
      workflow_type: 'approval',
      steps: [],
      approval_rules: {},
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (workflow: any) => {
    setSelectedWorkflow(workflow);
    const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
    const approvalRules = typeof workflow.approval_rules === 'object' && workflow.approval_rules !== null 
      ? workflow.approval_rules : {};
    
    setFormData({
      workflow_name: workflow.workflow_name,
      workflow_type: workflow.workflow_type,
      steps,
      approval_rules: approvalRules,
      is_active: workflow.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.workflow_name.trim()) {
      toast({
        title: "Error",
        description: "Workflow name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      if (selectedWorkflow) {
        await updateWorkflow(selectedWorkflow.id, formData);
        toast({
          title: "Success",
          description: "Workflow updated successfully"
        });
      } else {
        await addWorkflow(formData);
        toast({
          title: "Success", 
          description: "Workflow created successfully"
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the workflow "${name}"?`)) {
      try {
        await deleteWorkflow(id);
        toast({
          title: "Success",
          description: "Workflow deleted successfully"
        });
      } catch (error) {
        toast({
          title: "Error", 
          description: "Failed to delete workflow",
          variant: "destructive"
        });
      }
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          id: Date.now().toString(),
          name: '',
          type: 'approval',
          required_role: '',
          conditions: {}
        }
      ]
    });
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  if (loading) {
    return <div className="text-center py-4">Loading workflows...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Workflow Configuration</h2>
          <p className="text-muted-foreground">Design and manage business process workflows</p>
        </div>
        <Button onClick={handleAdd} className="bg-gradient-primary hover:bg-primary-hover">
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow
        </Button>
      </div>

      <div className="grid gap-4">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{workflow.workflow_name}</h3>
                  <Badge variant={workflow.is_active ? "default" : "secondary"}>
                    {workflow.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{workflow.workflow_type}</Badge>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Play className="h-3 w-3" />
                  {Array.isArray(workflow.steps) ? workflow.steps.length : 0} steps configured
                </div>

                {Array.isArray(workflow.steps) && workflow.steps.length > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    {workflow.steps.map((step: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <Badge variant="outline" className="text-xs">
                          {step.name || `Step ${index + 1}`}
                        </Badge>
                        {index < (Array.isArray(workflow.steps) ? workflow.steps.length : 0) - 1 && (
                          <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(workflow)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(workflow.id, workflow.workflow_name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {workflows.length === 0 && (
          <Card className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Workflows Configured</h3>
            <p className="text-muted-foreground mb-4">
              Create your first workflow to automate business processes
            </p>
            <Button onClick={handleAdd} className="bg-gradient-primary hover:bg-primary-hover">
              Create Workflow
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedWorkflow ? 'Edit Workflow' : 'Create Workflow'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Workflow Name *</Label>
                <Input
                  value={formData.workflow_name}
                  onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
                  placeholder="Enter workflow name"
                />
              </div>

              <div className="space-y-2">
                <Label>Workflow Type</Label>
                <Select value={formData.workflow_type} onValueChange={(value) => setFormData({ ...formData, workflow_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approval">Approval Process</SelectItem>
                    <SelectItem value="notification">Notification Chain</SelectItem>
                    <SelectItem value="validation">Validation Process</SelectItem>
                    <SelectItem value="escalation">Escalation Process</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Workflow Steps</h3>
                <Button type="button" variant="outline" onClick={addStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
              </div>

              {formData.steps.map((step, index) => (
                <Card key={step.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Step {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStep(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Step Name</Label>
                      <Input
                        value={step.name}
                        onChange={(e) => updateStep(index, 'name', e.target.value)}
                        placeholder="Enter step name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Step Type</Label>
                      <Select value={step.type} onValueChange={(value) => updateStep(index, 'type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approval">Approval Required</SelectItem>
                          <SelectItem value="notification">Send Notification</SelectItem>
                          <SelectItem value="validation">Data Validation</SelectItem>
                          <SelectItem value="assignment">Auto-Assignment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Required Role</Label>
                      <Select value={step.required_role} onValueChange={(value) => updateStep(index, 'required_role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="hr_manager">HR Manager</SelectItem>
                          <SelectItem value="project_manager">Project Manager</SelectItem>
                          <SelectItem value="technician">Technician</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
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
                {selectedWorkflow ? 'Update Workflow' : 'Create Workflow'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};