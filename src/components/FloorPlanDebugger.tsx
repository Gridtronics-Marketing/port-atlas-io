import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { type Location } from '@/hooks/useLocations';

interface FloorPlanDebuggerProps {
  location: Location;
}

export const FloorPlanDebugger = ({ location }: FloorPlanDebuggerProps) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [storageFiles, setStorageFiles] = useState<any[]>([]);

  const loadDebugInfo = async () => {
    try {
      // Check floor_plan_files in database
      const dbInfo = {
        floor_plan_files: location.floor_plan_files,
        floors: location.floors,
        locationId: location.id
      };

      // Check storage bucket
      const { data: files, error } = await supabase.storage
        .from('floor-plans')
        .list(location.id);

      setDebugInfo(dbInfo);
      setStorageFiles(files || []);

      console.log('Debug Info:', { dbInfo, files, error });
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, [location]);

  const testPublicUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('floor-plans')
      .getPublicUrl(filePath);
    
    console.log('Public URL for', filePath, ':', data.publicUrl);
    window.open(data.publicUrl, '_blank');
  };

  return (
    <Card className="mb-4 border-dashed border-2 border-yellow-500">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          🔍 Floor Plan Debug Info
          <Button size="sm" variant="outline" onClick={loadDebugInfo}>
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-sm mb-2">Database Info:</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Storage Files ({storageFiles.length}):</h4>
          <div className="space-y-1">
            {storageFiles.map((file) => (
              <div key={file.name} className="flex items-center justify-between text-xs bg-muted p-2 rounded">
                <span>{file.name}</span>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">
                    {(file.metadata?.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-5 px-2 text-xs"
                    onClick={() => testPublicUrl(`${location.id}/${file.name}`)}
                  >
                    Test URL
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm mb-2">Expected Files:</h4>
          {Array.from({ length: location.floors }, (_, i) => i + 1).map((floor) => {
            const expectedPath = `${location.id}/floor_${floor}`;
            const dbFilePath = debugInfo?.floor_plan_files?.[floor];
            const storageFile = storageFiles.find(f => f.name.startsWith(`floor_${floor}`));
            
            return (
              <div key={floor} className="text-xs bg-muted p-2 rounded mb-1">
                <div>Floor {floor}:</div>
                <div className="ml-2">
                  <div>DB Path: {dbFilePath || 'Not set'}</div>
                  <div>Storage File: {storageFile?.name || 'Not found'}</div>
                  <div>Match: {dbFilePath && storageFile ? '✅' : '❌'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};