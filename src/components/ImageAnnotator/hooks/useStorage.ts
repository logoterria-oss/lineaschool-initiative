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
    if (markers.length > 0 || underlines.length > 0 || greenCount > 0 || redCount > 0 || cropArea) {
      localStorage.setItem(storageKey, JSON.stringify({
        markers,
        underlines,
        greenCount,
        redCount,
        cropArea
      }));
    }
  }, [markers, underlines, greenCount, redCount, cropArea, storageKey]);
};
