import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FloorPlanEditor } from "@/components/FloorPlanEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { OfflineIndicator } from "@/components/OfflineIndicator";

export default function FloorPlanEditorPage() {
  const [searchParams] = useSearchParams();
  const [editorKey, setEditorKey] = useState(0);
  
  const mode = searchParams.get('mode') || 'draw';
  const floor = searchParams.get('floor') || '1';
  const riserName = searchParams.get('name') || 'Riser Diagram';
  
  useEffect(() => {
    // Force re-render of editor when params change
    setEditorKey(prev => prev + 1);
  }, [mode, floor]);

  if (!mode || !floor) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Invalid URL parameters. Please make sure mode and floor are specified.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = (canvasData: any) => {
    console.log('Floor plan saved:', canvasData);
    // Here you could implement saving logic or close the window
    if (window.opener) {
      // Notify parent window if opened as popup
      window.opener.postMessage({ 
        type: 'floorPlanSaved', 
        data: canvasData, 
        floor: parseInt(floor) 
      }, '*');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <OfflineIndicator />
      </div>
      <div className="container mx-auto p-4">
        <FloorPlanEditor
          key={editorKey}
          floorNumber={mode === 'riser' ? 0 : parseInt(floor)}
          locationName={mode === 'riser' ? riserName : `Floor ${floor} Editor`}
          onSave={handleSave}
          mode={mode as 'draw' | 'riser'}
        />
      </div>
    </div>
  );
}