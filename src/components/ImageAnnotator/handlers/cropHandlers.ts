/**
 * ⚠️ КРИТИЧЕСКИЙ МОДУЛЬ - НЕ ИЗМЕНЯТЬ БЕЗ НЕОБХОДИМОСТИ
 * 
 * Обработчики кадрирования изображения диктанта
 * 
 * Ключевой функционал:
 * - handleCropApply() - применение кадрирования с запеканием в processedImageUrl
 * - Корректировка координат маркеров и подчёркиваний после кадрирования
 * - Сброс rotation в 0 после кадрирования (т.к. изображение уже запечено)
 * 
 * ВАЖНО: Кадрирование берёт текущий canvas (уже с поворотом) и запекает
 * обрезанную часть в processedImageUrl
 * 
 * Последнее изменение: 13.11.2025
 */

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

    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    tempCanvas.width = area.width;
    tempCanvas.height = area.height;

    ctx.drawImage(
      canvas,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      area.width,
      area.height
    );

    const croppedImageUrl = tempCanvas.toDataURL('image/png');
    
    const adjustedMarkers = markers.map(marker => ({
      ...marker,
      x: marker.x - area.x,
      y: marker.y - area.y
    }));
    
    const adjustedUnderlines = underlines.map(underline => ({
      ...underline,
      x1: underline.x1 - area.x,
      y1: underline.y1 - area.y,
      x2: underline.x2 - area.x,
      y2: underline.y2 - area.y
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
        cropArea
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
      
      const adjustedMarkers = markers.map(marker => ({
        ...marker,
        x: marker.x - cropArea.x,
        y: marker.y - cropArea.y
      }));
      
      const adjustedUnderlines = underlines.map(underline => ({
        ...underline,
        x1: underline.x1 - cropArea.x,
        y1: underline.y1 - cropArea.y,
        x2: underline.x2 - cropArea.x,
        y2: underline.y2 - cropArea.y
      }));
      
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