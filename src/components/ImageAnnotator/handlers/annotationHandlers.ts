import { Marker, Underline, MarkerColor } from '../types';

export const createAnnotationHandlers = (
  markers: Marker[],
  underlines: Underline[],
  setMarkers: (markers: Marker[]) => void,
  setUnderlines: (underlines: Underline[]) => void,
  setGreenCount: (fn: (prev: number) => number) => void,
  setRedCount: (fn: (prev: number) => number) => void,
  setUnderlineStart: (pos: {x: number, y: number} | null) => void,
  setMarkerColor: (color: MarkerColor) => void,
  setShowCheckModal: (show: boolean) => void,
  setCropDragStart: (pos: {x: number, y: number} | null) => void,
  saveToHistory: () => void
) => {
  const handleMarkerColorChange = (color: MarkerColor) => {
    setMarkerColor(color);
    setUnderlineStart(null);
    setCropDragStart(null);
    if (['green', 'red', 'underline', 'eraser'].includes(color)) {
      setShowCheckModal(true);
    }
  };

  const handleMarkerAdd = (marker: Marker) => {
    setMarkers([...markers, marker]);
    if (marker.color === 'green') {
      setGreenCount(prev => {
        const newCount = prev + 1;
        setTimeout(() => saveToHistory(), 0);
        return newCount;
      });
    } else {
      setRedCount(prev => {
        const newCount = prev + 1;
        setTimeout(() => saveToHistory(), 0);
        return newCount;
      });
    }
  };

  const handleMarkerRemove = (index: number) => {
    const removedMarker = markers[index];
    const newMarkers = markers.filter((_, i) => i !== index);
    setMarkers(newMarkers);
    
    if (removedMarker.color === 'green') {
      setGreenCount(prev => {
        const newCount = Math.max(0, prev - 1);
        setTimeout(() => saveToHistory(), 0);
        return newCount;
      });
    } else {
      setRedCount(prev => {
        const newCount = Math.max(0, prev - 1);
        setTimeout(() => saveToHistory(), 0);
        return newCount;
      });
    }
  };

  const handleUnderlineAdd = (underline: Underline) => {
    setUnderlines([...underlines, underline]);
    setGreenCount(prev => {
      const newCount = prev + 1;
      setTimeout(() => saveToHistory(), 0);
      return newCount;
    });
  };

  const handleUnderlineRemove = (index: number) => {
    const newUnderlines = underlines.filter((_, i) => i !== index);
    setUnderlines(newUnderlines);
    setGreenCount(prev => {
      const newCount = Math.max(0, prev - 1);
      setTimeout(() => saveToHistory(), 0);
      return newCount;
    });
  };

  const clearCanvas = () => {
    if (markers.length === 0 && underlines.length === 0) {
      return;
    }
    
    if (window.confirm('Вы уверены, что хотите удалить все выделения?')) {
      setMarkers([]);
      setUnderlines([]);
      setUnderlineStart(null);
      setGreenCount(() => 0);
      setRedCount(() => 0);
      setTimeout(() => saveToHistory(), 0);
    }
  };

  return {
    handleMarkerColorChange,
    handleMarkerAdd,
    handleMarkerRemove,
    handleUnderlineAdd,
    handleUnderlineRemove,
    clearCanvas
  };
};
