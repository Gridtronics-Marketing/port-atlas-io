import { useState } from "react";
import { Folder, X, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/useClients";
import { ConfigurableSelect } from "@/components/ui/configurable-select";

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (projectData: any) => Promise<any>;
}

export const AddProjectModal = ({ isOpen, onClose, onAddProject }: AddProjectModalProps) => {
  const { toast } = useToast();
  const { clients } = useClients();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_id: "",
    project_type: "Network Installation",
    status: "Planning",
    priority: "Medium",
    start_date: "",
    end_date: "",
    estimated_budget: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const projectData = {
        ...formData,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        client_id: formData.client_id || null
      };
      
      await onAddProject(projectData);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      setFormData({
        name: "",
        description: "",
        client_id: "",
        project_type: "Network Installation",
        status: "Planning",
        priority: "Medium",
        start_date: "",
        end_date: "",
        estimated_budget: ""
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            Create New Job
          </DialogTitle>
          <DialogDescription>
            Create a new job to manage work orders, locations, and team assignments.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Job Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => handleInputChange("client_id", value)}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the project scope and objectives"
                rows={3}
              />
            </div>
          </div>

          {/* Project Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_type">Project Type</Label>
                <ConfigurableSelect
                  category="project_types"
                  value={formData.project_type}
                  onValueChange={(value) => handleInputChange("project_type", value)}
                  placeholder="Select type"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <ConfigurableSelect
                  category="project_statuses"
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                  placeholder="Select status"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <ConfigurableSelect
                  category="project_priorities"
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange("priority", value)}
                  placeholder="Select priority"
                />
              </div>
            </div>
          </div>

          {/* Timeline & Budget */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline & Budget
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange("start_date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_budget" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Estimated Budget
                </Label>
                <Input
                  id="estimated_budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimated_budget}
                  onChange={(e) => handleInputChange("estimated_budget", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};