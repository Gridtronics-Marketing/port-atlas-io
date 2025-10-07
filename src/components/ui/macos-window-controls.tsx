import * as React from "react";
import { X, Minus, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MacOSWindowControlsProps {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMinimized: boolean;
  isMaximized: boolean;
  className?: string;
}

export const MacOSWindowControls = ({
  onClose,
  onMinimize,
  onMaximize,
  isMinimized,
  isMaximized,
  className,
}: MacOSWindowControlsProps) => {
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  return (
    <div className={cn("absolute top-3 left-3 z-50 flex items-center gap-2", className)}>
      {/* Red - Close */}
      <button
        onClick={onClose}
        onMouseEnter={() => setHoveredButton("close")}
        onMouseLeave={() => setHoveredButton(null)}
        className="group relative w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        style={{ backgroundColor: "#FF5F57" }}
        aria-label="Close dialog"
      >
        <X
          className={cn(
            "absolute inset-0 m-auto w-2 h-2 text-black/60 transition-opacity duration-150",
            hoveredButton === "close" ? "opacity-100" : "opacity-0"
          )}
          strokeWidth={3}
        />
      </button>

      {/* Yellow - Minimize */}
      <button
        onClick={onMinimize}
        onMouseEnter={() => setHoveredButton("minimize")}
        onMouseLeave={() => setHoveredButton(null)}
        className="group relative w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        style={{ backgroundColor: "#FFBD2E" }}
        aria-label={isMinimized ? "Restore dialog" : "Minimize dialog"}
      >
        <Minus
          className={cn(
            "absolute inset-0 m-auto w-2 h-2 text-black/60 transition-opacity duration-150",
            hoveredButton === "minimize" ? "opacity-100" : "opacity-0"
          )}
          strokeWidth={3}
        />
      </button>

      {/* Green - Maximize */}
      <button
        onClick={onMaximize}
        onMouseEnter={() => setHoveredButton("maximize")}
        onMouseLeave={() => setHoveredButton(null)}
        className="group relative w-3 h-3 rounded-full transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        style={{ backgroundColor: "#28C840" }}
        aria-label={isMaximized ? "Restore dialog" : "Maximize dialog"}
      >
        {isMaximized ? (
          <Minimize2
            className={cn(
              "absolute inset-0 m-auto w-2 h-2 text-black/60 transition-opacity duration-150",
              hoveredButton === "maximize" ? "opacity-100" : "opacity-0"
            )}
            strokeWidth={3}
          />
        ) : (
          <Maximize2
            className={cn(
              "absolute inset-0 m-auto w-2 h-2 text-black/60 transition-opacity duration-150",
              hoveredButton === "maximize" ? "opacity-100" : "opacity-0"
            )}
            strokeWidth={3}
          />
        )}
      </button>
    </div>
  );
};
