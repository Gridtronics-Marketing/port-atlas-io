import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Smartphone, 
  Wifi,
  Database,
  Image,
  User
} from 'lucide-react';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
  icon: any;
}

export function MobileCameraDebugger() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { checkCameraPermission } = usePhotoCapture();
  const { employee } = useCurrentEmployee();
  const { user } = useAuth();
  const { toast } = useToast();

  const updateResult = (index: number, status: TestResult['status'], message: string) => {
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, status, message } : result
    ));
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    const initialTests: TestResult[] = [
      { name: 'Platform Detection', status: 'pending', message: 'Checking...', icon: Smartphone },
      { name: 'Authentication', status: 'pending', message: 'Checking...', icon: User },
      { name: 'Employee Profile', status: 'pending', message: 'Checking...', icon: User },
      { name: 'Camera Permissions', status: 'pending', message: 'Checking...', icon: Camera },
      { name: 'Network Connection', status: 'pending', message: 'Checking...', icon: Wifi },
      { name: 'Database Access', status: 'pending', message: 'Checking...', icon: Database },
      { name: 'Storage Access', status: 'pending', message: 'Checking...', icon: Image },
    ];
    
    setResults(initialTests);

    try {
      // Test 1: Platform Detection
      const hasCapacitor = !!(window as any).Capacitor;
      const capacitorPlatform = hasCapacitor ? (window as any).Capacitor.getPlatform() : null;
      const isWeb = !hasCapacitor || capacitorPlatform === 'web';
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      updateResult(0, 'success', 
        `Platform: ${capacitorPlatform || 'web'}, Capacitor: ${hasCapacitor ? 'Yes' : 'No'}, Mobile UA: ${isMobile ? 'Yes' : 'No'}`
      );

      // Test 2: Authentication
      if (user) {
        updateResult(1, 'success', `Authenticated as: ${user.email}`);
      } else {
        updateResult(1, 'error', 'Not authenticated');
        setIsRunning(false);
        return;
      }

      // Test 3: Employee Profile
      if (employee) {
        updateResult(2, 'success', `Employee: ${employee.first_name} ${employee.last_name} (${employee.role})`);
      } else {
        updateResult(2, 'warning', 'No employee profile found - will use auth user ID');
      }

      // Test 4: Camera Permissions
      try {
        const hasPermission = await checkCameraPermission();
        if (hasPermission) {
          updateResult(3, 'success', 'Camera permission granted');
        } else {
          updateResult(3, 'error', 'Camera permission denied');
        }
      } catch (error) {
        updateResult(3, 'error', `Camera error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test 5: Network Connection
      if (navigator.onLine) {
        updateResult(4, 'success', 'Network connection active');
      } else {
        updateResult(4, 'error', 'No network connection');
        setIsRunning(false);
        return;
      }

      // Test 6: Database Access
      try {
        const { data, error } = await supabase
          .from('daily_logs')
          .select('id')
          .limit(1);
        
        if (error) throw error;
        updateResult(5, 'success', 'Database accessible');
      } catch (error) {
        updateResult(5, 'error', `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test 7: Storage Access
      try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) throw error;
        
        const floorPlansBucket = buckets.find(b => b.name === 'floor-plans');
        if (floorPlansBucket) {
          updateResult(6, 'success', `Storage bucket accessible (${floorPlansBucket.public ? 'public' : 'private'})`);
        } else {
          updateResult(6, 'error', 'floor-plans bucket not found');
        }
      } catch (error) {
        updateResult(6, 'error', `Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Diagnostic error:', error);
      toast({
        title: 'Diagnostic Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      default: return <Badge variant="secondary">Testing...</Badge>;
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Mobile Camera Diagnostics
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Diagnostics...' : 'Run Mobile Camera Test'}
          </Button>
          
          <p className="text-sm text-muted-foreground">
            This will test all components needed for mobile camera functionality
          </p>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Test Results</h3>
            {results.map((result, index) => {
              const IconComponent = result.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <IconComponent className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{result.name}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <div className="flex items-start gap-2">
                      {getStatusIcon(result.status)}
                      <span className="text-xs text-muted-foreground break-words">
                        {result.message}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Platform Info:</strong></p>
          <p>User Agent: {navigator.userAgent}</p>
          <p>Online: {navigator.onLine ? 'Yes' : 'No'}</p>
          <p>Secure Context: {window.isSecureContext ? 'Yes' : 'No'}</p>
          <p>Capacitor: {(window as any).Capacitor ? 'Available' : 'Not Available'}</p>
        </div>
      </CardContent>
    </Card>
  );
}