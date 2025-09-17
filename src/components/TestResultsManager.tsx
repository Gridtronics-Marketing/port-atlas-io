import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  TestTube, 
  Upload, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Calendar
} from 'lucide-react';
import { useTestResults, TestResult } from '@/hooks/useTestResults';
import { useEmployees } from '@/hooks/useEmployees';
import { useEquipment } from '@/hooks/useEquipment';
import { useLocations } from '@/hooks/useLocations';

const testTypes = [
  'Fiber Loss Test',
  'OTDR Test',
  'Cable Certification',
  'Continuity Test',
  'Insulation Resistance',
  'Network Performance',
  'Equipment Commissioning',
];

const certificationStandards = [
  'TIA-568-C.2',
  'TIA-568-C.3',
  'ISO/IEC 11801',
  'IEC 61935',
  'IEEE 802.3',
  'NECA/BICSI Standards',
];

interface TestResultsManagerProps {
  technicianId?: string;
}

export function TestResultsManager({ technicianId }: TestResultsManagerProps) {
  const { testResults, addTestResult, uploadTestFile, loading } = useTestResults();
  const { employees } = useEmployees();
  const { equipment } = useEquipment();
  const { locations } = useLocations();
  
  const [showAddTest, setShowAddTest] = useState(false);
  const [testData, setTestData] = useState({
    test_type: '',
    equipment_id: '',
    location_id: '',
    certification_standard: '',
    test_parameters: {
      cable_type: '',
      test_frequency: '',
      test_environment: '',
    },
    results: {
      measurement_1: '',
      measurement_2: '',
      measurement_3: '',
    },
    pass_fail_status: 'pass' as 'pass' | 'fail' | 'conditional',
    notes: '',
  });

  const handleAddTest = async () => {
    if (!technicianId || !testData.test_type) return;

    try {
      await addTestResult({
        test_type: testData.test_type,
        equipment_id: testData.equipment_id || undefined,
        location_id: testData.location_id || undefined,
        test_date: new Date().toISOString(),
        technician_id: technicianId,
        test_parameters: testData.test_parameters,
        results: testData.results,
        pass_fail_status: testData.pass_fail_status,
        certification_standard: testData.certification_standard || undefined,
        notes: testData.notes || undefined,
      });

      // Reset form
      setTestData({
        test_type: '',
        equipment_id: '',
        location_id: '',
        certification_standard: '',
        test_parameters: {
          cable_type: '',
          test_frequency: '',
          test_environment: '',
        },
        results: {
          measurement_1: '',
          measurement_2: '',
          measurement_3: '',
        },
        pass_fail_status: 'pass',
        notes: '',
      });
      setShowAddTest(false);
    } catch (error) {
      console.error('Error adding test result:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800 border-green-200';
      case 'fail': return 'bg-red-100 text-red-800 border-red-200';
      case 'conditional': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4" />;
      case 'fail': return <XCircle className="h-4 w-4" />;
      case 'conditional': return <AlertTriangle className="h-4 w-4" />;
      default: return <TestTube className="h-4 w-4" />;
    }
  };

  const filteredResults = technicianId 
    ? testResults.filter(result => result.technician_id === technicianId)
    : testResults;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Test Results</h2>
          <p className="text-muted-foreground">
            Manage certification tests and results
          </p>
        </div>
        
        <Button onClick={() => setShowAddTest(true)} disabled={!technicianId}>
          <TestTube className="h-4 w-4 mr-2" />
          Add Test Result
        </Button>
      </div>

      <Tabs defaultValue="results" className="w-full">
        <TabsList>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="add" className={showAddTest ? 'data-[state=active]' : ''}>
            Add Test
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading test results...</div>
          ) : filteredResults.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  No test results found
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredResults.map((result) => (
                <Card key={result.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(result.pass_fail_status)}
                        {result.test_type}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(result.pass_fail_status)}
                        >
                          {result.pass_fail_status.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary">
                          {new Date(result.test_date).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {result.equipment_id && (
                        <div>
                          <span className="font-medium">Equipment:</span>
                          <div className="text-muted-foreground">
                            {equipment.find(eq => eq.id === result.equipment_id)?.name || 'Unknown'}
                          </div>
                        </div>
                      )}
                      
                      {result.location_id && (
                        <div>
                          <span className="font-medium">Location:</span>
                          <div className="text-muted-foreground">
                            {locations.find(loc => loc.id === result.location_id)?.name || 'Unknown'}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium">Technician:</span>
                        <div className="text-muted-foreground">
                          {employees.find(emp => emp.id === result.technician_id)?.first_name || 'Unknown'}
                        </div>
                      </div>
                      
                      {result.certification_standard && (
                        <div>
                          <span className="font-medium">Standard:</span>
                          <div className="text-muted-foreground">
                            {result.certification_standard}
                          </div>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Test Parameters</h4>
                        <div className="text-sm space-y-1">
                          {Object.entries(result.test_parameters).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span>{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Test Results</h4>
                        <div className="text-sm space-y-1">
                          {Object.entries(result.results).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span>{value as string}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {result.notes && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-2">Notes</h4>
                          <p className="text-sm text-muted-foreground">
                            {result.notes}
                          </p>
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Created {new Date(result.created_at).toLocaleString()}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Test Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Test Type *</Label>
                  <Select 
                    value={testData.test_type} 
                    onValueChange={(value) => setTestData(prev => ({ ...prev, test_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      {testTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Certification Standard</Label>
                  <Select 
                    value={testData.certification_standard} 
                    onValueChange={(value) => setTestData(prev => ({ ...prev, certification_standard: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select standard" />
                    </SelectTrigger>
                    <SelectContent>
                      {certificationStandards.map((standard) => (
                        <SelectItem key={standard} value={standard}>
                          {standard}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Equipment</Label>
                  <Select 
                    value={testData.equipment_id} 
                    onValueChange={(value) => setTestData(prev => ({ ...prev, equipment_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipment.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>
                          {eq.name} ({eq.equipment_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Location</Label>
                  <Select 
                    value={testData.location_id} 
                    onValueChange={(value) => setTestData(prev => ({ ...prev, location_id: value }))}
                  >
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
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Test Parameters</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Cable Type</Label>
                    <Input
                      value={testData.test_parameters.cable_type}
                      onChange={(e) => setTestData(prev => ({
                        ...prev,
                        test_parameters: { ...prev.test_parameters, cable_type: e.target.value }
                      }))}
                      placeholder="e.g., Cat6A"
                    />
                  </div>
                  <div>
                    <Label>Test Frequency</Label>
                    <Input
                      value={testData.test_parameters.test_frequency}
                      onChange={(e) => setTestData(prev => ({
                        ...prev,
                        test_parameters: { ...prev.test_parameters, test_frequency: e.target.value }
                      }))}
                      placeholder="e.g., 500MHz"
                    />
                  </div>
                  <div>
                    <Label>Test Environment</Label>
                    <Input
                      value={testData.test_parameters.test_environment}
                      onChange={(e) => setTestData(prev => ({
                        ...prev,
                        test_parameters: { ...prev.test_parameters, test_environment: e.target.value }
                      }))}
                      placeholder="e.g., 23°C, 45% RH"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Test Results</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Measurement 1</Label>
                    <Input
                      value={testData.results.measurement_1}
                      onChange={(e) => setTestData(prev => ({
                        ...prev,
                        results: { ...prev.results, measurement_1: e.target.value }
                      }))}
                      placeholder="e.g., 0.2dB loss"
                    />
                  </div>
                  <div>
                    <Label>Measurement 2</Label>
                    <Input
                      value={testData.results.measurement_2}
                      onChange={(e) => setTestData(prev => ({
                        ...prev,
                        results: { ...prev.results, measurement_2: e.target.value }
                      }))}
                      placeholder="e.g., 45ns delay"
                    />
                  </div>
                  <div>
                    <Label>Measurement 3</Label>
                    <Input
                      value={testData.results.measurement_3}
                      onChange={(e) => setTestData(prev => ({
                        ...prev,
                        results: { ...prev.results, measurement_3: e.target.value }
                      }))}
                      placeholder="e.g., -15dB return loss"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Pass/Fail Status</Label>
                <Select 
                  value={testData.pass_fail_status} 
                  onValueChange={(value: 'pass' | 'fail' | 'conditional') => 
                    setTestData(prev => ({ ...prev, pass_fail_status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="conditional">Conditional Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={testData.notes}
                  onChange={(e) => setTestData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the test..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddTest(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTest} disabled={!testData.test_type}>
                  Save Test Result
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}