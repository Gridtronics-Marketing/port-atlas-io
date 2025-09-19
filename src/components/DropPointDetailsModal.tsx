import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Camera, 
  FileImage, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  TestTube,
  Image as ImageIcon
} from 'lucide-react';
import { DropPoint, useDropPoints } from '@/hooks/useDropPoints';
import { useDropPointTestResults } from '@/hooks/useDropPointTestResults';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';
import { useDropPointPhotos } from '@/hooks/useDropPointPhotos';
import { useToast } from '@/hooks/use-toast';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/hooks/useAuth';
import { PhotoCaptureCard } from './PhotoCaptureCard';

interface DropPointDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dropPoint: DropPoint | null;
  locationId: string;
}

export const DropPointDetailsModal = ({
  open,
  onOpenChange,
  dropPoint,
  locationId,
}: DropPointDetailsModalProps) => {
  const [activeTab, setActiveTab] = useState('details');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<DropPoint>>({});
  const [newTestResult, setNewTestResult] = useState({
    test_type: '',
    pass_fail: 'pending' as 'pass' | 'fail' | 'pending',
    test_values: {} as Record<string, any>,
    equipment_used: '',
    notes: '',
  });

  const { updateDropPoint } = useDropPoints(locationId);
  const { testResults, loading: testResultsLoading, addTestResult, deleteTestResult } = useDropPointTestResults(dropPoint?.id);
  const { employee } = useCurrentEmployee();
  const { capturePhoto, selectFromGallery, loading: photoLoading } = usePhotoCapture();
  const { photos: dropPointPhotos, loading: photosLoading, refetch: refetchPhotos } = useDropPointPhotos(locationId);
  const { toast } = useToast();
  const { hasRole } = useUserRoles();
  const { user } = useAuth();

  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (dropPoint) {
      setFormData(dropPoint);
    }
  }, [dropPoint]);

  const handleSave = async () => {
    if (!dropPoint || !formData) return;

    try {
      await updateDropPoint(dropPoint.id, formData);
      setEditMode(false);
      toast({
        title: "Success",
        description: "Drop point updated successfully",
      });
    } catch (error) {
      console.error('Error updating drop point:', error);
    }
  };

  const handleAddTestResult = async () => {
    if (!dropPoint || !employee || !newTestResult.test_type) return;

    try {
      await addTestResult({
        drop_point_id: dropPoint.id,
        test_type: newTestResult.test_type,
        tested_by: employee.id,
        test_date: new Date().toISOString(),
        pass_fail: newTestResult.pass_fail,
        test_values: newTestResult.test_values,
        equipment_used: newTestResult.equipment_used || null,
        notes: newTestResult.notes || null,
        results: null,
        photos: null,
      });

      // Reset form
      setNewTestResult({
        test_type: '',
        pass_fail: 'pending',
        test_values: {},
        equipment_used: '',
        notes: '',
      });

      // Update drop point status based on test result
      if (newTestResult.pass_fail === 'pass') {
        await updateDropPoint(dropPoint.id, { status: 'tested' });
        setFormData(prev => ({ ...prev, status: 'tested' }));
      }
    } catch (error) {
      console.error('Error adding test result:', error);
    }
  };

  const handlePhotoCapture = async (method: 'camera' | 'gallery') => {
    if (!dropPoint) return;
    
    // Allow admins without employee profiles to capture photos
    const effectiveEmployeeId = employee?.id || (isAdmin && user ? user.id : null);
    if (!effectiveEmployeeId) return;

    try {
      const photo = method === 'camera' 
        ? await capturePhoto('drop_point', `Drop point ${dropPoint.label}`, undefined, locationId, undefined, effectiveEmployeeId)
        : await selectFromGallery('drop_point', `Drop point ${dropPoint.label}`, undefined, locationId, undefined, effectiveEmployeeId);

      if (photo) {
        toast({
          title: "Success",
          description: "Photo captured successfully",
        });
        // Refresh photos after capturing
        refetchPhotos();
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "tested":
        return "bg-primary text-primary-foreground";
      case "installed":
        return "bg-warning text-warning-foreground";
      case "planned":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getTestResultIcon = (result: string) => {
    switch (result) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  if (!dropPoint) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Drop Point: {dropPoint.label}</span>
              <Badge className={getStatusColor(formData.status || dropPoint.status)}>
                {formData.status || dropPoint.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)} size="sm">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setEditMode(true)} size="sm">
                  Edit Details
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="tests">Test Results</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>Label</Label>
                    <Input
                      value={formData.label || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label>Room</Label>
                    <Input
                      value={formData.room || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label>Floor</Label>
                    <Input
                      type="number"
                      value={formData.floor || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) || null }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label>Point Type</Label>
                    <Select
                      value={formData.point_type || dropPoint.point_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, point_type: value as any }))}
                      disabled={!editMode}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="fiber">Fiber</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="wireless">Wireless</SelectItem>
                        <SelectItem value="power">Power</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status || dropPoint.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                      disabled={!editMode}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="installed">Installed</SelectItem>
                        <SelectItem value="tested">Tested</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cable ID</Label>
                    <Input
                      value={formData.cable_id || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cable_id: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label>Patch Panel Port</Label>
                    <Input
                      value={formData.patch_panel_port || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, patch_panel_port: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <Label>Switch Port</Label>
                    <Input
                      value={formData.switch_port || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, switch_port: e.target.value }))}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>IP Address</Label>
                  <Input
                    value={formData.ip_address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, ip_address: e.target.value }))}
                    disabled={!editMode}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <Label>VLAN</Label>
                  <Input
                    value={formData.vlan || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, vlan: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                <div>
                  <Label>MAC Address</Label>
                  <Input
                    value={formData.mac_address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, mac_address: e.target.value }))}
                    disabled={!editMode}
                    placeholder="00:11:22:33:44:55"
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    disabled={!editMode}
                    rows={4}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Add New Test Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Test Type</Label>
                      <Select
                        value={newTestResult.test_type}
                        onValueChange={(value) => setNewTestResult(prev => ({ ...prev, test_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="continuity">Continuity Test</SelectItem>
                          <SelectItem value="cable_certification">Cable Certification</SelectItem>
                          <SelectItem value="network_connectivity">Network Connectivity</SelectItem>
                          <SelectItem value="signal_strength">Signal Strength</SelectItem>
                          <SelectItem value="bandwidth">Bandwidth Test</SelectItem>
                          <SelectItem value="power">Power Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Result</Label>
                      <Select
                        value={newTestResult.pass_fail}
                        onValueChange={(value) => setNewTestResult(prev => ({ ...prev, pass_fail: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="pass">Pass</SelectItem>
                          <SelectItem value="fail">Fail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Equipment Used</Label>
                      <Input
                        value={newTestResult.equipment_used}
                        onChange={(e) => setNewTestResult(prev => ({ ...prev, equipment_used: e.target.value }))}
                        placeholder="Test equipment model/serial"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={newTestResult.notes}
                      onChange={(e) => setNewTestResult(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Test details, measurements, observations..."
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={handleAddTestResult}
                    disabled={!newTestResult.test_type || !employee}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Test Result
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test History</CardTitle>
                </CardHeader>
                <CardContent>
                  {testResultsLoading ? (
                    <p>Loading test results...</p>
                  ) : testResults.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Test Type</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Tested By</TableHead>
                          <TableHead>Equipment</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testResults.map((result) => (
                          <TableRow key={result.id}>
                            <TableCell>
                              {new Date(result.test_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="capitalize">{result.test_type}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTestResultIcon(result.pass_fail)}
                                <span className="capitalize">{result.pass_fail}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {result.tester ? `${result.tester.first_name} ${result.tester.last_name}` : '—'}
                            </TableCell>
                            <TableCell>{result.equipment_used || '—'}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTestResult(result.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground">No test results recorded yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Photo Capture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handlePhotoCapture('camera')}
                      disabled={photoLoading || (!employee && !isAdmin)}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePhotoCapture('gallery')}
                      disabled={photoLoading || (!employee && !isAdmin)}
                    >
                      <FileImage className="h-4 w-4 mr-2" />
                      Select from Gallery
                    </Button>
                  </div>
                  {!employee && !isAdmin && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Employee record required for photo capture
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Existing Photos */}
              <Card>
                <CardHeader>
                  <CardTitle>Captured Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  {photosLoading ? (
                    <p className="text-sm text-muted-foreground">Loading photos...</p>
                  ) : dropPointPhotos.length > 0 ? (
                    <div className="space-y-4">
                      {dropPointPhotos.map((photoEntry) => (
                        <div key={photoEntry.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {new Date(photoEntry.created_at).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              By {photoEntry.employee ? `${photoEntry.employee.first_name} ${photoEntry.employee.last_name}` : 'Unknown'}
                            </div>
                          </div>
                          {photoEntry.work_description && (
                            <p className="text-sm font-medium">{photoEntry.work_description}</p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {photoEntry.photos.map((photoUrl, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={photoUrl}
                                  alt={`Drop point photo ${index + 1}`}
                                  className="w-full h-32 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(photoUrl, '_blank')}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                    Click to view full size
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No photos captured yet for this location.</p>
                  )}
                </CardContent>
              </Card>

              <PhotoCaptureCard 
                employeeId={employee?.id || (isAdmin && user ? user.id : undefined)}
                locationId={locationId}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Installation & Testing History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Installed By</Label>
                      <p className="text-sm text-muted-foreground">
                        {dropPoint.installer 
                          ? `${dropPoint.installer.first_name} ${dropPoint.installer.last_name}`
                          : 'Not recorded'
                        }
                      </p>
                    </div>
                    <div>
                      <Label>Installation Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {dropPoint.installed_date 
                          ? new Date(dropPoint.installed_date).toLocaleDateString()
                          : 'Not recorded'
                        }
                      </p>
                    </div>
                    <div>
                      <Label>Tested By</Label>
                      <p className="text-sm text-muted-foreground">
                        {dropPoint.tester 
                          ? `${dropPoint.tester.first_name} ${dropPoint.tester.last_name}`
                          : 'Not recorded'
                        }
                      </p>
                    </div>
                    <div>
                      <Label>Testing Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {dropPoint.tested_date 
                          ? new Date(dropPoint.tested_date).toLocaleDateString()
                          : 'Not recorded'
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(dropPoint.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(dropPoint.updated_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};