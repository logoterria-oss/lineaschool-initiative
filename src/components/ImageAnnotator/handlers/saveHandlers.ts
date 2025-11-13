import { Marker, Underline, HistoryState } from '../types';

export const createSaveHandlers = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  markersCanvasRef: React.RefObject<HTMLCanvasElement>,
  imageRef: React.RefObject<HTMLImageElement | null>,
  imageUrl: string,
  markers: Marker[],
  underlines: Underline[],
  greenCount: number,
  redCount: number,
  rotation: number,
  processedImageUrl: string | null,
  history: HistoryState[],
  historyStep: number,
  setHistory: (history: HistoryState[]) => void,
  setHistoryStep: (step: number) => void,
  setShowSaveConfirm: (show: boolean) => void,
  onSave: (data: { markup: string, imageUrl: string, croppedImageUrl?: string }) => void,
  setProcessedImageUrl: (url: string | null) => void,
  setMarkers: (markers: Marker[]) => void,
  setUnderlines: (underlines: Underline[]) => void
) => {
  const saveToHistory = () => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({
      markers: [...markers],
      underlines: [...underlines],
      greenCount,
      redCount,
      cropArea: null
    });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleImageLoad = (img: HTMLImageElement, canvas: HTMLCanvasElement, markersCanvas: HTMLCanvasElement) => {
    imageRef.current = img;
    canvasRef.current = canvas;
    markersCanvasRef.current = markersCanvas;
    saveToHistory();
  };

  const handleSave = () => {
    if (markers.length === 0 && underlines.length === 0) {
      setShowSaveConfirm(true);
      return;
    }
    setShowSaveConfirm(true);
  };

  const confirmSave = () => {
    console.log('confirmSave called');
    const canvas = canvasRef.current;
    const markersCanvas = markersCanvasRef.current;
    if (!canvas || !markersCanvas) {
      console.error('Canvas not found');
      return;
    }

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const ctx = finalCanvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get context');
      return;
    }

    ctx.drawImage(canvas, 0, 0);
    ctx.drawImage(markersCanvas, 0, 0);

    const compositeImageUrl = finalCanvas.toDataURL('image/png');
    console.log('Composite image created');

    const markupData = JSON.stringify({
      markers,
      underlines,
      greenCount,
      redCount,
      rotation,
      processedImageUrl
    });

    const storageKey = `annotator_${imageUrl}`;
    localStorage.removeItem(storageKey);

    console.log('Calling onSave with:', {
      markup: markupData,
      imageUrl: compositeImageUrl,
      croppedImageUrl: processedImageUrl || undefined
    });

    onSave({
      markup: markupData,
      imageUrl: compositeImageUrl,
      croppedImageUrl: processedImageUrl || undefined
    });

    setShowSaveConfirm(false);
  };

  const handleCheckModalSave = (bakedImageUrl?: string) => {
    if (!bakedImageUrl) {
      handleSave();
      return;
    }

    console.log('Запекание изображения - возврат в редактор');
    
    setProcessedImageUrl(bakedImageUrl);
    setMarkers([]);
    setUnderlines([]);
  };

  return {
    saveToHistory,
    handleImageLoad,
    handleSave,
    confirmSave,
    handleCheckModalSave
  };
};