import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage } from "fabric";
import { Loader2 } from "lucide-react";

interface PhotoAnnotationViewerProps {
  photoUrl: string;
  annotationData?: string;
  className?: string;
}

export const PhotoAnnotationViewer = ({
  photoUrl,
  annotationData,
  className = "",
}: PhotoAnnotationViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = photoUrl;

    img.onload = () => {
      const containerWidth = containerRef.current?.clientWidth || 800;
      const containerHeight = containerRef.current?.clientHeight || 600;

      let displayWidth = img.width;
      let displayHeight = img.height;

      // Scale to fit container
      const widthScale = containerWidth / displayWidth;
      const heightScale = containerHeight / displayHeight;
      const scale = Math.min(widthScale, heightScale, 1);

      displayWidth = displayWidth * scale;
      displayHeight = displayHeight * scale;

      const canvas = new FabricCanvas(canvasRef.current, {
        width: displayWidth,
        height: displayHeight,
        selection: false,
        interactive: false,
      });

      // Load photo as background
      FabricImage.fromURL(photoUrl, { crossOrigin: "anonymous" }).then((fabricImg) => {
        fabricImg.scaleToWidth(displayWidth);
        fabricImg.scaleToHeight(displayHeight);
        canvas.backgroundImage = fabricImg;

        // Load annotations if they exist
        if (annotationData) {
          try {
            canvas.loadFromJSON(annotationData, () => {
              // Make all objects non-selectable and non-interactive
              canvas.getObjects().forEach(obj => {
                obj.selectable = false;
                obj.evented = false;
              });
              canvas.renderAll();
              setIsLoading(false);
            });
          } catch (error) {
            console.error("Error loading annotations:", error);
            canvas.renderAll();
            setIsLoading(false);
          }
        } else {
          canvas.renderAll();
          setIsLoading(false);
        }
      }).catch((error) => {
        console.error("Error loading image:", error);
        setIsLoading(false);
      });

      return () => {
        canvas.dispose();
      };
    };

    img.onerror = () => {
      setIsLoading(false);
    };
  }, [photoUrl, annotationData]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="mx-auto"
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};
