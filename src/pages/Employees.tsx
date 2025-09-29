import { useState } from "react";
import { Users, Plus, Search, Filter, Shield, Wrench, MoreHorizontal, Eye, Edit, Trash2, Loader2, UserPlus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddEmployeeModal } from "@/components/AddEmployeeModal";
import { EditEmployeeModal } from "@/components/EditEmployeeModal";
import { EmployeeDetailsModal } from "@/components/EmployeeDetailsModal";
import { CrewAssignmentModal } from "@/components/CrewAssignmentModal";
import { RoleManagementModal } from "@/components/RoleManagementModal";
import { useEmployees } from "@/hooks/useEmployees";
import { useUserRoles } from "@/hooks/useUserRoles";

const Employees = () => {
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const { canManageEmployees, canViewSensitiveData, hasAnyRole, loading: rolesLoading } = useUserRoles();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCrewModalOpen, setIsCrewModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleManagementEmployee, setRoleManagementEmployee] = useState<any>(null);

  const getRoleIcon = (role: string) => {
    if (role.includes("Lead") || role.includes("Manager")) return Shield;
    if (role.includes("Security")) return Shield;
    return Wrench;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "On Leave":
        return "bg-warning text-warning-foreground";
      case "Inactive":
        return "bg-muted text-muted-foreground";
      case "Terminated":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const stats = [
    { label: "Total Employees", value: employees.length.toString(), color: "text-primary" },
    { label: "Active", value: employees.filter(e => e.status === 'Active').length.toString(), color: "text-success" },
    { label: "On Leave", value: employees.filter(e => e.status === 'On Leave').length.toString(), color: "text-warning" },
    { label: "Inactive", value: employees.filter(e => e.status === 'Inactive').length.toString(), color: "text-destructive" },
  ];

  return (
    <>
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Employee Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage team members, skills, and certifications
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setIsCrewModalOpen(true)}
              variant="outline"
              className="shadow-medium"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Crew
            </Button>
            {canManageEmployees() && (
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-gradient-primary hover:bg-primary-hover shadow-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Employee
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees, roles, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="bg-popover border">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="technician">Technician</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="engineer">Engineer</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Employees Grid */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                All Employees
              </span>
              <Badge variant="secondary">{employees.length} Total</Badge>
            </CardTitle>
            <CardDescription>
              Manage team members, skills, and certifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(loading || rolesLoading) ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">
                  {rolesLoading ? 'Loading permissions...' : 'Loading employees...'}
                </span>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No employees found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {employees.map((employee) => {
                  const RoleIcon = getRoleIcon(employee.role);
                  return (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-soft transition-all duration-200 bg-card"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <RoleIcon className="h-5 w-5 text-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {employee.first_name} {employee.last_name}
                            </h3>
                            <Badge className={getStatusColor(employee.status)}>
                              {employee.status}
                            </Badge>
                            {canManageEmployees() && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs ml-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEmployee(employee);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {employee.role} • {employee.department || 'No Department'}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                            {canViewSensitiveData() ? (
                              <>
                                <span>{employee.email || 'No Email'}</span>
                                <span>{employee.phone || 'No Phone'}</span>
                                <span>Hired: {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'Unknown'}</span>
                                {employee.hourly_rate && (
                                  <span className="text-primary font-medium">${employee.hourly_rate}/hr</span>
                                )}
                              </>
                            ) : (
                              <span>Contact info restricted</span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="text-xs font-medium text-muted-foreground mr-2">Skills:</span>
                            {employee.skills && employee.skills.length > 0 ? (
                              <>
                                {employee.skills.slice(0, 4).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {employee.skills.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{employee.skills.length - 4} more
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                No skills listed
                                {canManageEmployees() && (
                                  <span className="ml-1">- Click Edit to add</span>
                                )}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border">
                          <DropdownMenuItem onClick={() => {
                            setSelectedEmployee(employee);
                            setIsDetailsModalOpen(true);
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          
                          {hasAnyRole(['admin', 'hr_manager']) && (
                            <DropdownMenuItem onClick={() => {
                              setRoleManagementEmployee(employee);
                              setIsRoleModalOpen(true);
                            }}>
                              <Shield className="mr-2 h-4 w-4" />
                              Manage Roles
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem>
                            <Clock className="mr-2 h-4 w-4" />
                            Time Tracking
                          </DropdownMenuItem>
                          
                          {canManageEmployees() && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedEmployee(employee);
                              setIsEditModalOpen(true);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Employee
                            </DropdownMenuItem>
                          )}
                          
                          {canManageEmployees() && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteEmployee(employee.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Employee
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEmployee={addEmployee}
      />

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onUpdateEmployee={updateEmployee}
      />

      <EmployeeDetailsModal
        employee={selectedEmployee}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedEmployee(null);
        }}
      />

      <CrewAssignmentModal
        employees={employees}
        isOpen={isCrewModalOpen}
        onClose={() => setIsCrewModalOpen(false)}
      />

      <RoleManagementModal 
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setRoleManagementEmployee(null);
        }}
        userId={roleManagementEmployee?.id}
        userEmail={roleManagementEmployee?.email}
      />
    </>
  );
};

export default Employees;