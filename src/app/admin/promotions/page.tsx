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
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function AdminPromotionsPage() {
  const { products, promotions, setPromotions } = useCart();
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  const handleOpenAddForm = () => {
    setEditingPromo(null);
    setName('');
    setDescription('');
    setPromoPrice(11990);
    setImageUrl('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80');

    if (sortedProducts.length > 0) {
      setSelectedItems([{ product_id: sortedProducts[0].id, quantity: 1 }]);
    } else {
      setSelectedItems([]);
    }
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditForm = (promo: Promotion) => {
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
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const defaultItemImg = formattedItems[0]?.product?.image_url || '';
    const cleanedImageUrl = imageUrl.trim() ? formatImageUrl(imageUrl) : defaultItemImg;

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

    setIsFormOpen(false);
    setEditingPromo(null);
  };

  // Costo y Margen Calculados
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
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-orange-400" />
            <span>Módulo de Promociones (Packs & Bundles)</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Crea promociones compuestas que descuentan stock automático de cada producto individual al venderse.
          </p>
        </div>

        {!isFormOpen && (
          <button
            onClick={handleOpenAddForm}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black shadow-neon-orange hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Nueva Promoción</span>
          </button>
        )}
      </div>

      {/* FORMULARIO DIRECTO EN LA PÁGINA (EN UNA MISMA PLANA - SIN POPUPS NI SCROLLBARS INTERNOS) */}
      {isFormOpen && (
        <section className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border-2 border-orange-500/50 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {editingPromo ? `Editar Pack: ${editingPromo.name}` : 'Crear Nueva Promoción (Pack / Combo)'}
                </h2>
                <p className="text-xs text-zinc-400">
                  Todo en una sola plana: configura precio, imagen y selecciona los productos incluidos ordenados de la A a la Z.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingPromo(null);
              }}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Cerrar formulario"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSavePromo} className="space-y-6">
            {/* FILA 1: DATOS DEL PACK Y PRECIO */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Nombre de la Promoción */}
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Nombre de la Promoción / Pack *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  placeholder="Ej: Pack Piscola Suprema (Alto 1L + Coca 1.5L + Hielo)"
                />
              </div>

              {/* Precio de Venta */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-orange-400 mb-1.5">
                  Precio Venta Pack ($ CLP) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-orange-500/40 text-white font-mono font-black text-sm focus:outline-none focus:border-orange-400"
                />
              </div>

              {/* Costo y Margen Estimado */}
              <div className="md:col-span-4 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Costo Estimado</span>
                  <span className="text-sm font-black text-zinc-300 font-mono">
                    ${estimatedCost.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Margen de Ganancia</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    +${(promoPrice - estimatedCost).toLocaleString('es-CL')} (
                    {promoPrice > 0 ? Math.round(((promoPrice - estimatedCost) / promoPrice) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* FILA 2: DESCRIPCIÓN Y URL DE IMAGEN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Descripción Corta o Detalle del Pack
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                  placeholder="Ej: 1 Pisco Alto del Carmen 35° 1L, 1 Coca-Cola 1.5L y 1 Bolsa Hielo 1KG"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  URL de Imagen del Pack (Google Drive / Web)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-orange-500"
                    placeholder="https://drive.google.com/... o https://images..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!imageUrl) return alert('Ingresa una URL de imagen primero.');
                      setCropTargetUrl(imageUrl);
                      setIsCropOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-orange-600/30 text-orange-300 border border-orange-500/40 text-xs font-bold hover:bg-orange-600/50 transition-colors shrink-0"
                  >
                    <Crop className="w-4 h-4" />
                    <span>Encuadre 1:1</span>
                  </button>
                </div>
              </div>
            </div>

            {/* FILA 3: PRODUCTOS DEL PACK (CONSTRUCTOR EN TABLA PLANA Y ANCHA) */}
            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-orange-400" />
                    <span>Productos Incluidos en este Pack ({selectedItems.length})</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Todos los productos aparecen ordenados alfabéticamente (A-Z) para tu selección rápida.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToPromo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Producto al Pack</span>
                </button>
              </div>

              {selectedItems.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                  Haz clic en &quot;+ Agregar Producto al Pack&quot; para seleccionar los licores y bebidas que componen este pack.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedItems.map((item, idx) => {
                    const currentProd = products.find((p) => p.id === item.product_id);
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800"
                      >
                        {/* Selector de Producto A-Z (Ancho y Claro) */}
                        <div className="md:col-span-7">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                            Producto del Catálogo (Orden A-Z)
                          </label>
                          <select
                            value={item.product_id}
                            onChange={(e) => handleUpdateItemInPromo(idx, e.target.value, item.quantity)}
                            className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                          >
                            {sortedProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.stock} un. | Costo: ${p.cost_price || 0})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Cantidad en el Pack */}
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1 text-center">
                            Cant. en Pack
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItemInPromo(idx, item.product_id, parseInt(e.target.value) || 1)
                            }
                            className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-center text-white font-mono font-black text-sm focus:outline-none focus:border-orange-500"
                          />
                        </div>

                        {/* Stock Disponible en Bodega */}
                        <div className="md:col-span-2 text-center">
                          <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                            Stock en Bodega
                          </span>
                          <span
                            className={`inline-block px-3 py-1.5 rounded-xl text-xs font-black font-mono ${
                              (currentProd?.stock || 0) < item.quantity
                                ? 'bg-red-950/60 text-red-400 border border-red-500/40'
                                : 'bg-zinc-950 text-zinc-300 border border-zinc-800'
                            }`}
                          >
                            {currentProd?.stock || 0} un.
                          </span>
                        </div>

                        {/* Botón Eliminar Ítem */}
                        <div className="md:col-span-1 flex justify-end items-center pt-3 md:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromPromo(idx)}
                            className="p-2.5 rounded-xl text-red-400 hover:bg-red-950/60 transition-colors"
                            title="Eliminar del pack"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Indicador de Disponibilidad de Packs */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange-600/20 text-orange-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {maxPacksArmables > 0
                        ? `Quedan ${maxPacksArmables} Packs Armables en Bodega`
                        : 'Pack Agotado (Stock Insuficiente)'}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Calculado automáticamente según el stock individual de los productos seleccionados.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN: GUARDAR / CANCELAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingPromo(null);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                Cancelar y Volver al Catálogo
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-sm shadow-neon-orange hover:opacity-95 transition-all"
              >
                <Check className="w-5 h-5" />
                <span>{editingPromo ? 'Guardar Cambios del Pack' : 'Guardar y Publicar Promoción'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* CATÁLOGO DE PROMOCIONES CREADAS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white tracking-tight">
            Packs y Promociones Activas ({promotions.length})
          </h2>
          {promotions.length > 0 && !isFormOpen && (
            <button
              onClick={handleOpenAddForm}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar otra promoción</span>
            </button>
          )}
        </div>

        {promotions.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900 border-2 border-dashed border-zinc-800 space-y-3">
            <Sparkles className="w-10 h-10 mx-auto text-orange-400" />
            <h3 className="text-base font-bold text-white">No tienes packs promocionales creados</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Crea ofertas especiales combinando varios productos (como Pisco + Bebida + Hielo) para aumentar tu ticket promedio de venta.
            </p>
            <button
              onClick={handleOpenAddForm}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors"
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

              const firstProdImg = promo.items?.[0]?.product?.image_url;
              const hasCustom =
                promo.image_url &&
                !promo.image_url.includes('images.unsplash.com/photo-1514362545857-3bc16c4c7d1b') &&
                !promo.image_url.includes('images.unsplash.com/photo-1527281400683-1aae777175f8');
              const displayImg = hasCustom ? promo.image_url : (firstProdImg || promo.image_url);

              return (
                <div
                  key={promo.id}
                  className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 rounded-3xl p-4 flex flex-col justify-between space-y-4 shadow-lg transition-all"
                >
                  {/* Imagen cuadrada 1:1 */}
                  <SquareImageContainer
                    src={displayImg}
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
                      onClick={() => handleOpenEditForm(promo)}
                      className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                      title="Editar Promoción"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePromo(promo.id)}
                      className="p-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors"
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
      </section>

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
