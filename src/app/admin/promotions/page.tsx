'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Promotion, PromotionItem } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Crop,
  Check,
  X,
  PackageCheck,
  PlusCircle,
} from 'lucide-react';

export default function AdminPromotionsPage() {
  const { promotions, setPromotions, products } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promoPrice, setPromoPrice] = useState<number>(11990);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ product_id: string; quantity: number }[]>([]);

  // Crop Modal state
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropTargetUrl, setCropTargetUrl] = useState('');

  const handleOpenAddModal = () => {
    setEditingPromo(null);
    setName('');
    setDescription('');
    setPromoPrice(11990);
    setImageUrl('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80');
    // Pre-poblar con 2 productos por defecto
    if (products.length >= 2) {
      setSelectedItems([
        { product_id: products[0].id, quantity: 1 },
        { product_id: products[1].id, quantity: 1 },
      ]);
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
    setSelectedItems(
      promo.items
        ? promo.items.map((pi) => ({ product_id: pi.product_id, quantity: pi.quantity }))
        : []
    );
    setIsModalOpen(true);
  };

  const handleAddItemToPromo = () => {
    if (products.length === 0) return;
    setSelectedItems((prev) => [...prev, { product_id: products[0].id, quantity: 1 }]);
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

    const formattedItems: PromotionItem[] = selectedItems.map((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        product: prod,
      };
    });

    if (editingPromo) {
      setPromotions((prev) =>
        prev.map((p) =>
          p.id === editingPromo.id
            ? {
                ...p,
                name,
                description,
                promo_price: promoPrice,
                image_url: imageUrl,
                items: formattedItems,
              }
            : p
        )
      );
    } else {
      const newPromo: Promotion = {
        id: crypto.randomUUID(),
        name,
        description,
        promo_price: promoPrice,
        image_url: imageUrl,
        is_active: true,
        items: formattedItems,
      };
      setPromotions((prev) => [newPromo, ...prev]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-orange-400" />
            Módulo de Promociones (Packs & Bundles)
          </h1>
          <p className="text-xs text-zinc-400">
            Crea promociones compuestas que descuentan stock automático de cada producto individual al venderse.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-neon-orange hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Promoción</span>
        </button>
      </div>

      {/* Grid de Promociones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {promotions.map((promo) => {
          // Calcular disponibilidad máxima según stock individual
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
              className="bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 rounded-3xl p-4 flex flex-col justify-between space-y-4"
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
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePromo(promo.id)}
                  className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Promo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-extrabold text-white">
                {editingPromo ? 'Editar Promoción Pack' : 'Crear Nueva Promoción'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre de la Promo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                  placeholder="Ej: Pack Piscola Suprema (Alto 1L + Bebida + Hielo)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Descripción corta del Pack</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white resize-none"
                  placeholder="Ej: 1 Pisco Alto del Carmen 1L, 1 Bebida Coca-Cola 1.5L y 1 Bolsa Hielo 2kg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Precio de la Promoción ($)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-extrabold text-orange-400"
                />
              </div>

              {/* ASOCIACIÓN DE PRODUCTOS INDIVIDUALES (REQUISITO CRÍTICO MÓDULO 5) */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-orange-400" />
                    <span>Productos Incluidos en la Promo</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemToPromo}
                    className="flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Agregar Ítem
                  </button>
                </div>

                <div className="space-y-2">
                  {selectedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleUpdateItemInPromo(idx, e.target.value, item.quantity)}
                        className="flex-1 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-400">Cant:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItemInPromo(idx, item.product_id, parseInt(e.target.value) || 1)
                          }
                          className="w-14 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white text-center font-bold"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemFromPromo(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">URL de Imagen Promocional</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCropTargetUrl(imageUrl);
                      setIsCropOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-600/30 text-orange-300 border border-orange-500/40 text-xs font-semibold hover:bg-orange-600/50"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    Ajuste 1:1
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs"
                >
                  Guardar Promoción
                </button>
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
