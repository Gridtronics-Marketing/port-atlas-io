import { useState } from "react";
import { Users, Plus, Wrench, Shield, User, Phone, Mail, Calendar, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navigation } from "@/components/Navigation";

const mockEmployees = [
  {
    id: 1,
    name: "John Doe",
    role: "Lead Technician",
    email: "john.doe@company.com",
    phone: "(555) 123-0001",
    status: "Active",
    currentAssignments: 3,
    completedJobs: 45,
    hireDate: "2023-03-15",
    avatar: "/avatars/john.jpg",
    initials: "JD",
    permissions: ["add_drops", "edit_drops", "upload_photos", "manage_assignments"],
    currentLocation: "Downtown Office Complex",
  },
  {
    id: 2,
    name: "Sarah Wilson",
    role: "Installation Specialist",
    email: "sarah.wilson@company.com",
    phone: "(555) 123-0002",
    status: "Active",
    currentAssignments: 2,
    completedJobs: 38,
    hireDate: "2023-05-20",
    avatar: "/avatars/sarah.jpg",
    initials: "SW",
    permissions: ["add_drops", "edit_drops", "upload_photos"],
    currentLocation: "Manufacturing Facility A",
  },
  {
    id: 3,
    name: "Mike Johnson",
    role: "Security Specialist",
    email: "mike.johnson@company.com",
    phone: "(555) 123-0003",
    status: "Active",
    currentAssignments: 1,
    completedJobs: 22,
    hireDate: "2023-08-10",
    avatar: "/avatars/mike.jpg",
    initials: "MJ",
    permissions: ["add_drops", "edit_drops", "upload_photos", "security_access"],
    currentLocation: "Retail Store Network",
  },
  {
    id: 4,
    name: "Emily Chen",
    role: "Project Manager",
    email: "emily.chen@company.com",
    phone: "(555) 123-0004",
    status: "Active",
    currentAssignments: 5,
    completedJobs: 67,
    hireDate: "2022-11-01",
    avatar: "/avatars/emily.jpg",
    initials: "EC",
    permissions: ["add_drops", "edit_drops", "remove_drops", "manage_assignments", "upload_photos", "admin_access"],
    currentLocation: "Multiple Locations",
  },
  {
    id: 5,
    name: "David Martinez",
    role: "Fiber Technician",
    email: "david.martinez@company.com",
    phone: "(555) 123-0005",
    status: "On Leave",
    currentAssignments: 0,
    completedJobs: 31,
    hireDate: "2023-06-12",
    avatar: "/avatars/david.jpg",
    initials: "DM",
    permissions: ["add_drops", "edit_drops", "upload_photos", "fiber_specialist"],
    currentLocation: "N/A",
  },
];

const Employees = () => {
  const [employees, setEmployees] = useState(mockEmployees);

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
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getRoleColor = (role: string) => {
    if (role.includes("Lead") || role.includes("Manager")) return "text-primary bg-primary/10";
    if (role.includes("Security")) return "text-destructive bg-destructive/10";
    if (role.includes("Fiber")) return "text-warning bg-warning/10";
    return "text-muted-foreground bg-muted";
  };

  const stats = [
    { label: "Total Employees", value: employees.length.toString(), color: "text-primary" },
    { label: "Active Workers", value: employees.filter(e => e.status === "Active").length.toString(), color: "text-success" },
    { label: "Current Assignments", value: employees.reduce((sum, e) => sum + e.currentAssignments, 0).toString(), color: "text-warning" },
    { label: "Completed Jobs", value: employees.reduce((sum, e) => sum + e.completedJobs, 0).toString(), color: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Employee Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage field teams, assignments, and access permissions
            </p>
          </div>
          
          <Button className="bg-gradient-primary hover:bg-primary-hover shadow-medium">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
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

        {/* Employees List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Field Team
              </span>
              <Badge variant="secondary">{employees.length} Total</Badge>
            </CardTitle>
            <CardDescription>
              Manage employee accounts, permissions, and job assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees.map((employee) => {
                const RoleIcon = getRoleIcon(employee.role);
                
                return (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-soft transition-all duration-200 bg-card"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={employee.avatar} alt={employee.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {employee.initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground text-lg">
                            {employee.name}
                          </h3>
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1 rounded ${getRoleColor(employee.role)}`}>
                            <RoleIcon className="h-3 w-3" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {employee.role}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {employee.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {employee.phone}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              {employee.currentAssignments} active assignments
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {employee.completedJobs} completed jobs
                            </span>
                            <span>Hired: {new Date(employee.hireDate).toLocaleDateString()}</span>
                          </div>
                          
                          {employee.currentLocation !== "N/A" && (
                            <div className="text-xs text-muted-foreground">
                              <strong>Current Assignment:</strong> {employee.currentLocation}
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {employee.permissions.slice(0, 3).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission.replace('_', ' ')}
                              </Badge>
                            ))}
                            {employee.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{employee.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        View Schedule
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        Assign Job
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border">
                          <DropdownMenuItem>
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Manage Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            View Performance
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Deactivate Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Employees;