import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas } from "fabric";

interface FloorPlanDrawingViewerProps {
  width: number;
  height: number;
  drawingData: string;
}

export const FloorPlanDrawingViewer = ({
  width,
  height,
  drawingData,
}: FloorPlanDrawingViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    console.log("[DrawingViewer] Initializing read-only canvas");
    
    let isMounted = true;
    let canvas: FabricCanvas | null = null;

    // Small delay to ensure DOM is ready and previous canvas is fully disposed
    const initTimer = setTimeout(() => {
      if (!isMounted || !canvasRef.current) return;

      try {
        canvas = new FabricCanvas(canvasRef.current, {
          width,
          height,
          selection: false,
          renderOnAddRemove: true,
        });

        // Disable all interactions
        canvas.isDrawingMode = false;
        canvas.selection = false;

        fabricCanvasRef.current = canvas;

        // Load the saved drawing data after canvas is initialized
        if (drawingData && canvas) {
          console.log("[DrawingViewer] Loading drawing data");
          canvas.loadFromJSON(drawingData, () => {
            if (!canvas || !isMounted) return;
            
            canvas.renderAll();
            
            // Make all objects non-interactive
            canvas.forEachObject((obj) => {
              obj.selectable = false;
              obj.evented = false;
            });
            
            console.log("[DrawingViewer] Drawing data loaded successfully");
          });
        }
      } catch (error) {
        console.error("[DrawingViewer] Error initializing canvas:", error);
      }
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      
      if (canvas) {
        try {
          console.log("[DrawingViewer] Disposing canvas");
          canvas.dispose();
        } catch (error) {
          console.error("[DrawingViewer] Error disposing canvas:", error);
        }
      }
      fabricCanvasRef.current = null;
    };
  }, [width, height, drawingData]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
};
