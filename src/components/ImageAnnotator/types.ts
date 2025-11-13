export type MarkerColor = 'green' | 'red' | 'underline' | 'eraser' | 'crop';

export interface Marker {
  x: number;
  y: number;
  size: number;
  color: 'green' | 'red';
  errorType?: string;
}

export interface Underline {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  errorType?: string;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HistoryState {
  markers: Marker[];
  underlines: Underline[];
  greenCount: number;
  redCount: number;
  cropArea?: CropArea | null;
  errorTypes?: Record<string, number>;
}

export interface ImageAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedImageDataUrl: string) => void;
  savedMarkup?: string | null;
}