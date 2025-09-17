import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, MapPin, Play, Square, AlertCircle } from 'lucide-react';
import { useTimeTracking } from '@/hooks/useTimeTracking';
import { useProjects } from '@/hooks/useProjects';
import { useLocations } from '@/hooks/useLocations';
import { useWorkOrders } from '@/hooks/useWorkOrders';

interface TimeTrackingCardProps {
  employeeId?: string;
}

export function TimeTrackingCard({ employeeId }: TimeTrackingCardProps) {
  const { currentEntry, locationEnabled, checkIn, checkOut, loading } = useTimeTracking(employeeId);
  const { projects } = useProjects();
  const { locations } = useLocations();
  const { workOrders } = useWorkOrders();
  
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState('');
  const [checkOutNotes, setCheckOutNotes] = useState('');

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString();
  };

  const getElapsedTime = () => {
    if (!currentEntry) return '00:00:00';
    
    const start = new Date(currentEntry.check_in_time);
    const now = new Date();
    const elapsed = now.getTime() - start.getTime();
    
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCheckIn = async () => {
    await checkIn(
      selectedProject || undefined,
      selectedLocation || undefined,
      selectedWorkOrder || undefined
    );
  };

  const handleCheckOut = async () => {
    await checkOut(checkOutNotes || undefined);
    setCheckOutNotes('');
  };

  if (!employeeId) {
    return (
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            Employee ID required for time tracking
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Time Tracking
          {!locationEnabled && (
            <Badge variant="destructive" className="text-xs">
              No GPS
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {currentEntry ? (
          // Currently checked in
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="default" className="bg-green-100 text-green-800 text-lg px-4 py-2">
                <Play className="h-4 w-4 mr-2" />
                Checked In
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-primary">
                {getElapsedTime()}
              </div>
              <div className="text-sm text-muted-foreground">
                Started at {new Date(currentEntry.check_in_time).toLocaleTimeString()}
              </div>
            </div>

            {currentEntry.check_in_location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Location recorded (±{currentEntry.check_in_location.accuracy.toFixed(0)}m)
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="checkOutNotes">Check-out Notes (Optional)</Label>
              <Textarea
                id="checkOutNotes"
                value={checkOutNotes}
                onChange={(e) => setCheckOutNotes(e.target.value)}
                placeholder="Add notes about work completed..."
                rows={3}
              />
            </div>

            <Button 
              onClick={handleCheckOut} 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <Square className="h-4 w-4 mr-2" />
              Check Out
            </Button>
          </div>
        ) : (
          // Not checked in
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-semibold">Ready to Start</div>
              <div className="text-sm text-muted-foreground">
                Current time: {getCurrentTime()}
              </div>
            </div>

            <div className="space-y-3">
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

            <Button 
              onClick={handleCheckIn} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Check In
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}