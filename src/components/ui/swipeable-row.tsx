import * as React from "react";
import { useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  disabled?: boolean;
  className?: string;
}

const SWIPE_THRESHOLD = 80;

export function SwipeableRow({ 
  children, 
  onDelete, 
  disabled = false,
  className 
}: SwipeableRowProps) {
  const [offset, setOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || disabled) return;
    currentX.current = e.touches[0].clientX;
    const diff = startX.current - currentX.current;
    // Only allow swiping left (positive diff), max 120px
    const newOffset = Math.min(Math.max(diff, 0), 120);
    setOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (!isSwiping || disabled) return;
    setIsSwiping(false);
    
    if (offset >= SWIPE_THRESHOLD) {
      // Keep the row swiped open to show delete button
      setOffset(SWIPE_THRESHOLD);
    } else {
      // Snap back
      setOffset(0);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setOffset(0);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOffset(0);
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Delete action background */}
      <div 
        className="absolute inset-y-0 right-0 flex items-center bg-destructive"
        style={{ width: `${Math.max(offset, 0)}px` }}
      >
        {offset >= SWIPE_THRESHOLD && (
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-full h-full text-destructive-foreground hover:bg-destructive/90 transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Swipeable content */}
      <div
        className={cn(
          "relative bg-background transition-transform",
          !isSwiping && "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Tap to cancel overlay when swiped */}
      {offset >= SWIPE_THRESHOLD && (
        <div 
          className="absolute inset-0 z-10" 
          style={{ right: `${offset}px` }}
          onClick={handleCancel}
        />
      )}
    </div>
  );
}
