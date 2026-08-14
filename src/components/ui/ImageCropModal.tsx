'use client';

import React, { useState } from 'react';
import { X, Crop, ZoomIn, ZoomOut, Check, Image as ImageIcon, RotateCw } from 'lucide-react';
import Image from 'next/image';

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (finalUrl: string, fitMode: 'cover' | 'contain') => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onSave,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(imageUrl, fitMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Ajustar Imagen 1:1</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Square Container (1:1) */}
        <div className="mt-6 flex flex-col items-center">
          <p className="text-xs text-zinc-400 mb-3">Previsualización de tarjeta (Cuadrada 1:1)</p>
          <div className="relative w-64 h-64 aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-purple-500/50 bg-zinc-950 flex items-center justify-center shadow-neon-purple">
            {imageUrl ? (
              <div
                className="w-full h-full relative transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                <Image
                  src={imageUrl}
                  alt="Vista previa"
                  fill
                  className={fitMode === 'cover' ? 'object-cover' : 'object-contain p-2'}
                  unoptimized
                />
              </div>
            ) : (
              <div className="text-center p-4 text-zinc-500">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <span className="text-xs">No hay imagen cargada</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 space-y-4">
          {/* Fit Mode Toggle */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-2">Modo de Encuadre</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFitMode('cover')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  fitMode === 'cover'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Recortar / Cubrir (Cover)
              </button>
              <button
                type="button"
                onClick={() => setFitMode('contain')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-colors ${
                  fitMode === 'contain'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Contener con fondo (Contain)
              </button>
            </div>
          </div>

          {/* Zoom Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 mb-1">
              <span>Zoom / Escala</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-zinc-400" />
              <input
                type="range"
                min="1"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-zinc-800 rounded-lg h-2"
              />
              <ZoomIn className="w-4 h-4 text-zinc-400" />
            </div>
          </div>

          {/* Rotation Button */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Rotar Imagen</span>
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-zinc-700 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Girar 90°
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-orange-500 rounded-xl hover:opacity-95 shadow-neon-purple transition-all"
          >
            <Check className="w-4 h-4" />
            Guardar Ajuste 1:1
          </button>
        </div>
      </div>
    </div>
  );
};
