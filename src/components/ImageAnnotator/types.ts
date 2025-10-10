export type MarkerColor = 'green' | 'red' | 'underline' | 'eraser';

export interface Marker {
  x: number;
  y: number;
  size: number;
  color: 'green' | 'red';
}

export interface Underline {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface HistoryState {
  markers: Marker[];
  underlines: Underline[];
  greenCount: number;
  redCount: number;
}

export interface ImageAnnotatorProps {
  imageUrl: string;
  onSave: (annotatedImageDataUrl: string) => void;
}
