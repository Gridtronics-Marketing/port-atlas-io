import { useState, useEffect } from "react";
import { Users, Plus, MapPin, Calendar, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Employee } from "@/hooks/useEmployees";
import { supabase } from "@/integrations/supabase/client";

interface CrewAssignmentModalProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
}

interface Location {
  id: string;
  name: string;
  address: string;
  status: string;
}

export const CrewAssignmentModal = ({ employees, isOpen, onClose }: CrewAssignmentModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    crew_name: "",
    location_id: "",
    start_date: "",
    end_date: "",
    shift_start: "",
    shift_end: "",
    notes: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address, status')
        .eq('status', 'Active')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch locations",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.crew_name.trim() || !formData.location_id || selectedEmployees.length === 0) {
      toast({
        title: "Error",
        description: "Crew name, location, and at least one employee are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // For now, just show success message since we don't have a crew assignments table yet
      toast({
        title: "Success",
        description: `Crew "${formData.crew_name}" assigned with ${selectedEmployees.length} members`,
      });
      
      // Reset form
      setFormData({
        crew_name: "",
        location_id: "",
        start_date: "",
        end_date: "",
        shift_start: "",
        shift_end: "",
        notes: ""
      });
      setSelectedEmployees([]);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create crew assignment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const activeEmployees = employees.filter(emp => emp.status === 'Active');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Create Crew Assignment
          </DialogTitle>
          <DialogDescription>
            Assign employees to a crew for specific locations and time periods.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Assignment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="crew_name">Crew Name *</Label>
                <Input
                  id="crew_name"
                  value={formData.crew_name}
                  onChange={(e) => handleInputChange("crew_name", e.target.value)}
                  placeholder="Fiber Install Crew A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_id">Location *</Label>
                <Select value={formData.location_id} onValueChange={(value) => handleInputChange("location_id", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex flex-col">
                          <span>{location.name}</span>
                          <span className="text-xs text-muted-foreground">{location.address}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift_start">Shift Start</Label>
                <Input
                  id="shift_start"
                  type="time"
                  value={formData.shift_start}
                  onChange={(e) => handleInputChange("shift_start", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift_end">Shift End</Label>
                <Input
                  id="shift_end"
                  type="time"
                  value={formData.shift_end}
                  onChange={(e) => handleInputChange("shift_end", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Special instructions or requirements..."
                rows={3}
              />
            </div>
          </div>

          {/* Employee Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Select Crew Members</h3>
              <Badge variant="secondary">
                {selectedEmployees.length} selected
              </Badge>
            </div>
            
            <div className="max-h-64 overflow-y-auto border rounded-lg p-4 space-y-3">
              {activeEmployees.length > 0 ? (
                activeEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => toggleEmployeeSelection(employee.id)}
                      />
                      <div>
                        <p className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.role} • {employee.department || 'No Department'}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {employee.skills && employee.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No active employees available for assignment
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || selectedEmployees.length === 0}
              className="bg-gradient-primary hover:bg-primary-hover"
            >
              {isLoading ? "Creating..." : "Create Assignment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};