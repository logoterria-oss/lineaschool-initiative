import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Marker, Underline } from './ImageAnnotator/types';

interface AnnotatedImageViewProps {
  imageUrl: string;
  markupData: {
    markers: Marker[];
    underlines: Underline[];
  } | null;
  alt?: string;
  className?: string;
}

export interface AnnotatedImageViewRef {
  downloadImage: (filename: string) => void;
}

const AnnotatedImageView = forwardRef<AnnotatedImageViewRef, AnnotatedImageViewProps>(({ imageUrl, markupData, alt, className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);

      if (markupData) {
        markupData.underlines?.forEach((line) => {
          ctx.save();
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8;
          
          const amplitude = 2;
          const frequency = 0.15;
          const distance = Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2));
          const angle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
          
          ctx.translate(line.x1, line.y1);
          ctx.rotate(angle);
          
          ctx.beginPath();
          for (let i = 0; i <= distance; i += 1) {
            const y = Math.sin(i * frequency) * amplitude;
            if (i === 0) {
              ctx.moveTo(i, y);
            } else {
              ctx.lineTo(i, y);
            }
          }
          ctx.stroke();
          ctx.restore();
        });

        ctx.globalAlpha = 0.4;
        markupData.markers?.forEach((marker) => {
          ctx.fillStyle = marker.color === 'green' ? '#22c55e' : '#ef4444';
          ctx.beginPath();
          ctx.arc(marker.x, marker.y, marker.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
      }
    };

    img.src = imageUrl;
  }, [imageUrl, markupData]);

  useImperativeHandle(ref, () => ({
    downloadImage: (filename: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    }
  }));

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} className="w-full h-auto" />
    </div>
  );
});

export default AnnotatedImageView;