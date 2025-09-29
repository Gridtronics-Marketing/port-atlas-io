import { useState, useEffect } from "react";
import { Users, Clock, MapPin, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Employee, useEmployees } from "@/hooks/useEmployees";

interface EmployeeDetailsModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeDetailsModal = ({ employee, isOpen, onClose }: EmployeeDetailsModalProps) => {
  const { fetchEmployeeById } = useEmployees();
  const [freshEmployee, setFreshEmployee] = useState<Employee | null>(employee);

  // Fetch fresh data when modal opens
  useEffect(() => {
    const loadFreshData = async () => {
      if (employee?.id && isOpen) {
        try {
          console.log('📥 [EmployeeDetailsModal] Loading fresh employee data...');
          const fresh = await fetchEmployeeById(employee.id);
          if (fresh) {
            console.log('✅ [EmployeeDetailsModal] Fresh data loaded. Skills:', fresh.skills);
            setFreshEmployee(fresh);
          }
        } catch (error) {
          console.error('❌ [EmployeeDetailsModal] Error loading fresh data:', error);
          setFreshEmployee(employee);
        }
      }
    };
    
    loadFreshData();
  }, [employee?.id, isOpen, fetchEmployeeById]);

  if (!freshEmployee) return null;

  const displayEmployee = freshEmployee;

  const getCertificationStatus = (cert: string, expiryDate?: string) => {
    if (!expiryDate) return { status: "unknown", color: "bg-muted text-muted-foreground" };
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (expiry < now) {
      return { status: "expired", color: "bg-destructive text-destructive-foreground" };
    } else if (expiry < thirtyDaysFromNow) {
      return { status: "expiring", color: "bg-warning text-warning-foreground" };
    } else {
      return { status: "valid", color: "bg-success text-success-foreground" };
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Employee Details - {displayEmployee.first_name} {displayEmployee.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Basic Information</span>
                <Badge className={getStatusColor(displayEmployee.status)}>
                  {displayEmployee.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Employee Number</label>
                  <p className="text-foreground">{displayEmployee.employee_number || "Not assigned"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                  <p className="text-foreground">{displayEmployee.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <p className="text-foreground">{displayEmployee.department || "Not assigned"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{displayEmployee.email || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p className="text-foreground">{displayEmployee.phone || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hire Date</label>
                  <p className="text-foreground">
                    {displayEmployee.hire_date ? new Date(displayEmployee.hire_date).toLocaleDateString() : "Not recorded"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hourly Rate</label>
                  <p className="text-foreground">
                    {displayEmployee.hourly_rate ? `$${displayEmployee.hourly_rate}/hr` : "Not set"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Expertise</CardTitle>
            </CardHeader>
            <CardContent>
              {displayEmployee.skills && displayEmployee.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {displayEmployee.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No skills recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Certifications
                {displayEmployee.certifications && displayEmployee.certifications.some(cert => {
                  const expiry = displayEmployee.certification_expiry?.[cert];
                  if (!expiry) return false;
                  const expiryDate = new Date(expiry);
                  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  return expiryDate < thirtyDaysFromNow;
                }) && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Action Required
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayEmployee.certifications && displayEmployee.certifications.length > 0 ? (
                <div className="space-y-3">
                  {displayEmployee.certifications.map((cert, index) => {
                    const expiryDate = displayEmployee.certification_expiry?.[cert];
                    const status = getCertificationStatus(cert, expiryDate);
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            status.status === 'valid' ? 'bg-success/10' : 
                            status.status === 'expiring' ? 'bg-warning/10' : 
                            status.status === 'expired' ? 'bg-destructive/10' : 'bg-muted/10'
                          }`}>
                            {status.status === 'valid' ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <AlertTriangle className={`h-4 w-4 ${
                                status.status === 'expiring' ? 'text-warning' : 
                                status.status === 'expired' ? 'text-destructive' : 'text-muted-foreground'
                              }`} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{cert}</p>
                            {expiryDate && (
                              <p className="text-sm text-muted-foreground">
                                Expires: {new Date(expiryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={status.color}>
                          {status.status === 'valid' ? 'Valid' : 
                           status.status === 'expiring' ? 'Expiring Soon' : 
                           status.status === 'expired' ? 'Expired' : 'Unknown'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No certifications recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
                  <p className="text-foreground">{displayEmployee.emergency_contact_name || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
                  <p className="text-foreground">{displayEmployee.emergency_contact_phone || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Time tracking and activity logs will appear here</p>
                <p className="text-sm">Feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};