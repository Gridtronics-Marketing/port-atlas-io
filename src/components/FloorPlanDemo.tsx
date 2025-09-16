import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Info, 
  Upload, 
  Pencil, 
  MousePointer, 
  Square, 
  Circle,
  Type,
  Download,
  Layers
} from "lucide-react";

interface FloorPlanDemoProps {
  floorNumber: number;
  totalFloors: number;
  onStartEditor: () => void;
}

export const FloorPlanDemo = ({ floorNumber, totalFloors, onStartEditor }: FloorPlanDemoProps) => {
  return (
    <div className="space-y-6">
      {/* Demo Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Mode:</strong> No floor plan uploaded for Floor {floorNumber}. 
          Click "Start Floor Plan Editor" below to try the interactive editor with a blank canvas.
        </AlertDescription>
      </Alert>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Floor Plans
            </CardTitle>
            <CardDescription>
              Add actual building floor plans, blueprints, or CAD drawings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">JPG/PNG</Badge>
                <span>Building photos and scanned plans</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">PDF</Badge>
                <span>Architect drawings and blueprints</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">DWG</Badge>
                <span>AutoCAD and engineering files</span>
              </div>
              <p className="text-muted-foreground text-xs mt-3">
                Each floor can have its own layout. Upload during location creation or add them later.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Interactive Editor
            </CardTitle>
            <CardDescription>
              Draw, annotate, and place drop points on floor plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                  <span>Select & Move</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                  <span>Free Drawing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Square className="h-4 w-4 text-muted-foreground" />
                  <span>Rectangles</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span>Circles</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Type className="h-4 w-4 text-muted-foreground" />
                  <span>Text Labels</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span>Save Plans</span>
                </div>
              </div>
              <p className="text-muted-foreground text-xs mt-3">
                Mark drop point locations, cable runs, equipment areas, and room labels directly on the floor plan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Floor Support */}
      {totalFloors > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Multi-Floor Support
            </CardTitle>
            <CardDescription>
              This location has {totalFloors} floors - each can have its own floor plan and drop points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {Array.from({ length: totalFloors }, (_, i) => i + 1).map((floor) => (
                <Badge 
                  key={floor} 
                  variant={floor === floorNumber ? "default" : "outline"}
                  className="text-xs"
                >
                  Floor {floor}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Use the floor selector above to switch between floors. Each floor maintains its own:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Individual floor plan layouts</li>
              <li>• Separate drop point locations</li>
              <li>• Independent drawings and annotations</li>
              <li>• Floor-specific equipment placement</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Try Editor Button */}
      <div className="text-center">
        <Button 
          onClick={onStartEditor}
          className="bg-gradient-primary hover:bg-primary-hover"
          size="lg"
        >
          <Pencil className="h-5 w-5 mr-2" />
          Start Floor Plan Editor (Floor {floorNumber})
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Try the interactive editor with a blank canvas - you can draw, add shapes, and place markers
        </p>
      </div>
    </div>
  );
};