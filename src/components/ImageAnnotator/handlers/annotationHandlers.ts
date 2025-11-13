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
  saveToHistory: () => void,
  setShowErrorTypeModal?: (show: boolean) => void,
  setPendingAnnotation?: (data: {type: 'marker' | 'underline', data: any} | null) => void,
  errorTypes?: Record<string, number>,
  setErrorTypes?: (types: Record<string, number>) => void
) => {
  const handleMarkerColorChange = (color: MarkerColor) => {
    setMarkerColor(color);
    setUnderlineStart(null);
    setCropDragStart(null);
  };

  const handleMarkerAdd = (marker: Marker) => {
    if (marker.color === 'green' && setShowErrorTypeModal && setPendingAnnotation) {
      setPendingAnnotation({ type: 'marker', data: marker });
      setShowErrorTypeModal(true);
      return;
    }
    
    const markerWithType = marker.color === 'red' 
      ? { ...marker, errorType: 'орфографические ошибки' }
      : marker;
    
    setMarkers([...markers, markerWithType]);
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
    if (setShowErrorTypeModal && setPendingAnnotation) {
      setPendingAnnotation({ type: 'underline', data: underline });
      setShowErrorTypeModal(true);
      return;
    }
    
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

  const handleErrorTypeSelect = (errorType: string, pendingAnnotation: {type: 'marker' | 'underline', data: any} | null) => {
    if (!pendingAnnotation) return;
    
    if (pendingAnnotation.type === 'marker') {
      const marker = { ...pendingAnnotation.data, errorType };
      setMarkers([...markers, marker]);
      setGreenCount(prev => {
        const newCount = prev + 1;
        setTimeout(() => saveToHistory(), 0);
        return newCount;
      });
    } else if (pendingAnnotation.type === 'underline') {
      const underline = { ...pendingAnnotation.data, errorType };
      setUnderlines([...underlines, underline]);
      setGreenCount(prev => {
        const newCount = prev + 1;
        setTimeout(() => saveToHistory(), 0);
        return newCount;
      });
    }
    
    if (errorTypes && setErrorTypes) {
      const newErrorTypes = { ...errorTypes };
      newErrorTypes[errorType] = (newErrorTypes[errorType] || 0) + 1;
      setErrorTypes(newErrorTypes);
    }
    
    if (setShowErrorTypeModal) setShowErrorTypeModal(false);
    if (setPendingAnnotation) setPendingAnnotation(null);
  };

  return {
    handleMarkerColorChange,
    handleMarkerAdd,
    handleMarkerRemove,
    handleUnderlineAdd,
    handleUnderlineRemove,
    clearCanvas,
    handleErrorTypeSelect
  };
};