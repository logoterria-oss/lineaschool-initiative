/**
 * ⚠️ КРИТИЧЕСКИЙ ХУК - НЕ ИЗМЕНЯТЬ БЕЗ НЕОБХОДИМОСТИ
 * 
 * Хук для сохранения и восстановления состояния аннотатора
 * 
 * Ключевой функционал:
 * - Сохранение в localStorage: markers, underlines, counts, cropArea, rotation
 * - Восстановление из savedMarkup или localStorage
 * 
 * ВАЖНО: rotation сохраняется в localStorage (строка 57-65)
 * Это критично для восстановления поворота при перезагрузке
 * 
 * Последнее изменение: 13.11.2025
 */

import { useEffect } from 'react';
import { Marker, Underline, CropArea } from '../types';

export const useStorage = (
  imageUrl: string,
  savedMarkup: string | undefined,
  markers: Marker[],
  underlines: Underline[],
  greenCount: number,
  redCount: number,
  rotation: number,
  cropArea: CropArea | null,
  setMarkers: (markers: Marker[]) => void,
  setUnderlines: (underlines: Underline[]) => void,
  setGreenCount: (count: number) => void,
  setRedCount: (count: number) => void,
  setRotation: (rotation: number) => void,
  setProcessedImageUrl: (url: string | null) => void,
  setCropArea: (area: CropArea | null) => void
) => {
  const storageKey = `annotator_${imageUrl}`;

  useEffect(() => {
    if (savedMarkup) {
      try {
        const data = JSON.parse(savedMarkup);
        setMarkers(data.markers || []);
        setUnderlines(data.underlines || []);
        setGreenCount(data.greenCount || 0);
        setRedCount(data.redCount || 0);
        setRotation(data.rotation || 0);
        setProcessedImageUrl(data.processedImageUrl || null);
        setCropArea(null);
      } catch (e) {
        console.error('Failed to load saved markup:', e);
      }
    } else {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setMarkers(data.markers || []);
          setUnderlines(data.underlines || []);
          setGreenCount(data.greenCount || 0);
          setRedCount(data.redCount || 0);
          setRotation(data.rotation || 0);
          setCropArea(data.cropArea || null);
          setProcessedImageUrl(null);
        } catch (e) {
          console.error('Failed to load saved markers:', e);
        }
      }
    }
  }, [imageUrl, savedMarkup, storageKey]);

  useEffect(() => {
    if (markers.length > 0 || underlines.length > 0 || greenCount > 0 || redCount > 0 || cropArea || rotation !== 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        markers,
        underlines,
        greenCount,
        redCount,
        cropArea,
        rotation
      }));
    }
  }, [markers, underlines, greenCount, redCount, cropArea, rotation, storageKey]);
};