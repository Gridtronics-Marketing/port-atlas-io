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

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      selection: false,
      renderOnAddRemove: true,
    });

    // Disable all interactions
    canvas.isDrawingMode = false;
    canvas.selection = false;

    fabricCanvasRef.current = canvas;

    // Load the saved drawing data
    if (drawingData) {
      try {
        console.log("[DrawingViewer] Loading drawing data");
        canvas.loadFromJSON(drawingData, () => {
          canvas.renderAll();
          
          // Make all objects non-interactive
          canvas.forEachObject((obj) => {
            obj.selectable = false;
            obj.evented = false;
          });
          
          console.log("[DrawingViewer] Drawing data loaded successfully");
        });
      } catch (error) {
        console.error("[DrawingViewer] Error loading drawing data:", error);
      }
    }

    return () => {
      console.log("[DrawingViewer] Disposing canvas");
      canvas.dispose();
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
