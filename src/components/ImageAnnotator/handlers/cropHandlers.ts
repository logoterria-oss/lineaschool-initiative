import { CropArea, Marker, Underline } from '../types';

export const createCropHandlers = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  imageRef: React.RefObject<HTMLImageElement | null>,
  rotation: number,
  cropArea: CropArea | null,
  markers: Marker[],
  underlines: Underline[],
  setMarkers: (markers: Marker[]) => void,
  setUnderlines: (underlines: Underline[]) => void,
  setProcessedImageUrl: (url: string | null) => void,
  setCropArea: (area: CropArea | null) => void,
  setRotation: (rotation: number) => void,
  setMarkerColor: (color: string) => void,
  saveToHistory: () => void
) => {
  const handleCropApply = (area: CropArea) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setCropArea(area);
      setMarkerColor('green');
      return;
    }

    const img = imageRef.current;
    if (!img) {
      setCropArea(area);
      setMarkerColor('green');
      return;
    }

    let adjustedArea = { ...area };
    const w = canvas.width;
    const h = canvas.height;

    if (rotation === 90) {
      adjustedArea = {
        x: area.y,
        y: w - area.x - area.width,
        width: area.height,
        height: area.width
      };
    } else if (rotation === 180) {
      adjustedArea = {
        x: w - area.x - area.width,
        y: h - area.y - area.height,
        width: area.width,
        height: area.height
      };
    } else if (rotation === 270) {
      adjustedArea = {
        x: h - area.y - area.height,
        y: area.x,
        width: area.height,
        height: area.width
      };
    }

    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d');
    if (!sourceCtx) return;

    sourceCanvas.width = img.naturalWidth;
    sourceCanvas.height = img.naturalHeight;
    sourceCtx.drawImage(img, 0, 0);

    const scaleX = img.naturalWidth / canvas.width;
    const scaleY = img.naturalHeight / canvas.height;

    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    tempCanvas.width = adjustedArea.width * scaleX;
    tempCanvas.height = adjustedArea.height * scaleY;

    ctx.drawImage(
      sourceCanvas,
      adjustedArea.x * scaleX,
      adjustedArea.y * scaleY,
      adjustedArea.width * scaleX,
      adjustedArea.height * scaleY,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height
    );

    const croppedImageUrl = tempCanvas.toDataURL('image/png');
    
    const adjustedMarkers = markers.map(marker => ({
      ...marker,
      x: marker.x - area.x,
      y: marker.y - area.y
    }));
    
    const adjustedUnderlines = underlines.map(underline => ({
      ...underline,
      startX: underline.startX - area.x,
      startY: underline.startY - area.y,
      endX: underline.endX - area.x,
      endY: underline.endY - area.y
    }));
    
    setMarkers(adjustedMarkers);
    setUnderlines(adjustedUnderlines);
    setProcessedImageUrl(croppedImageUrl);
    setCropArea(null);
    setRotation(0);
    setMarkerColor('green');
    setTimeout(() => saveToHistory(), 0);
  };

  const handleCropCancel = () => {
    setCropArea(null);
    setMarkerColor('green');
  };

  const applyCropBeforeCheck = () => {
    return new Promise<void>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas || !cropArea) {
        resolve();
        return;
      }

      console.log('applyCropBeforeCheck:', {
        canvasSize: { w: canvas.width, h: canvas.height },
        cropArea,
        rotation
      });

      const tempCanvas = document.createElement('canvas');
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) {
        resolve();
        return;
      }

      tempCanvas.width = cropArea.width;
      tempCanvas.height = cropArea.height;

      ctx.drawImage(
        canvas,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      const croppedImageUrl = tempCanvas.toDataURL('image/png');
      console.log('Cropped image created:', { w: tempCanvas.width, h: tempCanvas.height });
      console.log('Markers BEFORE adjustment:', markers);
      console.log('CropArea:', cropArea);
      
      const adjustedMarkers = markers.map(marker => ({
        ...marker,
        x: marker.x - cropArea.x,
        y: marker.y - cropArea.y
      }));
      
      const adjustedUnderlines = underlines.map(underline => ({
        ...underline,
        startX: underline.startX - cropArea.x,
        startY: underline.startY - cropArea.y,
        endX: underline.endX - cropArea.x,
        endY: underline.endY - cropArea.y
      }));
      
      console.log('Markers AFTER adjustment:', adjustedMarkers);
      
      setMarkers(adjustedMarkers);
      setUnderlines(adjustedUnderlines);
      setProcessedImageUrl(croppedImageUrl);
      setCropArea(null);
      setRotation(0);
      
      setTimeout(() => resolve(), 100);
    });
  };

  return {
    handleCropApply,
    handleCropCancel,
    applyCropBeforeCheck
  };
};
