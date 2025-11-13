import { MouseEvent } from 'react';
import { MarkerColor, Marker, Underline } from '../types';

export const useCheckModalMouseHandlers = (
  markerColor: MarkerColor,
  markerSize: number,
  markers: Marker[],
  underlines: Underline[],
  greenCount: number,
  redCount: number,
  underlineStart: { x: number; y: number } | null,
  isDrawing: boolean,
  markersCanvasRef: React.RefObject<HTMLCanvasElement>,
  onMarkersChange: (markers: Marker[]) => void,
  onUnderlinesChange: (underlines: Underline[]) => void,
  onCountsChange: (green: number, red: number) => void,
  onUnderlineStartChange: (start: { x: number; y: number } | null) => void,
  setIsDrawing: (drawing: boolean) => void,
  setPendingMarker: (marker: { x: number; y: number } | null) => void,
  setShowErrorTypeModal: (show: boolean) => void
) => {
  const pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleErase = (x: number, y: number) => {
    const eraseRadius = markerSize;
    
    let greenRemoved = 0;
    let redRemoved = 0;
    
    const newMarkers = markers.filter(marker => {
      const distance = Math.sqrt(Math.pow(marker.x - x, 2) + Math.pow(marker.y - y, 2));
      if (distance < eraseRadius + marker.size / 2) {
        if (marker.color === 'green') {
          greenRemoved++;
        } else {
          redRemoved++;
        }
        return false;
      }
      return true;
    });

    const newUnderlines = underlines.filter(underline => {
      const distToLine = pointToLineDistance(
        x, y,
        underline.x1, underline.y1,
        underline.x2, underline.y2
      );
      if (distToLine < eraseRadius) {
        greenRemoved++;
        return false;
      }
      return true;
    });

    if (greenRemoved > 0 || redRemoved > 0) {
      onCountsChange(
        Math.max(0, greenCount - greenRemoved),
        Math.max(0, redCount - redRemoved)
      );
    }

    onMarkersChange(newMarkers);
    onUnderlinesChange(newUnderlines);
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    if (markerColor === 'crop') return;

    const rect = markersCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (markerColor === 'underline') {
      if (!underlineStart) {
        onUnderlineStartChange({ x, y });
      } else {
        setPendingMarker({ x, y });
        setShowErrorTypeModal(true);
      }
      return;
    }

    if (markerColor === 'eraser') {
      handleErase(x, y);
      setIsDrawing(true);
      return;
    }

    if (markerColor === 'green' || markerColor === 'red') {
      if (markerColor === 'green') {
        setPendingMarker({ x, y });
        setShowErrorTypeModal(true);
      } else {
        const newMarker: Marker = { x, y, color: markerColor, size: markerSize, errorType: 'орфографические ошибки' };
        onMarkersChange([...markers, newMarker]);
        onCountsChange(greenCount, redCount + 1);
        setIsDrawing(true);
      }
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const rect = markersCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (markerColor === 'eraser') {
      handleErase(x, y);
    } else if (markerColor === 'red') {
      const newMarker: Marker = { x, y, color: markerColor, size: markerSize, errorType: 'орфографические ошибки' };
      onMarkersChange([...markers, newMarker]);
      onCountsChange(greenCount, redCount + 1);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};
