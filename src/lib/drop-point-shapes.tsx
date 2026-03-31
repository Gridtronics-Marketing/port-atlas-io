import React from 'react';

interface DropPointShapeProps {
  type: string;
  size?: number;
  className?: string;
}

/**
 * Renders an SVG shape based on drop point type.
 * Uses currentColor so it inherits the parent's color for status-based theming.
 */
export const DropPointShape = ({ type, size = 24, className = '' }: DropPointShapeProps) => {
  const normalized = type?.toLowerCase().replace(/[\s_-]/g, '') || 'other';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={{ display: 'block' }}
    >
      {getShapePath(normalized)}
    </svg>
  );
};

function getShapePath(type: string): React.ReactNode {
  switch (type) {
    // Data — Triangle
    case 'data':
      return <polygon points="12,2 22,20 2,20" />;

    // WiFi — Circle
    case 'wifi':
    case 'wireless':
      return <circle cx="12" cy="12" r="10" />;

    // Camera — Square with triangle lens
    case 'camera':
    case 'security':
      return (
        <>
          <rect x="2" y="6" width="14" height="12" rx="1" />
          <polygon points="16,9 22,6 22,18 16,15" />
        </>
      );

    // MDF — 5-point star
    case 'mdf':
      return <polygon points="12,1 15.09,8.26 23,9.27 17.5,14.14 18.82,22 12,18.27 5.18,22 6.5,14.14 1,9.27 8.91,8.26" />;

    // IDF — 5-point star (same as MDF)
    case 'idf':
      return <polygon points="12,1 15.09,8.26 23,9.27 17.5,14.14 18.82,22 12,18.27 5.18,22 6.5,14.14 1,9.27 8.91,8.26" />;

    // Access Control — Standing rectangle
    case 'accesscontrol':
    case 'access_control':
      return <rect x="6" y="1" width="12" height="22" rx="2" />;

    // AV — Square with antenna
    case 'av':
    case 'a/v':
      return (
        <>
          <rect x="4" y="8" width="16" height="14" rx="2" />
          <line x1="12" y1="8" x2="12" y2="2" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="2" r="2" />
        </>
      );

    // Speaker — Speaker icon with sound waves
    case 'speaker':
      return (
        <>
          <rect x="2" y="8" width="6" height="8" />
          <polygon points="8,8 15,3 15,21 8,16" />
          <path d="M18,9 Q21,12 18,15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M20,6 Q24,12 20,18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );

    // Other / fallback — Diamond
    default:
      return <polygon points="12,1 23,12 12,23 1,12" />;
  }
}

/**
 * Returns the shape label for the legend
 */
export const dropPointShapeTypes = [
  { type: 'data', label: 'Data' },
  { type: 'wifi', label: 'WiFi' },
  { type: 'camera', label: 'Camera' },
  { type: 'mdf', label: 'MDF' },
  { type: 'idf', label: 'IDF' },
  { type: 'accesscontrol', label: 'Access Control' },
  { type: 'av', label: 'AV' },
  { type: 'speaker', label: 'Speaker' },
  { type: 'other', label: 'Other' },
];

/**
 * Draw a drop point shape on a canvas context (for composite export).
 */
export function drawDropPointShape(
  ctx: CanvasRenderingContext2D,
  type: string,
  cx: number,
  cy: number,
  size: number
) {
  const s = size / 2;
  const normalized = type?.toLowerCase().replace(/[\s_-]/g, '') || 'other';

  ctx.beginPath();

  switch (normalized) {
    case 'data': // triangle
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s, cy + s);
      ctx.lineTo(cx - s, cy + s);
      ctx.closePath();
      break;

    case 'wifi':
    case 'wireless': // circle
      ctx.arc(cx, cy, s, 0, Math.PI * 2);
      break;

    case 'camera':
    case 'security': { // camera shape
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
    case 'idf': { // 5-point star
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
    case 'access_control': // standing rectangle
      ctx.rect(cx - s * 0.5, cy - s, s, s * 2);
      break;

    case 'av':
    case 'a/v': { // square with antenna
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

    case 'speaker': { // speaker with sound waves
      const bw = s * 0.5;
      const bh = s * 0.7;
      ctx.rect(cx - s * 0.8, cy - bh / 2, bw, bh);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.8 + bw, cy - bh / 2);
      ctx.lineTo(cx + s * 0.2, cy - s);
      ctx.lineTo(cx + s * 0.2, cy + s);
      ctx.lineTo(cx - s * 0.8 + bw, cy + bh / 2);
      ctx.closePath();
      ctx.fill();
      // sound waves
      ctx.beginPath();
      ctx.arc(cx + s * 0.3, cy, s * 0.4, -Math.PI / 4, Math.PI / 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + s * 0.3, cy, s * 0.7, -Math.PI / 4, Math.PI / 4);
      ctx.stroke();
      break;
    }

    default: // diamond
      ctx.moveTo(cx, cy - s);
      ctx.lineTo(cx + s, cy);
      ctx.lineTo(cx, cy + s);
      ctx.lineTo(cx - s, cy);
      ctx.closePath();
      break;
  }

  ctx.fill();
}
