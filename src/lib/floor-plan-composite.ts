/**
 * Creates a composite floor plan image that includes the base floor plan,
 * canvas drawings, drop points, and room views.
 */

import { formatCableLabel } from './cable-label-utils';

export interface DropPointMarker {
  x: number;
  y: number;
  label: string;
  type: string;
  status: string;
  typeSpecificData?: Record<string, any> | null;
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
      return '#ef4444'; // red
    case 'roughed_in':
      return '#f97316'; // orange
    case 'finished':
      return '#22c55e'; // green
    case 'tested':
      return '#22c55e'; // green
    case 'proposed':
      return '#9ca3af'; // gray
    case 'installed':
      return '#3b82f6'; // blue
    case 'active':
      return '#22c55e'; // green
    case 'inactive':
      return '#ef4444'; // red
    default:
      return '#ef4444'; // red
  }
}

/**
 * Draw a drop point marker on the canvas using type-specific shapes
 */
function drawDropPointMarker(
  ctx: CanvasRenderingContext2D,
  marker: DropPointMarker,
  showLabels: boolean = true
) {
  const x = (marker.x / 100) * ctx.canvas.width;
  const y = (marker.y / 100) * ctx.canvas.height;
  const color = getStatusColor(marker.status);

  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;

  // Import inline to avoid circular deps with tsx
  drawShapeByType(ctx, marker.type, x, y, 18);

  ctx.stroke();

  // Draw label if enabled
  if (showLabels) {
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    
    const displayLabel = formatCableLabel(marker.typeSpecificData, marker.label) || marker.label;
    const textX = x + 14;
    const textY = y + 4;
    ctx.strokeText(displayLabel, textX, textY);
    ctx.fillText(displayLabel, textX, textY);
  }
}

function drawShapeByType(ctx: CanvasRenderingContext2D, type: string, cx: number, cy: number, size: number) {
  const s = size / 2;
  const normalized = type?.toLowerCase().replace(/[\s_-]/g, '') || 'other';

  ctx.beginPath();
  switch (normalized) {
    case 'data':
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s, cy + s);
      ctx.lineTo(cx - s, cy + s);
      ctx.closePath();
      break;
    case 'wifi':
    case 'wireless':
      ctx.arc(cx, cy, s, 0, Math.PI * 2);
      break;
    case 'camera':
    case 'security': {
      const bw = s * 1.2;
      const bh = s;
      ctx.rect(cx - bw / 2 - s * 0.2, cy - bh / 2, bw, bh);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + bw / 2 - s * 0.2, cy - bh * 0.3);
      ctx.lineTo(cx + s, cy - bh / 2);
      ctx.lineTo(cx + s, cy + bh / 2);
      ctx.lineTo(cx + bw / 2 - s * 0.2, cy + bh * 0.3);
      ctx.closePath();
      break;
    }
    case 'mdf':
    case 'idf': {
      for (let i = 0; i < 5; i++) {
        const outerAngle = (Math.PI / 2) + (i * 2 * Math.PI / 5);
        const innerAngle = outerAngle + Math.PI / 5;
        const ox = cx + s * Math.cos(-outerAngle);
        const oy = cy - s * Math.sin(outerAngle);
        const ix = cx + (s * 0.4) * Math.cos(-innerAngle);
        const iy = cy - (s * 0.4) * Math.sin(innerAngle);
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      break;
    }
    case 'accesscontrol':
    case 'access_control':
      ctx.rect(cx - s * 0.5, cy - s, s, s * 2);
      break;
    case 'av':
    case 'a/v': {
      ctx.rect(cx - s * 0.7, cy - s * 0.3, s * 1.4, s * 1.3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.3);
      ctx.lineTo(cx, cy - s);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy - s, s * 0.2, 0, Math.PI * 2);
      break;
    }
    default:
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s, cy);
      ctx.lineTo(cx, cy + s);
      ctx.lineTo(cx - s, cy);
      ctx.closePath();
      break;
  }
  ctx.fill();
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
  const ctx2d = canvas.getContext('2d');

  if (!ctx2d) {
    throw new Error('Failed to get canvas context');
  }

  // Load base image first to get natural dimensions
  let baseImage: HTMLImageElement | null = null;
  if (baseImageUrl) {
    try {
      baseImage = await loadImage(baseImageUrl);
    } catch (error) {
      console.warn('Failed to load base image:', error);
    }
  }

  // Use natural image dimensions to avoid stretching; fall back to passed dimensions
  canvas.width = baseImage ? baseImage.naturalWidth : width;
  canvas.height = baseImage ? baseImage.naturalHeight : height;

  // Fill with white background
  ctx2d.fillStyle = '#ffffff';
  ctx2d.fillRect(0, 0, canvas.width, canvas.height);

  // Draw base image at its natural size
  if (baseImage) {
    ctx2d.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
  }

  // Load and overlay canvas drawing if provided
  if (canvasDrawingDataUrl) {
    try {
      const drawingImage = await loadImage(canvasDrawingDataUrl);
      ctx2d.drawImage(drawingImage, 0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.warn('Failed to load canvas drawing:', error);
    }
  }

  // Draw drop points
  dropPoints.forEach(marker => {
    drawDropPointMarker(ctx2d, marker, true);
  });

  // Draw room views
  roomViews.forEach(marker => {
    drawRoomViewMarker(ctx2d, marker, true);
  });

  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
}
