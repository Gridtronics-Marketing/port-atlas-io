import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, Wrench, FileX, RefreshCw, HardDrive } from 'lucide-react';
import { repairFloorPlanFiles, validateFileAccess, getSignedStorageUrl } from '@/lib/storage-utils';
import { toast } from 'sonner';
import { type Location } from '@/hooks/useLocations';

interface RepairResults {
  repairedFiles: Record<number, string>;
  inaccessibleFiles: string[];
  totalFiles: number;
}

interface FloorPlanRepairToolProps {
  location: Location;
  onRepairComplete?: () => void;
}

export const FloorPlanRepairTool: React.FC<FloorPlanRepairToolProps> = ({
  location,
  onRepairComplete
}) => {
  const [isRepairing, setIsRepairing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [repairResults, setRepairResults] = useState<RepairResults | null>(null);
  const [scanResults, setScanResults] = useState<{
    accessibleFiles: Array<{ floor: number; path: string; accessible: boolean }>;
    scanned: boolean;
  } | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setScanResults(null);
    
    try {
      const accessibleFiles = [];
      
      if (location.floor_plan_files) {
        for (const [floor, path] of Object.entries(location.floor_plan_files)) {
          const url = await getSignedStorageUrl('floor-plans', path as string);
          const accessible = await validateFileAccess(url);
          accessibleFiles.push({
            floor: parseInt(floor),
            path,
            accessible
          });
        }
      }
      
      setScanResults({
        accessibleFiles,
        scanned: true
      });
      
      toast.success('File accessibility scan completed');
    } catch (error) {
      console.error('Scan failed:', error);
      toast.error('Failed to scan file accessibility');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRepair = async () => {
    setIsRepairing(true);
    setRepairResults(null);
    
    try {
      const results = await repairFloorPlanFiles(location.id);
      setRepairResults(results);
      
      const successCount = Object.keys(results.repairedFiles).length;
      const failureCount = results.inaccessibleFiles.length;
      
      if (successCount > 0) {
        toast.success(`Repaired ${successCount} floor plan files`);
      }
      
      if (failureCount > 0) {
        toast.warning(`${failureCount} files are inaccessible and need attention`);
      }
      
      if (successCount === 0 && failureCount === 0) {
        toast.info('No files found to repair');
      }
      
      onRepairComplete?.();
    } catch (error) {
      console.error('Repair failed:', error);
      toast.error('Failed to repair floor plan files');
    } finally {
      setIsRepairing(false);
    }
  };

  // Check if location has any floor plan files
  const hasFloorPlanFiles = location.floor_plan_files && Object.keys(location.floor_plan_files).length > 0;
  
  // Create array of expected floors based on location.floors
  const expectedFloors = Array.from({ length: location.floors || 1 }, (_, i) => i + 1);
  
  // Check which floors are missing floor plan files
  const missingFloors = expectedFloors.filter(floor => 
    !location.floor_plan_files || !location.floor_plan_files[floor]
  );

  // Count accessible vs inaccessible files from scan results
  const accessibleCount = scanResults?.accessibleFiles.filter(f => f.accessible).length || 0;
  const inaccessibleCount = scanResults?.accessibleFiles.filter(f => !f.accessible).length || 0;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          Floor Plan Diagnostics & Repair
        </CardTitle>
        <CardDescription className="text-orange-700">
          Analyze and repair floor plan file issues. Scan for accessibility problems and fix linking issues.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Status Overview */}
        <div>
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Floor Plan Status
          </h4>
          <div className="flex gap-2 flex-wrap">
            {expectedFloors.map(floor => {
              const hasFile = location.floor_plan_files && location.floor_plan_files[floor];
              const fileData = scanResults?.accessibleFiles.find(f => f.floor === floor);
              
              let variant: "default" | "destructive" | "outline" = "destructive";
              let status = "Missing";
              
              if (hasFile) {
                if (fileData?.accessible === false) {
                  variant = "outline";
                  status = "Inaccessible";
                } else if (fileData?.accessible === true) {
                  variant = "default";
                  status = "OK";
                } else if (scanResults?.scanned) {
                  variant = "outline";
                  status = "Unknown";
                } else {
                  variant = "default";
                  status = "Linked";
                }
              }
              
              return (
                <Badge 
                  key={floor}
                  variant={variant}
                  className="text-xs"
                >
                  Floor {floor}: {status}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Scan Results */}
        {scanResults?.scanned && (
          <div>
            <h4 className="font-medium text-sm mb-2">Accessibility Scan Results</h4>
            <div className="grid grid-cols-3 gap-4 text-center p-3 bg-white rounded-lg border">
              <div>
                <div className="text-lg font-semibold text-green-600">{accessibleCount}</div>
                <div className="text-xs text-muted-foreground">Accessible</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">{inaccessibleCount}</div>
                <div className="text-xs text-muted-foreground">Inaccessible</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {scanResults.accessibleFiles.length}
                </div>
                <div className="text-xs text-muted-foreground">Total Files</div>
              </div>
            </div>
          </div>
        )}

        {/* Repair Results */}
        {repairResults && (
          <div>
            <h4 className="font-medium text-sm mb-2">Repair Results</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4 text-center p-3 bg-white rounded-lg border">
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {Object.keys(repairResults.repairedFiles).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Repaired</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">
                    {repairResults.inaccessibleFiles.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-blue-600">
                    {repairResults.totalFiles}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Found</div>
                </div>
              </div>
              
              {repairResults.inaccessibleFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-600 mb-1">Inaccessible Files:</p>
                  <div className="text-xs space-y-1">
                    {repairResults.inaccessibleFiles.map(file => (
                      <div key={file} className="font-mono bg-red-50 p-1 rounded">
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleScan}
            disabled={isScanning || !hasFloorPlanFiles}
            variant="outline"
            className="flex-1"
          >
            {isScanning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Scan Accessibility
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleRepair}
            disabled={isRepairing}
            className="flex-1"
          >
            {isRepairing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Repairing...
              </>
            ) : (
              <>
                <Wrench className="mr-2 h-4 w-4" />
                Auto Repair
              </>
            )}
          </Button>
        </div>

        {(!hasFloorPlanFiles && !repairResults) && (
          <Alert>
            <FileX className="h-4 w-4" />
            <AlertDescription>
              No floor plan files detected. Upload files using the File Manager or drag & drop files 
              with the naming format: floor_1.png, floor_2.pdf, etc.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};