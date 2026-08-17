'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { Promotion, PromotionItem } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { formatImageUrl } from '@/lib/imageUtils';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  PackageCheck,
  Crop,
  X,
  PlusCircle,
  TrendingDown,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Check,
} from 'lucide-react';

export default function AdminPromotionsPage() {
  const { products, promotions, setPromotions } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promoPrice, setPromoPrice] = useState<number>(11990);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedItems, setSelectedItems] = useState<
    Array<{ product_id: string; quantity: number }>
  >([]);

  // Crop Modal State
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropTargetUrl, setCropTargetUrl] = useState('');

  // Productos ordenados ALFABÉTICAMENTE A-Z para todas las listas desplegables
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, [products]);

  const handleOpenAddModal = () => {
    setEditingPromo(null);
    setName('');
    setDescription('');
    setPromoPrice(11990);
    setImageUrl('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80');

    // Iniciar con el primer producto ordenado alfabéticamente si existe
    if (sortedProducts.length > 0) {
      setSelectedItems([{ product_id: sortedProducts[0].id, quantity: 1 }]);
    } else {
      setSelectedItems([]);
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (promo: Promotion) => {
    setEditingPromo(promo);
    setName(promo.name);
    setDescription(promo.description);
    setPromoPrice(promo.promo_price);
    setImageUrl(promo.image_url);
    if (promo.items && promo.items.length > 0) {
      setSelectedItems(
        promo.items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
        }))
      );
    } else if (sortedProducts.length > 0) {
      setSelectedItems([{ product_id: sortedProducts[0].id, quantity: 1 }]);
    }
    setIsModalOpen(true);
  };

  const handleAddItemToPromo = () => {
    if (sortedProducts.length === 0) {
      alert('Primero debes ingresar productos al inventario para incluirlos en el pack.');
      return;
    }
    setSelectedItems((prev) => [
      ...prev,
      { product_id: sortedProducts[0].id, quantity: 1 },
    ]);
  };

  const handleRemoveItemFromPromo = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemInPromo = (index: number, product_id: string, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === index ? { product_id, quantity: Math.max(1, quantity) } : item))
    );
  };

  const handleDeletePromo = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta promoción pack?')) {
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Ingresa el nombre del pack promocional.');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Debes incluir al menos un producto en la promoción.');
      return;
    }

    const formattedItems: PromotionItem[] = selectedItems.map((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        product: prod,
      };
    });

    const cleanedImageUrl = formatImageUrl(imageUrl);

    if (editingPromo) {
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === editingPromo.id
            ? {
                ...p,
                name: name.trim(),
                description: description.trim(),
                promo_price: Number(promoPrice),
                image_url: cleanedImageUrl,
                items: formattedItems,
              }
            : p
        )
      );
    } else {
      const newPromo: Promotion = {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        promo_price: Number(promoPrice),
        image_url: cleanedImageUrl,
        is_active: true,
        items: formattedItems,
      };
      setPromotions((prev) => [newPromo, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Cálculo de costo estimado y stock armable del pack en edición
  const estimatedCost = useMemo(() => {
    return selectedItems.reduce((sum, it) => {
      const prod = products.find((p) => p.id === it.product_id);
      return sum + (prod?.cost_price || 0) * it.quantity;
    }, 0);
  }, [selectedItems, products]);

  const maxPacksArmables = useMemo(() => {
    if (selectedItems.length === 0) return 0;
    const packs = selectedItems.map((it) => {
      const prod = products.find((p) => p.id === it.product_id);
      if (!prod || prod.stock < it.quantity) return 0;
      return Math.floor(prod.stock / it.quantity);
    });
    return Math.min(...packs);
  }, [selectedItems, products]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-400" />
            Módulo de Promociones (Packs & Bundles)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Crea promociones compuestas que descuentan stock automático de cada producto individual al venderse.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black shadow-neon-orange hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Promoción</span>
        </button>
      </div>

      {/* Grid de Promociones */}
      {promotions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-900 border-2 border-dashed border-zinc-800 space-y-3">
          <Sparkles className="w-10 h-10 mx-auto text-orange-400" />
          <h3 className="text-base font-bold text-white">No tienes packs promocionales creados</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Crea ofertas especiales combinando varios productos (como Pisco + Bebida + Hielo) para aumentar tu ticket promedio de venta.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Pack</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {promotions.map((promo) => {
            let maxPacks = 99;
            if (promo.items && promo.items.length > 0) {
              const packs = promo.items.map((pi) => {
                const prod = products.find((p) => p.id === pi.product_id);
                if (!prod || prod.stock < pi.quantity) return 0;
                return Math.floor(prod.stock / pi.quantity);
              });
              maxPacks = Math.min(...packs);
            }

            return (
              <div
                key={promo.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 rounded-3xl p-4 flex flex-col justify-between space-y-4 shadow-lg"
              >
                {/* Imagen cuadrada 1:1 */}
                <SquareImageContainer
                  src={promo.image_url}
                  alt={promo.name}
                  objectFit="cover"
                  badgeText={maxPacks === 0 ? 'PACK AGOTADO' : `${maxPacks} Packs Armables`}
                  badgeType={maxPacks === 0 ? 'outOfStock' : 'promo'}
                />

                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-extrabold text-white">{promo.name}</h3>
                    <span className="text-base font-black text-orange-400">
                      ${promo.promo_price.toLocaleString('es-CL')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{promo.description}</p>

                  {/* Desglose de componentes */}
                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1">
                      <PackageCheck className="w-3.5 h-3.5" /> Componentes del Pack:
                    </span>
                    <div className="space-y-1">
                      {promo.items?.map((item, idx) => {
                        const prod = products.find((p) => p.id === item.product_id);
                        return (
                          <div key={idx} className="flex justify-between text-xs text-zinc-300">
                            <span>
                              • {item.quantity}x {prod?.name || 'Producto'}
                            </span>
                            <span className="text-zinc-500 text-[11px]">
                              (Stock: {prod?.stock || 0})
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="pt-2 border-t border-zinc-800 flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditModal(promo)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    title="Editar Promoción"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePromo(promo.id)}
                    className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors"
                    title="Eliminar Promoción"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL AMPLIO Y COMPLETO PARA CREAR / EDITAR PROMOCIÓN (2 COLUMNAS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="relative bg-zinc-900 border-2 border-orange-500/50 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl my-auto max-h-[95vh] overflow-y-auto">
            {/* Header Sticky */}
            <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-md z-10 flex items-center justify-between pb-4 mb-6 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingPromo ? 'Editar Promoción (Pack / Combo)' : 'Crear Nueva Promoción (Pack / Combo)'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Define el precio promocional y los productos que se descontarán automáticamente al venderse.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* COLUMNA IZQUIERDA: DATOS DEL PACK Y PRECIO */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
                    1. Información General del Pack
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Nombre de la Promoción *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                      placeholder="Ej: Pack Piscola Suprema (Alto 1L + Coca 1.5L + Hielo)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Descripción Detallada
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 resize-none focus:outline-none focus:border-orange-500"
                      placeholder="Ej: 1 Pisco Alto del Carmen 35° 1L + 1 Bebida Coca-Cola 1.5L + 1 Bolsa de Hielo 1KG"
                    />
                  </div>

                  {/* PRECIO Y COSTOS ESTIMADOS */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div>
                      <label className="block text-xs font-black text-orange-400 mb-1">
                        Precio Venta del Pack ($ CLP) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={promoPrice}
                        onChange={(e) => setPromoPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-orange-500/50 text-white font-mono font-black text-base focus:outline-none focus:border-orange-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-800/80">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Costo Estimado:</span>
                        <span className="text-zinc-300 font-mono font-bold">
                          ${estimatedCost.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">Margen Estimado:</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          ${(promoPrice - estimatedCost).toLocaleString('es-CL')} (
                          {promoPrice > 0 ? Math.round(((promoPrice - estimatedCost) / promoPrice) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* URL DE IMAGEN Y ENCUADRE */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      URL de Imagen del Pack (Google Drive / Web)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 font-mono"
                        placeholder="https://drive.google.com/... o https://images..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!imageUrl) return alert('Ingresa una URL de imagen primero.');
                          setCropTargetUrl(imageUrl);
                          setIsCropOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600/30 text-orange-300 border border-orange-500/40 text-xs font-bold hover:bg-orange-600/50 transition-colors"
                      >
                        <Crop className="w-4 h-4" />
                        <span>1:1</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA: CONSTRUCTOR DE PRODUCTOS DEL PACK */}
                <div className="space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                        <PackageCheck className="w-4 h-4" />
                        <span>2. Productos Incluidos en este Pack</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddItemToPromo}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Agregar Ítem</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-400 mb-3">
                      Las opciones de productos se muestran ordenadas alfabéticamente (A-Z) para tu comodidad:
                    </p>

                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {selectedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800 hover:border-orange-500/30 transition-colors"
                        >
                          {/* SELECT CON ORDEN ALFABÉTICO A-Z */}
                          <select
                            value={item.product_id}
                            onChange={(e) => handleUpdateItemInPromo(idx, e.target.value, item.quantity)}
                            className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
                          >
                            {sortedProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.stock} un. | Costo: ${p.cost_price || 0})
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1.5 rounded-xl border border-zinc-700">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase">Cant:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItemInPromo(idx, item.product_id, parseInt(e.target.value) || 1)
                              }
                              className="w-12 text-center bg-transparent text-white font-mono font-bold text-xs focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromPromo(idx)}
                            className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            title="Quitar del pack"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* INDICADOR DE DISPONIBILIDAD EN TIEMPO REAL */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-orange-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                        Disponibilidad en Bodega:
                      </span>
                      <span className="text-lg font-black text-white mt-0.5 block">
                        {maxPacksArmables > 0 ? `Quedan ${maxPacksArmables} Packs Armables` : 'Pack Agotado (Stock Insuficiente)'}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        Calculado en base al stock de menor disponibilidad de los ítems incluidos.
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400">
                      <Layers className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER DEL MODAL */}
              <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-zinc-500">
                  {selectedItems.length} componentes configurados para este pack
                </span>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs shadow-neon-orange hover:opacity-95 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingPromo ? 'Guardar Cambios del Pack' : 'Guardar y Publicar Promoción'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      <ImageCropModal
        isOpen={isCropOpen}
        onClose={() => setIsCropOpen(false)}
        imageUrl={cropTargetUrl}
        onSave={(finalUrl) => setImageUrl(finalUrl)}
      />
    </div>
  );
}
