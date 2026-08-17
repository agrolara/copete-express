'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { formatImageUrl } from '@/lib/imageUtils';
import {
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Search,
  Crop,
  Check,
  X,
  Package,
  DollarSign,
  TrendingUp,
  FileText,
  Sparkles,
} from 'lucide-react';

export default function AdminProductsPage() {
  const { products, setProducts } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Piscos');
  const [price, setPrice] = useState<number>(8990);
  const [costPrice, setCostPrice] = useState<number>(5000);
  const [stock, setStock] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState('');

  // Crop Modal State
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropTargetUrl, setCropTargetUrl] = useState('');

  const categoriesList = ['Piscos', 'Cervezas', 'Destilados', 'Vinos', 'Bebidas & Hielo', 'Snacks & Otros'];

  const filteredProducts = products
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

  const handleOpenAddForm = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setCategory('Piscos');
    setPrice(8990);
    setCostPrice(5000);
    setStock(10);
    setImageUrl('https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80');
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditForm = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setCategory(product.category);
    setPrice(product.price);
    setCostPrice(product.cost_price || Math.round(product.price * 0.6));
    setStock(product.stock);
    setImageUrl(product.image_url);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedImageUrl = formatImageUrl(imageUrl);

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: name.trim(),
                description: description.trim(),
                category,
                price: Number(price),
                cost_price: Number(costPrice),
                stock: Number(stock),
                image_url: cleanedImageUrl,
              }
            : p
        )
      );
    } else {
      const newProd: Product = {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        category,
        price: Number(price),
        cost_price: Number(costPrice),
        stock: Number(stock),
        image_url: cleanedImageUrl,
        is_active: true,
      };
      setProducts((prev) => [newProd, ...prev]);
    }

    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const calculatedMargin = price - costPrice;
  const calculatedMarginPct = price > 0 ? Math.round((calculatedMargin / price) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Botones Principales */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-purple-400" />
            <span>Gestión de Productos e Inventario</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Administra catálogo, costos y existencias. Utiliza <strong>Ingresar por Factura</strong> como método principal de abastecimiento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/invoices"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 hover:opacity-95 transition-all border border-emerald-400/30"
          >
            <FileText className="w-4 h-4" />
            <span>📦 Ingresar por Factura (Principal)</span>
          </Link>

          {!isFormOpen && (
            <button
              onClick={handleOpenAddForm}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-neon-purple transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear Producto Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* FORMULARIO DIRECTO EN LA PÁGINA (EN UNA MISMA PLANA - ARRIBA Y COMPLETO) */}
      {isFormOpen && (
        <section className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border-2 border-purple-500/50 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">
                  {editingProduct ? `Editar Producto: ${editingProduct.name}` : 'Crear Nuevo Producto Manual'}
                </h2>
                <p className="text-xs text-zinc-400">
                  Todo en una sola plana: configura nombre, categoría, precios con decimales, imagen y stock de bodega.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingProduct(null);
              }}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Cerrar formulario"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-6">
            {/* FILA 1: DATOS BÁSICOS, CATEGORÍA Y PRECIOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
              {/* Nombre */}
              <div className="lg:col-span-5">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  placeholder="Ej: Pisco Mistral 35° Especial 750ml"
                />
              </div>

              {/* Categoría */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Categoría *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white font-medium focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Precio Venta */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-purple-400 mb-1.5">Precio Venta ($ CLP) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-purple-500/40 text-white font-mono font-black text-sm focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Costo Unitario */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-orange-400 mb-1.5">
                  Costo Unitario ($) (Decimales) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white font-mono font-bold text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* FILA 2: STOCK, MARGEN CALCULADO, URL IMAGEN Y DESCRIPCIÓN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 items-center">
              {/* Stock Inicial */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Stock en Bodega (un.) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center text-white font-mono font-black text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Margen Calculado */}
              <div className="lg:col-span-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Margen Unitario</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    +${calculatedMargin.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">% Margen</span>
                  <span className="text-sm font-black text-emerald-400 font-mono">{calculatedMarginPct}%</span>
                </div>
              </div>

              {/* URL Imagen */}
              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  URL de Imagen (Google Drive / Web)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-purple-500"
                    placeholder="https://drive.google.com/... o https://images..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!imageUrl) return alert('Ingresa una URL de imagen primero.');
                      setCropTargetUrl(imageUrl);
                      setIsCropOpen(true);
                    }}
                    className="flex items-center gap-1 px-3.5 py-3 rounded-2xl bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold hover:bg-purple-600/50 transition-colors shrink-0"
                  >
                    <Crop className="w-4 h-4" />
                    <span>1:1</span>
                  </button>
                </div>
              </div>

              {/* Descripción */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Descripción para Tienda</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  placeholder="Ej: Graduación 35°, botella 750cc"
                />
              </div>
            </div>

            {/* BOTONES DE ACCIÓN: GUARDAR / CANCELAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingProduct(null);
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-orange-500 text-white font-black text-sm shadow-neon-purple hover:opacity-95 transition-all"
              >
                <Check className="w-5 h-5" />
                <span>{editingProduct ? 'Guardar Cambios del Producto' : 'Guardar y Publicar en Catálogo'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Barra de Búsqueda de Productos */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar producto por nombre o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <span className="text-xs text-zinc-400 font-medium">
          Mostrando {filteredProducts.length} de {products.length} productos (Ordenados A-Z)
        </span>
      </div>

      {/* Grid de Productos con Vista Cuadrada 1:1, Costo Unitario y Márgenes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.map((prod) => {
          const cost = prod.cost_price || Math.round(prod.price * 0.6);
          const marginVal = prod.price - cost;
          const marginPct = prod.price > 0 ? Math.round((marginVal / prod.price) * 100) : 0;

          return (
            <div
              key={prod.id}
              className="group bg-zinc-900/90 border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-3.5 flex flex-col justify-between transition-all shadow-lg hover:shadow-neon-purple"
            >
              {/* Previsualización 1:1 Cuadrada */}
              <SquareImageContainer
                src={prod.image_url}
                alt={prod.name}
                objectFit="cover"
                badgeText={prod.stock < 3 ? (prod.stock === 0 ? 'Agotado' : `Stock: ${prod.stock}`) : undefined}
                badgeType={prod.stock < 3 ? (prod.stock === 0 ? 'outOfStock' : 'warning') : undefined}
              />

              <div className="mt-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-wider text-purple-400">
                    {prod.category}
                  </span>
                  <h3 className="text-sm font-extrabold text-white truncate">{prod.name}</h3>
                  {prod.description && !prod.description.toLowerCase().includes('factura') && (
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{prod.description}</p>
                  )}
                </div>

                {/* Precios, Costo Unitario y Márgenes */}
                <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Precio Venta:</span>
                    <span className="font-extrabold text-white">${prod.price.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Costo Unitario:</span>
                    <span className="font-semibold text-orange-400">
                      ${cost.toLocaleString('es-CL', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-800">
                    <span className="text-[11px] font-bold text-zinc-300">Margen Bruto:</span>
                    <span className="font-extrabold text-emerald-400 text-[11px]">
                      +${marginVal.toLocaleString('es-CL')} ({marginPct}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Stock Bodega:</span>
                    <span
                      className={`font-black ${
                        prod.stock < 3 ? 'text-red-400 animate-pulse' : 'text-zinc-200'
                      }`}
                    >
                      {prod.stock} un.
                    </span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditForm(prod)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                    title="Editar producto"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    className="p-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Crop Modal */}
      <ImageCropModal
        isOpen={isCropOpen}
        onClose={() => setIsCropOpen(false)}
        imageUrl={cropTargetUrl}
        onSave={(croppedUrl) => setImageUrl(croppedUrl)}
      />
    </div>
  );
}
