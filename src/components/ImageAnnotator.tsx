import { ImageAnnotatorProps } from './ImageAnnotator/types';
import ErrorCounter from './ImageAnnotator/ErrorCounter';
import Toolbar from './ImageAnnotator/Toolbar';
import SaveConfirmModal from './ImageAnnotator/SaveConfirmModal';
import CheckModal from './ImageAnnotator/CheckModal';
import AnnotationCanvas from './ImageAnnotator/AnnotationCanvas';
import CropCanvas from './ImageAnnotator/CropCanvas';
import Instructions from './ImageAnnotator/Instructions';
import { useImageAnnotatorState } from './ImageAnnotator/hooks/useImageAnnotatorState';
import { useStorage } from './ImageAnnotator/hooks/useStorage';
import { createAnnotationHandlers } from './ImageAnnotator/handlers/annotationHandlers';
import { createCropHandlers } from './ImageAnnotator/handlers/cropHandlers';
import { createSaveHandlers } from './ImageAnnotator/handlers/saveHandlers';

const ImageAnnotator = ({ imageUrl, onSave, savedMarkup }: ImageAnnotatorProps) => {
  const state = useImageAnnotatorState();

  useStorage(
    imageUrl,
    savedMarkup,
    state.markers,
    state.underlines,
    state.greenCount,
    state.redCount,
    state.rotation,
    state.cropArea,
    state.setMarkers,
    state.setUnderlines,
    state.setGreenCount,
    state.setRedCount,
    state.setRotation,
    state.setProcessedImageUrl,
    state.setCropArea
  );

  const saveHandlers = createSaveHandlers(
    state.canvasRef,
    state.markersCanvasRef,
    state.imageRef,
    imageUrl,
    state.markers,
    state.underlines,
    state.greenCount,
    state.redCount,
    state.rotation,
    state.processedImageUrl,
    state.history,
    state.historyStep,
    state.setHistory,
    state.setHistoryStep,
    state.setShowSaveConfirm,
    onSave
  );

  const annotationHandlers = createAnnotationHandlers(
    state.markers,
    state.underlines,
    state.setMarkers,
    state.setUnderlines,
    state.setGreenCount,
    state.setRedCount,
    state.setUnderlineStart,
    state.setMarkerColor,
    state.setShowCheckModal,
    state.setCropDragStart,
    saveHandlers.saveToHistory
  );

  const cropHandlers = createCropHandlers(
    state.canvasRef,
    state.imageRef,
    state.rotation,
    state.cropArea,
    state.markers,
    state.underlines,
    state.setMarkers,
    state.setUnderlines,
    state.setProcessedImageUrl,
    state.setCropArea,
    state.setRotation,
    state.setMarkerColor,
    saveHandlers.saveToHistory
  );

  const handleOpenCheckModal = async () => {
    if (state.cropArea && !state.processedImageUrl) {
      console.log('Applying crop before opening check modal');
      await cropHandlers.applyCropBeforeCheck();
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    state.setMarkerColor('green');
    state.setShowCheckModal(true);
  };

  const handleCloseCheckModal = async () => {
    const hasMarkup = state.markers.length > 0 || state.underlines.length > 0;
    
    if (hasMarkup) {
      console.log('Auto-saving before close');
      saveHandlers.confirmSave();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    state.setShowCheckModal(false);
    state.setMarkerColor('green');
    state.setUnderlineStart(null);
  };

  const handleRotate = () => {
    state.setRotation(prev => (prev + 90) % 360);
    setTimeout(() => saveHandlers.saveToHistory(), 0);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4">
      <Instructions />
      
      {state.showSaveConfirm && (
        <SaveConfirmModal
          greenCount={state.greenCount}
          redCount={state.redCount}
          onConfirm={saveHandlers.confirmSave}
          onCancel={() => state.setShowSaveConfirm(false)}
        />
      )}

      {state.showCheckModal && (
        <CheckModal
          imageUrl={imageUrl}
          processedImageUrl={state.processedImageUrl}
          rotation={state.processedImageUrl ? 0 : state.rotation}
          markerColor={state.markerColor}
          markerSize={state.markerSize}
          markers={state.markers}
          underlines={state.underlines}
          greenCount={state.greenCount}
          redCount={state.redCount}
          underlineStart={state.underlineStart}
          onMarkerColorChange={annotationHandlers.handleMarkerColorChange}
          onMarkerSizeChange={state.setMarkerSize}
          onMarkersChange={state.setMarkers}
          onUnderlinesChange={state.setUnderlines}
          onUnderlineStartChange={state.setUnderlineStart}
          onCountsChange={(green, red) => {
            state.setGreenCount(() => green);
            state.setRedCount(() => red);
          }}
          onClear={annotationHandlers.clearCanvas}
          onSave={saveHandlers.handleCheckModalSave}
          onClose={handleCloseCheckModal}
        />
      )}
    
      <div className="space-y-4">
        <ErrorCounter greenCount={state.greenCount} redCount={state.redCount} />
        
        <Toolbar
          markerColor={state.markerColor}
          markerSize={state.markerSize}
          underlineStart={state.underlineStart}
          hasMarkup={state.markers.length > 0 || state.underlines.length > 0}
          onMarkerColorChange={annotationHandlers.handleMarkerColorChange}
          onMarkerSizeChange={state.setMarkerSize}
          onOpenCheckModal={handleOpenCheckModal}
          onSave={saveHandlers.handleSave}
          onClear={annotationHandlers.clearCanvas}
          onRotate={handleRotate}
        />

        {state.markerColor === 'crop' ? (
          <CropCanvas
            imageUrl={state.processedImageUrl || imageUrl}
            initialCropArea={state.cropArea}
            onApply={cropHandlers.handleCropApply}
            onCancel={cropHandlers.handleCropCancel}
          />
        ) : (
          <AnnotationCanvas
            imageUrl={state.processedImageUrl || imageUrl}
            markers={state.markers}
            underlines={state.underlines}
            markerColor={state.markerColor}
            markerSize={state.markerSize}
            underlineStart={state.underlineStart}
            hoveredMarkerIndex={state.hoveredMarkerIndex}
            hoveredUnderlineIndex={state.hoveredUnderlineIndex}
            cropArea={state.cropArea}
            rotation={state.rotation}
            onImageLoad={saveHandlers.handleImageLoad}
            onMarkerAdd={annotationHandlers.handleMarkerAdd}
            onMarkerRemove={annotationHandlers.handleMarkerRemove}
            onUnderlineAdd={annotationHandlers.handleUnderlineAdd}
            onUnderlineRemove={annotationHandlers.handleUnderlineRemove}
            onUnderlineStartSet={state.setUnderlineStart}
            onHoveredMarkerChange={state.setHoveredMarkerIndex}
            onHoveredUnderlineChange={state.setHoveredUnderlineIndex}
          />
        )}
      </div>
    </div>
  );
};

export default ImageAnnotator;