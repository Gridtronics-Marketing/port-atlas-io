import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { InteractiveFloorPlan } from "@/components/InteractiveFloorPlan";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { useToast } from "@/hooks/use-toast";

export default function FloorPlanEditorPage() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const hasAutoActivated = useRef(false);
  
  const mode = searchParams.get('mode') || 'draw';
  const floor = searchParams.get('floor') || '1';
  const locationId = searchParams.get('locationId') || 'temp-editor-location';
  const riserName = searchParams.get('name') || 'Riser Diagram';
  
  // Auto-activate annotation mode on mount
  useEffect(() => {
    if (!hasAutoActivated.current) {
      hasAutoActivated.current = true;
      
      // Give the component time to mount, then auto-activate annotation mode
      setTimeout(() => {
        const drawButton = document.querySelector('[data-draw-mode-button]') as HTMLButtonElement;
        if (drawButton) {
          drawButton.click();
          toast({
            title: "Annotation Mode Active",
            description: "Use the toolbar to annotate your floor plan",
          });
        }
      }, 500);
    }
  }, [toast]);

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

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <OfflineIndicator />
      </div>
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">
            {mode === 'riser' ? riserName : `Floor ${floor} Editor`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Annotate your floor plan with the advanced annotation tools
          </p>
        </div>
        <InteractiveFloorPlan
          locationId={locationId}
          floorNumber={mode === 'riser' ? 0 : parseInt(floor)}
          className="w-full"
        />
      </div>
    </div>
  );
}