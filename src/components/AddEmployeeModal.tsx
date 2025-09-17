import { useState } from "react";
import { Users, X, Plus, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/useClients";
import { useUserRoles } from "@/hooks/useUserRoles";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEmployee: (employeeData: any) => Promise<any>;
}

const commonSkills = [
  "Fiber Optic Installation", "Copper Termination", "Network Configuration",
  "Cable Management", "Equipment Installation", "Testing & Certification",
  "Rack & Stack", "Troubleshooting", "Project Management", "Site Surveying"
];

const commonCertifications = [
  "Fall Protection", "Confined Space Entry", "OSHA 10", "OSHA 30",
  "Fiber Optic Splicing", "Copper Certification", "Lift Operation",
  "First Aid/CPR", "Electrical Safety", "Network+ Certification"
];

export const AddEmployeeModal = ({ isOpen, onClose, onAddEmployee }: AddEmployeeModalProps) => {
  const { toast } = useToast();
  const { clients } = useClients();
  const { isCompanyUser } = useUserRoles();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_number: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    hire_date: "",
    hourly_rate: "",
    skills: [] as string[],
    certifications: [] as string[],
    certification_expiry: {} as Record<string, string>,
    status: "Active",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    client_id: ""
  });
  
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [certExpiryDate, setCertExpiryDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.role.trim()) {
      toast({
        title: "Error",
        description: "First name, last name, and role are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const employeeData = {
        ...formData,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        hire_date: formData.hire_date || null,
        client_id: formData.client_id || null,
      };
      
      await onAddEmployee(employeeData);
      toast({
        title: "Success",
        description: "Employee added successfully",
      });
      
      // Reset form
      setFormData({
        employee_number: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        hire_date: "",
        hourly_rate: "",
        skills: [],
        certifications: [],
        certification_expiry: {},
        status: "Active",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        client_id: ""
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add employee",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addCertification = (cert: string, expiryDate?: string) => {
    if (cert && !formData.certifications.includes(cert)) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert],
        certification_expiry: expiryDate ? {
          ...prev.certification_expiry,
          [cert]: expiryDate
        } : prev.certification_expiry
      }));
      setNewCertification("");
      setCertExpiryDate("");
    }
  };

  const removeCertification = (certToRemove: string) => {
    setFormData(prev => {
      const newExpiry = { ...prev.certification_expiry };
      delete newExpiry[certToRemove];
      return {
        ...prev,
        certifications: prev.certifications.filter(cert => cert !== certToRemove),
        certification_expiry: newExpiry
      };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Add New Employee
          </DialogTitle>
          <DialogDescription>
            Add a new team member with their skills, certifications, and contact information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_number">Employee Number</Label>
                <Input
                  id="employee_number"
                  value={formData.employee_number}
                  onChange={(e) => handleInputChange("employee_number", e.target.value)}
                  placeholder="EMP001"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  placeholder="John"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john.doe@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Job Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Network Technician">Network Technician</SelectItem>
                    <SelectItem value="Fiber Technician">Fiber Technician</SelectItem>
                    <SelectItem value="Installation Technician">Installation Technician</SelectItem>
                    <SelectItem value="Project Manager">Project Manager</SelectItem>
                    <SelectItem value="Site Supervisor">Site Supervisor</SelectItem>
                    <SelectItem value="Network Engineer">Network Engineer</SelectItem>
                    <SelectItem value="Field Engineer">Field Engineer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Installation">Installation</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Project Management">Project Management</SelectItem>
                    <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => handleInputChange("hire_date", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange("hourly_rate", e.target.value)}
                  placeholder="25.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Client Assignment - Only for company users creating client technicians */}
              {isCompanyUser && (
                <div className="space-y-2">
                  <Label htmlFor="client_id">Client (Optional)</Label>
                  <Select value={formData.client_id} onValueChange={(value) => handleInputChange("client_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client for technician" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Company Employee</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Assign to a client to create a client technician, or leave empty for company employee
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Skills</h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={newSkill} onValueChange={setNewSkill}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonSkills.filter(skill => !formData.skills.includes(skill)).map(skill => (
                      <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  type="button" 
                  onClick={() => addSkill(newSkill)}
                  disabled={!newSkill}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Certifications</h3>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={newCertification} onValueChange={setNewCertification}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a certification" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonCertifications.filter(cert => !formData.certifications.includes(cert)).map(cert => (
                      <SelectItem key={cert} value={cert}>{cert}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  placeholder="Expiry date"
                  value={certExpiryDate}
                  onChange={(e) => setCertExpiryDate(e.target.value)}
                  className="w-40"
                />
                <Button 
                  type="button" 
                  onClick={() => addCertification(newCertification, certExpiryDate)}
                  disabled={!newCertification}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <div className="flex flex-col">
                      <span>{cert}</span>
                      {formData.certification_expiry[cert] && (
                        <span className="text-xs text-muted-foreground">
                          Expires: {new Date(formData.certification_expiry[cert]).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCertification(cert)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Emergency Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                  placeholder="(555) 987-6543"
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
              {isLoading ? "Adding..." : "Add Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};