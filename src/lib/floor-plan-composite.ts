/**
 * Creates a composite floor plan image that includes the base floor plan,
 * canvas drawings, drop points, and room views.
 */

export interface DropPointMarker {
  x: number;
  y: number;
  label: string;
  type: string;
  status: string;
}

export interface RoomViewMarker {
  x: number;
  y: number;
  label: string;
}

export interface CompositeOptions {
  baseImageUrl?: string;
  canvasDrawingDataUrl?: string;
  dropPoints: DropPointMarker[];
  roomViews: RoomViewMarker[];
  width: number;
  height: number;
}

/**
 * Load an image from a URL
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Get color for drop point status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'planned':
      return '#6b7280'; // gray
    case 'installed':
      return '#3b82f6'; // blue
    case 'tested':
      return '#eab308'; // yellow
    case 'active':
      return '#22c55e'; // green
    case 'inactive':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Draw a drop point marker on the canvas
 */
function drawDropPointMarker(
  ctx: CanvasRenderingContext2D,
  marker: DropPointMarker,
  showLabels: boolean = true
) {
  const x = (marker.x / 100) * ctx.canvas.width;
  const y = (marker.y / 100) * ctx.canvas.height;
  const color = getStatusColor(marker.status);

  // Draw circle
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw label if enabled
  if (showLabels) {
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    
    // Draw text with white outline for readability
    const textX = x + 12;
    const textY = y + 4;
    ctx.strokeText(marker.label, textX, textY);
    ctx.fillText(marker.label, textX, textY);
  }
}

/**
 * Draw a room view marker on the canvas
 */
function drawRoomViewMarker(
  ctx: CanvasRenderingContext2D,
  marker: RoomViewMarker,
  showLabels: boolean = true
) {
  const x = (marker.x / 100) * ctx.canvas.width;
  const y = (marker.y / 100) * ctx.canvas.height;

  // Draw camera icon (simple rectangle with circle)
  ctx.beginPath();
  ctx.rect(x - 8, y - 6, 16, 12);
  ctx.fillStyle = '#9333ea'; // purple
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw lens circle
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Draw label if enabled
  if (showLabels) {
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#9333ea';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    
    const textX = x + 12;
    const textY = y + 4;
    ctx.strokeText(marker.label, textX, textY);
    ctx.fillText(marker.label, textX, textY);
  }
}

/**
 * Create a composite floor plan image with all annotations
 */
export async function createCompositeFloorPlan(
  options: CompositeOptions
): Promise<string> {
  const {
    baseImageUrl,
    canvasDrawingDataUrl,
    dropPoints = [],
    roomViews = [],
    width,
    height,
  } = options;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Load and draw base image if provided
  if (baseImageUrl) {
    try {
      const baseImage = await loadImage(baseImageUrl);
      ctx.drawImage(baseImage, 0, 0, width, height);
    } catch (error) {
      console.warn('Failed to load base image:', error);
    }
  }

  // Load and overlay canvas drawing if provided
  if (canvasDrawingDataUrl) {
    try {
      const drawingImage = await loadImage(canvasDrawingDataUrl);
      ctx.drawImage(drawingImage, 0, 0, width, height);
    } catch (error) {
      console.warn('Failed to load canvas drawing:', error);
    }
  }

  // Draw drop points
  dropPoints.forEach(marker => {
    drawDropPointMarker(ctx, marker, true);
  });

  // Draw room views
  roomViews.forEach(marker => {
    drawRoomViewMarker(ctx, marker, true);
  });

  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
}
