import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { repairFloorPlanFiles } from '@/lib/storage-utils';
import { type Location } from '@/hooks/useLocations';

interface FloorPlanRepairToolProps {
  location: Location;
  onRepairComplete?: () => void;
}

export const FloorPlanRepairTool = ({ location, onRepairComplete }: FloorPlanRepairToolProps) => {
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResults, setRepairResults] = useState<string | null>(null);
  const { toast } = useToast();

  const hasFloorPlanFiles = location.floor_plan_files && Object.keys(location.floor_plan_files).length > 0;
  const expectedFloors = Array.from({ length: location.floors }, (_, i) => i + 1);
  const missingFloors = expectedFloors.filter(floor => !location.floor_plan_files?.[floor]);

  const handleRepair = async () => {
    setIsRepairing(true);
    setRepairResults(null);
    
    try {
      await repairFloorPlanFiles(location.id);
      setRepairResults('success');
      toast({
        title: "Repair Successful",
        description: "Floor plan files have been repaired and linked to the location.",
      });
      onRepairComplete?.();
    } catch (error) {
      console.error('Repair failed:', error);
      setRepairResults('error');
      toast({
        title: "Repair Failed",
        description: "Failed to repair floor plan files. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  if (hasFloorPlanFiles && missingFloors.length === 0) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          All floor plan files are properly linked and accessible.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <AlertCircle className="h-5 w-5" />
          Floor Plan File Issues Detected
        </CardTitle>
        <CardDescription>
          Some floor plan files may not be properly linked to this location.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Expected Floors</p>
            <div className="flex gap-1 flex-wrap">
              {expectedFloors.map(floor => (
                <Badge 
                  key={floor} 
                  variant={location.floor_plan_files?.[floor] ? "default" : "destructive"}
                >
                  Floor {floor}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Database Status</p>
            <Badge variant={hasFloorPlanFiles ? "default" : "destructive"}>
              {hasFloorPlanFiles ? 'Files Linked' : 'No Files Linked'}
            </Badge>
          </div>
        </div>

        {missingFloors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Missing floor plan links for: {missingFloors.map(f => `Floor ${f}`).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRepair}
            disabled={isRepairing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRepairing ? 'animate-spin' : ''}`} />
            {isRepairing ? 'Repairing...' : 'Repair Floor Plan Links'}
          </Button>
          
          {repairResults === 'success' && (
            <Badge variant="default" className="bg-success text-success-foreground">
              <CheckCircle className="h-3 w-3 mr-1" />
              Repaired
            </Badge>
          )}
          
          {repairResults === 'error' && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              Failed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};