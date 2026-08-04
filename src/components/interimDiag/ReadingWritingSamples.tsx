import { RefObject } from 'react';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface Props {
  maxSamples: number;
  writingSamples: string[];
  primarySamples: string[];
  interimSamples: string[];
  interimSamplesDate: string | null;
  fileRef: RefObject<HTMLInputElement>;
  onImageClick: (src: string) => void;
  onRemoveSample: (idx: number) => void;
  onFiles: (files: FileList | null) => void;
}

export default function ReadingWritingSamples({
  maxSamples,
  writingSamples,
  primarySamples,
  interimSamples,
  interimSamplesDate,
  fileRef,
  onImageClick,
  onRemoveSample,
  onFiles,
}: Props) {
  return (
    <>
      {/* Фото диктанта из прошлых диагностик — только просмотр */}
      {(primarySamples.length > 0 || interimSamples.length > 0) && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-4">
          {primarySamples.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Диктант с первичной диагностики
              </div>
              <div className="flex flex-wrap gap-3">
                {primarySamples.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Первичная ${idx + 1}`}
                    onClick={() => onImageClick(src)}
                    className="h-28 w-28 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80"
                  />
                ))}
              </div>
            </div>
          )}
          {interimSamples.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Диктант с прошлой промежуточной диагностики
                {interimSamplesDate ? ` (${interimSamplesDate.split('-').reverse().join('.')})` : ''}
              </div>
              <div className="flex flex-wrap gap-3">
                {interimSamples.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Промежуточная ${idx + 1}`}
                    onClick={() => onImageClick(src)}
                    className="h-28 w-28 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <Label className="text-sm text-gray-700">
          Образцы письменных работ (до {maxSamples} изображений)
        </Label>
        <div className="mt-2 flex flex-wrap gap-3">
          {writingSamples.map((src, idx) => (
            <div key={idx} className="relative">
              <img
                src={src}
                alt={`Образец ${idx + 1}`}
                className="h-28 w-28 rounded-lg object-cover border border-gray-200"
              />
              <button
                type="button"
                onClick={() => onRemoveSample(idx)}
                className="absolute -top-2 -right-2 bg-white rounded-full border border-gray-300 shadow-sm p-0.5 hover:bg-gray-50"
              >
                <Icon name="X" size={14} className="text-gray-600" />
              </button>
            </div>
          ))}
          {writingSamples.length < maxSamples && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-28 w-28 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500"
            >
              <Icon name="ImagePlus" size={24} />
              <span className="text-xs mt-1">Добавить</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </>
  );
}
