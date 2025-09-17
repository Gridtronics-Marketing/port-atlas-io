import { useState } from 'react';
import { Shield, Clock, Camera, User, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TimeTrackingCard } from '@/components/TimeTrackingCard';
import { PhotoCaptureCard } from '@/components/PhotoCaptureCard';
import { SafetyChecklistModal } from '@/components/SafetyChecklistModal';
import { useSafetyChecklists } from '@/hooks/useSafetyChecklists';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useLocations } from '@/hooks/useLocations';
import { useWorkOrders } from '@/hooks/useWorkOrders';

const FieldOperations = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState('');
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);

  const { checklists, loading: checklistsLoading } = useSafetyChecklists();
  const { employees } = useEmployees();
  const { projects } = useProjects();
  const { locations } = useLocations();
  const { workOrders } = useWorkOrders();

  const openSafetyChecklist = (checklist: any) => {
    setSelectedChecklist(checklist);
    setShowSafetyModal(true);
  };

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Field Operations
          </h1>
          <p className="text-muted-foreground mt-1">
            Mobile time tracking, safety checklists, and photo documentation
          </p>
        </div>

        {/* Employee Selection */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Employee & Context Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Employee *</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Project (Optional)</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Location (Optional)</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Work Order (Optional)</Label>
                <Select value={selectedWorkOrder} onValueChange={setSelectedWorkOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work order" />
                  </SelectTrigger>
                  <SelectContent>
                    {workOrders
                      .filter(wo => wo.status !== 'Completed')
                      .map((workOrder) => (
                        <SelectItem key={workOrder.id} value={workOrder.id}>
                          {workOrder.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Operations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time Tracking */}
          <div>
            <TimeTrackingCard employeeId={selectedEmployee} />
          </div>

          {/* Photo Capture */}
          <div>
            <PhotoCaptureCard 
              employeeId={selectedEmployee}
              projectId={selectedProject}
              locationId={selectedLocation}
              workOrderId={selectedWorkOrder}
            />
          </div>

          {/* Safety Checklists */}
          <div>
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Safety Checklists
                </CardTitle>
                <CardDescription>
                  Digital safety forms and compliance tracking
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {checklistsLoading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Loading checklists...
                  </div>
                ) : (
                  checklists.map((checklist) => (
                    <Button
                      key={checklist.id}
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      onClick={() => openSafetyChecklist(checklist)}
                      disabled={!selectedEmployee}
                    >
                      <div className="text-left">
                        <div className="font-medium flex items-center gap-2">
                          <CheckSquare className="h-4 w-4" />
                          {checklist.name}
                        </div>
                        {checklist.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {checklist.description}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {checklist.items.length} items • {checklist.items.filter(i => i.required).length} required
                        </div>
                      </div>
                    </Button>
                  ))
                )}
                
                {!selectedEmployee && (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    Select an employee to access safety checklists
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              Activity tracking will be displayed here based on selected employee
            </div>
          </CardContent>
        </Card>

        {/* Safety Checklist Modal */}
        {selectedChecklist && (
          <SafetyChecklistModal
            open={showSafetyModal}
            onOpenChange={setShowSafetyModal}
            checklist={selectedChecklist}
            employeeId={selectedEmployee}
            projectId={selectedProject}
            locationId={selectedLocation}
            workOrderId={selectedWorkOrder}
          />
        )}
      </main>
  );
};

export default FieldOperations;