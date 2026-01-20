import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Briefcase, 
  Calendar, 
  DollarSign, 
  GraduationCap, 
  Phone, 
  User, 
  Search, 
  Edit, 
  Save, 
  X,
  Loader2,
  Users
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useProfiles } from "@/hooks/useProfiles";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  status?: "Active" | "Inactive" | "On Leave" | "Terminated";
  skills?: string[];
  certifications?: any;
  hourly_rate?: number;
  hire_date?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export const EmployeeDetailsPanel = () => {
  const { employees, loading, updateEmployee } = useEmployees();
  const { canViewSensitiveData, hasAnyRole } = useUserRoles();
  const { getProfileByUserId } = useProfiles();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);
  
  const canEditHRData = hasAnyRole(['admin', 'hr_manager']);
  const canViewSalary = canViewSensitiveData();

  const filteredEmployees = employees.filter((emp: Employee) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      emp.first_name?.toLowerCase().includes(searchLower) ||
      emp.last_name?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.department?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setEditData({
      department: employee.department,
      skills: employee.skills || [],
      hourly_rate: employee.hourly_rate,
      emergency_contact_name: employee.emergency_contact_name,
      emergency_contact_phone: employee.emergency_contact_phone,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (employeeId: string) => {
    setSaving(true);
    try {
      await updateEmployee(employeeId, editData);
      toast({
        title: "Success",
        description: "Employee details updated successfully",
      });
      setEditingId(null);
      setEditData({});
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "On Leave":
        return "bg-warning text-warning-foreground";
      case "Inactive":
      case "Terminated":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Loading employee data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Employee Details
              </CardTitle>
              <CardDescription>
                View and manage HR-specific employee data including skills, certifications, and compensation
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-sm text-muted-foreground">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {employees.filter((e: Employee) => e.skills && e.skills.length > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">With Skills Listed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">
                  {employees.filter((e: Employee) => e.status === "Active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-warning" />
              <div>
                <p className="text-2xl font-bold">
                  {employees.filter((e: Employee) => e.status === "On Leave").length}
                </p>
                <p className="text-sm text-muted-foreground">On Leave</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          {filteredEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "No employees match your search" : "No employee records found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Skills</TableHead>
                    {canViewSalary && <TableHead>Hourly Rate</TableHead>}
                    <TableHead>Emergency Contact</TableHead>
                    {canEditHRData && <TableHead className="w-24">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee: Employee) => {
                    const isEditing = editingId === employee.id;
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {employee.email || "No email"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={editData.department || ""}
                              onValueChange={(v) => setEditData({ ...editData, department: v })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Field Operations">Field Operations</SelectItem>
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Project Management">Project Management</SelectItem>
                                <SelectItem value="Administration">Administration</SelectItem>
                                <SelectItem value="Sales">Sales</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span>{employee.department || "—"}</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-48">
                            {employee.skills && employee.skills.length > 0 ? (
                              employee.skills.slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">No skills</span>
                            )}
                            {employee.skills && employee.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{employee.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        {canViewSalary && (
                          <TableCell>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={editData.hourly_rate || ""}
                                  onChange={(e) => setEditData({ ...editData, hourly_rate: parseFloat(e.target.value) || 0 })}
                                  className="w-20"
                                  placeholder="0.00"
                                />
                              </div>
                            ) : (
                              <span className="font-medium text-primary">
                                {employee.hourly_rate ? `$${employee.hourly_rate}/hr` : "—"}
                              </span>
                            )}
                          </TableCell>
                        )}
                        
                        <TableCell>
                          {isEditing ? (
                            <div className="space-y-1">
                              <Input
                                value={editData.emergency_contact_name || ""}
                                onChange={(e) => setEditData({ ...editData, emergency_contact_name: e.target.value })}
                                placeholder="Name"
                                className="w-32"
                              />
                              <Input
                                value={editData.emergency_contact_phone || ""}
                                onChange={(e) => setEditData({ ...editData, emergency_contact_phone: e.target.value })}
                                placeholder="Phone"
                                className="w-32"
                              />
                            </div>
                          ) : (
                            <div className="text-sm">
                              {employee.emergency_contact_name ? (
                                <>
                                  <p>{employee.emergency_contact_name}</p>
                                  <p className="text-muted-foreground">{employee.emergency_contact_phone || "No phone"}</p>
                                </>
                              ) : (
                                <span className="text-muted-foreground">Not set</span>
                              )}
                            </div>
                          )}
                        </TableCell>
                        
                        {canEditHRData && (
                          <TableCell>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleSave(employee.id)}
                                  disabled={saving}
                                >
                                  {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4 text-success" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancel}
                                  disabled={saving}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(employee)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
