import { useState } from 'react';
import { Shield, TestTube, Server, CheckSquare, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RackVisualizer } from '@/components/RackVisualizer';
import { TestResultsManager } from '@/components/TestResultsManager';
import { SafetyChecklistModal } from '@/components/SafetyChecklistModal';
import { ChecklistManagementTabs } from '@/components/ChecklistManagementTabs';
import { useEmployees } from '@/hooks/useEmployees';
import { useEquipment } from '@/hooks/useEquipment';
import { useTestResults } from '@/hooks/useTestResults';
import { useUserRoles } from '@/hooks/useUserRoles';

const QualityAssurance = () => {
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedRack, setSelectedRack] = useState('');
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [selectedQualityChecklist, setSelectedQualityChecklist] = useState<any>(null);

  const { employees } = useEmployees();
  const { racks } = useEquipment();
  const { qualityChecklists, qualitySubmissions } = useTestResults();
  const { hasRole } = useUserRoles();

  const isAdmin = hasRole('admin') || hasRole('hr_manager');

  const technicians = employees.filter(emp => 
    emp.role === 'technician' || 
    emp.role === 'project_manager' ||
    emp.role === 'Network Technician' ||
    emp.role === 'Fiber Technician' ||
    emp.role === 'Installation Technician' ||
    emp.role === 'Field Engineer'
  );

  const currentRack = racks.find(rack => rack.id === selectedRack);

  const openQualityChecklist = (checklist: any) => {
    setSelectedQualityChecklist(checklist);
    setShowQualityModal(true);
  };

  const getChecklistStats = () => {
    const totalSubmissions = qualitySubmissions.length;
    const passedSubmissions = qualitySubmissions.filter(sub => sub.overall_status === 'pass').length;
    const failedSubmissions = qualitySubmissions.filter(sub => sub.overall_status === 'fail').length;
    
    return {
      total: totalSubmissions,
      passed: passedSubmissions,
      failed: failedSubmissions,
      passRate: totalSubmissions > 0 ? Math.round((passedSubmissions / totalSubmissions) * 100) : 0,
    };
  };

  const stats = getChecklistStats();

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Quality Assurance
          </h1>
          <p className="text-muted-foreground mt-1">
            Equipment management, test results, and quality checklists
          </p>
        </div>

        {/* Context Selection */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Context Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Technician/Employee</Label>
                <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select technician or employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.first_name} {tech.last_name} 
                        {tech.client_id ? ' (Client Technician)' : ' (Company Employee)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Rack (for visualization)</Label>
                <Select value={selectedRack} onValueChange={setSelectedRack}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rack" />
                  </SelectTrigger>
                  <SelectContent>
                    {racks.map((rack) => (
                      <SelectItem key={rack.id} value={rack.id}>
                        {rack.rack_name} ({rack.location_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QA Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total QA Checks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <div className="h-4 w-4 rounded-full bg-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.passRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="checklists" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="checklists">Quality Checklists</TabsTrigger>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="equipment">Equipment Stack</TabsTrigger>
            {isAdmin && <TabsTrigger value="management">Manage Checklists</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="checklists" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {qualityChecklists.map((checklist) => (
                <Card key={checklist.id} className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-primary" />
                      {checklist.name}
                    </CardTitle>
                    <CardDescription>
                      {checklist.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>{checklist.items.length} total items</span>
                      <span>{checklist.items.filter(i => i.required).length} required</span>
                    </div>
                    
                    <div className="space-y-2">
                      {checklist.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          <span className="truncate">{item.title}</span>
                          {item.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                      ))}
                      {checklist.items.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{checklist.items.length - 3} more items
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={() => openQualityChecklist(checklist)}
                      disabled={!selectedTechnician}
                      className="w-full"
                    >
                      Start Quality Check
                    </Button>
                    
                    {!selectedTechnician && (
                      <div className="text-xs text-muted-foreground text-center">
                        Select a technician to start quality checks
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="tests" className="space-y-6">
            <TestResultsManager technicianId={selectedTechnician} />
          </TabsContent>
          
          <TabsContent value="equipment" className="space-y-6">
            {currentRack ? (
              <RackVisualizer rack={currentRack} />
            ) : (
              <Card className="shadow-soft">
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Rack Selected</h3>
                    <p>Select a rack from the dropdown above to view equipment visualization</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Admin Checklist Management */}
          {isAdmin && (
            <TabsContent value="management" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">Checklist Management</h3>
                  <p className="text-muted-foreground">
                    Create and manage safety and quality checklists for your organization
                  </p>
                </div>
                <ChecklistManagementTabs />
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Quality Checklist Modal */}
        {selectedQualityChecklist && (
          <SafetyChecklistModal
            open={showQualityModal}
            onOpenChange={setShowQualityModal}
            checklist={selectedQualityChecklist}
            employeeId={selectedTechnician}
          />
        )}
      </main>
  );
};

export default QualityAssurance;