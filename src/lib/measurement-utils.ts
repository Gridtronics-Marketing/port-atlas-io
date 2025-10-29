export interface MeasurementScale {
  pixelsPerUnit: number;
  unit: string;
}

export interface DistanceMeasurement {
  type: "distance";
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pixelDistance: number;
  realDistance?: number;
  unit?: string;
}

export interface AngleMeasurement {
  type: "angle";
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  angle: number;
}

export interface AreaMeasurement {
  type: "area";
  id: string;
  points: { x: number; y: number }[];
  pixelArea: number;
  realArea?: number;
  unit?: string;
}

export type Measurement = DistanceMeasurement | AngleMeasurement | AreaMeasurement;

export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function calculateAngle(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number {
  const angle1 = Math.atan2(y1 - y2, x1 - x2);
  const angle2 = Math.atan2(y3 - y2, x3 - x2);
  let angle = Math.abs(angle1 - angle2) * (180 / Math.PI);
  
  if (angle > 180) {
    angle = 360 - angle;
  }
  
  return Math.round(angle * 10) / 10;
}

export function calculatePolygonArea(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area / 2);
}

export function convertDistance(pixelDistance: number, scale?: MeasurementScale): string {
  if (!scale) {
    return `${Math.round(pixelDistance)} px`;
  }
  
  const realDistance = pixelDistance / scale.pixelsPerUnit;
  return `${realDistance.toFixed(2)} ${scale.unit}`;
}

export function convertArea(pixelArea: number, scale?: MeasurementScale): string {
  if (!scale) {
    return `${Math.round(pixelArea)} px²`;
  }
  
  const realArea = pixelArea / Math.pow(scale.pixelsPerUnit, 2);
  return `${realArea.toFixed(2)} ${scale.unit}²`;
}