import { useRef, useState } from 'react';
import { Marker, Underline, HistoryState, MarkerColor, CropArea } from '../types';

export const useImageAnnotatorState = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markersCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  const [markerColor, setMarkerColor] = useState<MarkerColor>('green');
  const [markerSize, setMarkerSize] = useState(20);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [greenCount, setGreenCount] = useState(0);
  const [redCount, setRedCount] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [underlines, setUnderlines] = useState<Underline[]>([]);
  const [underlineStart, setUnderlineStart] = useState<{x: number, y: number} | null>(null);
  const [hoveredMarkerIndex, setHoveredMarkerIndex] = useState<number | null>(null);
  const [hoveredUnderlineIndex, setHoveredUnderlineIndex] = useState<number | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{x: number, y: number} | null>(null);
  const [rotation, setRotation] = useState(0);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [showErrorTypeModal, setShowErrorTypeModal] = useState(false);
  const [pendingAnnotation, setPendingAnnotation] = useState<{type: 'marker' | 'underline', data: any} | null>(null);
  const [errorTypes, setErrorTypes] = useState<Record<string, number>>({});

  return {
    canvasRef,
    markersCanvasRef,
    imageRef,
    markerColor,
    setMarkerColor,
    markerSize,
    setMarkerSize,
    history,
    setHistory,
    historyStep,
    setHistoryStep,
    greenCount,
    setGreenCount,
    redCount,
    setRedCount,
    markers,
    setMarkers,
    underlines,
    setUnderlines,
    underlineStart,
    setUnderlineStart,
    hoveredMarkerIndex,
    setHoveredMarkerIndex,
    hoveredUnderlineIndex,
    setHoveredUnderlineIndex,
    showSaveConfirm,
    setShowSaveConfirm,
    showCheckModal,
    setShowCheckModal,
    cropArea,
    setCropArea,
    cropDragStart,
    setCropDragStart,
    rotation,
    setRotation,
    processedImageUrl,
    setProcessedImageUrl,
    showErrorTypeModal,
    setShowErrorTypeModal,
    pendingAnnotation,
    setPendingAnnotation,
    errorTypes,
    setErrorTypes
  };
};