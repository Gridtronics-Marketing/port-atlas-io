import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';

export const CameraPermissionTest = () => {
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'failed' | 'permission-denied'>('idle');
  const [errorDetails, setErrorDetails] = useState<string>('');
  
  const { checkCameraPermission, capturePhoto } = usePhotoCapture();

  const runCameraTest = async () => {
    setTestResult('testing');
    setErrorDetails('');
    
    try {
      console.log('=== CAMERA PERMISSION TEST START ===');
      
      // Test 1: Check permissions
      const hasPermission = await checkCameraPermission();
      console.log('Permission check result:', hasPermission);
      
      if (!hasPermission) {
        setTestResult('permission-denied');
        setErrorDetails('Camera permission was denied or unavailable');
        return;
      }
      
      // Test 2: Try to capture a photo (will be cancelled by user)
      console.log('Testing camera access...');
      const photo = await capturePhoto('test', 'Camera permission test', undefined, undefined, undefined, 'test-user');
      
      if (photo) {
        setTestResult('success');
        console.log('=== CAMERA TEST SUCCESS ===');
      } else {
        setTestResult('failed');
        setErrorDetails('Camera opened but no photo was captured (this is normal if you cancelled)');
        console.log('=== CAMERA TEST COMPLETED (no photo captured) ===');
      }
      
    } catch (error) {
      console.error('Camera test error:', error);
      setTestResult('failed');
      setErrorDetails(error instanceof Error ? error.message : 'Unknown camera error');
    }
  };

  const getStatusIcon = () => {
    switch (testResult) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
      case 'permission-denied':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'testing':
        return <AlertCircle className="h-5 w-5 text-yellow-600 animate-pulse" />;
      default:
        return <Camera className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (testResult) {
      case 'success':
        return <Badge variant="default" className="bg-green-600">Camera Working</Badge>;
      case 'failed':
        return <Badge variant="destructive">Camera Failed</Badge>;
      case 'permission-denied':
        return <Badge variant="destructive">Permission Denied</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Camera Permission Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Status:</span>
          {getStatusBadge()}
        </div>
        
        {errorDetails && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{errorDetails}</p>
          </div>
        )}
        
        <Button 
          onClick={runCameraTest} 
          disabled={testResult === 'testing'}
          className="w-full"
        >
          <Camera className="h-4 w-4 mr-2" />
          {testResult === 'testing' ? 'Testing Camera...' : 'Test Camera Access'}
        </Button>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>This test will:</p>
          <p>1. Check camera permissions</p>
          <p>2. Try to open the camera</p>
          <p>3. You can cancel the camera to complete the test</p>
        </div>
      </CardContent>
    </Card>
  );
};