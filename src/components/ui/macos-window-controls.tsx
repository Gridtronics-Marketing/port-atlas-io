import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  onClose: () => void;
  className?: string;
  CloseWrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

export const MacOSWindowControls = ({
  onClose,
  className,
  CloseWrapper = React.Fragment,
}: BackButtonProps) => {
  return (
    <div className={cn("absolute top-3 left-3 z-50 bg-background rounded-full shadow-sm", className)}>
      <CloseWrapper>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      </CloseWrapper>
    </div>
  );
};
