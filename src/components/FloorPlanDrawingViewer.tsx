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
  const isDisposingRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || isDisposingRef.current) return;

    console.log("[DrawingViewer] Initializing read-only canvas");
    
    let isMounted = true;
    let canvas: FabricCanvas | null = null;

    // Small delay to ensure DOM is ready and previous canvas is fully disposed
    const initTimer = setTimeout(() => {
      if (!isMounted || !canvasRef.current || isDisposingRef.current) return;

      try {
        // Check if canvas already has fabric initialized
        if (canvasRef.current.hasAttribute('data-fabric')) {
          console.warn("[DrawingViewer] Canvas already initialized, skipping");
          return;
        }

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
    }, 100);

    return () => {
      isMounted = false;
      isDisposingRef.current = true;
      clearTimeout(initTimer);
      
      if (canvas || fabricCanvasRef.current) {
        try {
          console.log("[DrawingViewer] Disposing canvas");
          const canvasToDispose = canvas || fabricCanvasRef.current;
          if (canvasToDispose) {
            canvasToDispose.dispose();
          }
          // Clear the reference immediately
          if (canvasRef.current) {
            canvasRef.current.removeAttribute('data-fabric');
          }
        } catch (error) {
          console.error("[DrawingViewer] Error disposing canvas:", error);
        }
      }
      fabricCanvasRef.current = null;
      isDisposingRef.current = false;
    };
  }, [width, height, drawingData]);

  return (
    <div className="absolute top-0 left-0 pointer-events-none" style={{ zIndex: 10 }}>
      <canvas ref={canvasRef} />
    </div>
  );
};
