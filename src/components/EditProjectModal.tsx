import { useState, useEffect } from "react";
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
import { Project } from "@/hooks/useProjects";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (id: string, projectData: any) => Promise<any>;
  project: Project | null;
}

export const EditProjectModal = ({ isOpen, onClose, onUpdateProject, project }: EditProjectModalProps) => {
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

  // Pre-populate form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        client_id: project.client_id || "",
        project_type: project.project_type || "Network Installation",
        status: project.status || "Planning",
        priority: project.priority || "Medium",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        estimated_budget: project.estimated_budget ? project.estimated_budget.toString() : ""
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Job name is required",
        variant: "destructive",
      });
      return;
    }

    if (!project) return;

    setIsLoading(true);
    try {
      const projectData = {
        ...formData,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        client_id: formData.client_id || null
      };
      
      await onUpdateProject(project.id, projectData);
      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project",
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
            Edit Job
          </DialogTitle>
          <DialogDescription>
            Update job details, timeline, and configuration.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Job Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Job Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter job name"
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
                placeholder="Describe the job scope and objectives"
                rows={3}
              />
            </div>
          </div>

          {/* Project Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project_type">Job Type</Label>
                <Select value={formData.project_type} onValueChange={(value) => handleInputChange("project_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Network Installation">Network Installation</SelectItem>
                    <SelectItem value="Cabling">Cabling</SelectItem>
                    <SelectItem value="Fiber Optic">Fiber Optic</SelectItem>
                    <SelectItem value="Data Center">Data Center</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Upgrade">Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
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
              {isLoading ? "Updating..." : "Update Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};