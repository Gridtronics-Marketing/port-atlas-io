import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/useClients";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useEmployees } from "@/hooks/useEmployees";

interface Employee {
  id: string;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  hire_date: string | null;
  hourly_rate: number | null;
  skills: string[];
  certifications: string[];
  certification_expiry: Record<string, string>;
  status: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  client_id: string | null;
}

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onUpdateEmployee: (id: string, data: Partial<Employee>) => Promise<any>;
}

export const EditEmployeeModal = ({ isOpen, onClose, employee, onUpdateEmployee }: EditEmployeeModalProps) => {
  const { toast } = useToast();
  const { clients } = useClients();
  const { hasAnyRole } = useUserRoles();
  const { fetchEmployeeById } = useEmployees();
  const [isLoading, setIsLoading] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [certExpiryDate, setCertExpiryDate] = useState<Date | undefined>();

  const isCompanyUser = hasAnyRole(['admin', 'hr_manager', 'project_manager']);

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
    client_id: "company"
  });

  useEffect(() => {
    const loadFreshData = async () => {
      if (employee?.id && isOpen) {
        try {
          console.log('📥 Loading fresh employee data for edit...');
          const freshData = await fetchEmployeeById(employee.id);
          
          if (freshData) {
            setFormData({
              employee_number: freshData.employee_number || "",
              first_name: freshData.first_name || "",
              last_name: freshData.last_name || "",
              email: freshData.email || "",
              phone: freshData.phone || "",
              role: freshData.role || "",
              department: freshData.department || "",
              hire_date: freshData.hire_date || "",
              hourly_rate: freshData.hourly_rate?.toString() || "",
              skills: freshData.skills || [],
              certifications: freshData.certifications || [],
              certification_expiry: freshData.certification_expiry || {},
              status: freshData.status || "Active",
              emergency_contact_name: freshData.emergency_contact_name || "",
              emergency_contact_phone: freshData.emergency_contact_phone || "",
              client_id: freshData.client_id || "company"
            });
            
            console.log('✅ Fresh data loaded. Skills:', freshData.skills);
          }
        } catch (error) {
          console.error('❌ Error loading fresh employee data:', error);
          toast({
            title: "Error",
            description: "Failed to load employee data",
            variant: "destructive",
          });
        }
      }
    };
    
    loadFreshData();
  }, [employee?.id, isOpen, fetchEmployeeById, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    if (!formData.first_name || !formData.last_name || !formData.role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const employeeData: Partial<Employee> = {
        employee_number: formData.employee_number || null,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone || null,
        role: formData.role,
        department: formData.department || null,
        hire_date: formData.hire_date || null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        skills: formData.skills,
        certifications: formData.certifications,
        certification_expiry: formData.certification_expiry,
        status: formData.status,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        client_id: formData.client_id === "company" ? null : (formData.client_id || null),
      };
      
      await onUpdateEmployee(employee.id, employeeData);
      toast({
        title: "Success",
        description: "Employee updated successfully",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee",
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

  const addCertification = (cert: string) => {
    if (cert && !formData.certifications.includes(cert)) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert]
      }));
      if (certExpiryDate) {
        setFormData(prev => ({
          ...prev,
          certification_expiry: {
            ...prev.certification_expiry,
            [cert]: certExpiryDate.toISOString().split('T')[0]
          }
        }));
      }
      setNewCertification("");
      setCertExpiryDate(undefined);
    }
  };

  const removeCertification = (certToRemove: string) => {
    setFormData(prev => {
      const newCertExpiry = { ...prev.certification_expiry };
      delete newCertExpiry[certToRemove];
      return {
        ...prev,
        certifications: prev.certifications.filter(cert => cert !== certToRemove),
        certification_expiry: newCertExpiry
      };
    });
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee: {employee.first_name} {employee.last_name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="employee_number">Employee Number</Label>
                <Input
                  id="employee_number"
                  value={formData.employee_number}
                  onChange={(e) => handleInputChange("employee_number", e.target.value)}
                  placeholder="EMP001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="john@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1-555-123-4567"
                />
              </div>
            </div>

            {/* Work Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Work Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technician">Technician</SelectItem>
                    <SelectItem value="Senior Technician">Senior Technician</SelectItem>
                    <SelectItem value="Lead Technician">Lead Technician</SelectItem>
                    <SelectItem value="Project Manager">Project Manager</SelectItem>
                    <SelectItem value="Network Engineer">Network Engineer</SelectItem>
                    <SelectItem value="Security Specialist">Security Specialist</SelectItem>
                    <SelectItem value="Fiber Optic Specialist">Fiber Optic Specialist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Installation">Installation</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Project Management">Project Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="company">Company Employee</SelectItem>
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

          <Separator />

          {/* Skills */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Skills & Expertise</h3>
              <Badge variant="outline" className="text-xs">
                {formData.skills.length} skill{formData.skills.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="p-4 border rounded-lg bg-muted/10">
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.skills.length > 0 ? (
                  formData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No skills added yet. Add skills to help with project assignments.
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Enter a skill (e.g., Fiber Optics, Network Cabling, WiFi Setup)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(newSkill.trim());
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={() => addSkill(newSkill.trim())} 
                  size="sm"
                  disabled={!newSkill.trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              <div className="mt-3 text-xs text-muted-foreground">
                <p>💡 Tip: Press Enter to quickly add skills. Click the X on any skill to remove it.</p>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Certifications</h3>
            <div className="space-y-2">
              {formData.certifications.map((cert, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span>{cert}</span>
                  <div className="flex items-center gap-2">
                    {formData.certification_expiry[cert] && (
                      <span className="text-xs text-muted-foreground">
                        Expires: {new Date(formData.certification_expiry[cert]).toLocaleDateString()}
                      </span>
                    )}
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeCertification(cert)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="Add certification"
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !certExpiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {certExpiryDate ? format(certExpiryDate, "PPP") : <span>Expiry date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={certExpiryDate}
                    onSelect={setCertExpiryDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <Button 
                type="button" 
                onClick={() => addCertification(newCertification)}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Emergency Contact */}
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
                  placeholder="Emergency contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
                  placeholder="+1-555-987-6543"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Employee'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};