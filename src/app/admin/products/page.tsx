'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import { formatImageUrl } from '@/lib/imageUtils';
import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
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
  Upload,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function AdminProductsPage() {
  const { products, setProducts } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
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
  const [isActive, setIsActive] = useState<boolean>(true);

  // Crop Modal State
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropTargetUrl, setCropTargetUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${crypto.randomUUID().substring(0, 8)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
      if (data?.publicUrl) {
        setImageUrl(data.publicUrl);
      }
    } catch (err: unknown) {
      alert('Error al subir la imagen: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  const categoriesList = ['Piscos', 'Cervezas', 'Destilados', 'Vinos', 'Bebidas & Hielo', 'Snacks & Otros'];

  const filteredProducts = products
    .filter((p) => {
      // Filtro de Visibilidad en Catálogo
      if (visibilityFilter === 'visible' && p.is_active === false) return false;
      if (visibilityFilter === 'hidden' && p.is_active !== false) return false;

      // Filtro de Búsqueda
      return (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
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
    setIsActive(true);
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
    setIsActive(product.is_active !== false);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleVisibility = (product: Product) => {
    const nextStatus = product.is_active === false ? true : false;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: nextStatus } : p))
    );
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
                stock: editingProduct.stock, // Stock protegido contra edición manual
                image_url: cleanedImageUrl,
                is_active: isActive,
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
        stock: 0, // Stock inicial en 0, solo se incrementa mediante Facturas de Abastecimiento
        image_url: cleanedImageUrl,
        is_active: isActive,
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
              {/* Stock Protegido (Solo Lectura) */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-zinc-400 mb-1.5 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Stock en Bodega</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    disabled
                    readOnly
                    value={editingProduct ? editingProduct.stock : 0}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center text-zinc-400 font-mono font-black text-sm cursor-not-allowed select-none"
                  />
                </div>
                <span className="text-[10px] text-amber-400/90 font-medium block mt-1 leading-tight">
                  🔒 Carga stock ingresando Facturas
                </span>
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

              {/* URL Imagen o Subir Archivo */}
              <div className="lg:col-span-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-zinc-300">
                    Foto del Producto (Subir o Enlace)
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 cursor-pointer">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>📁 Subir desde Dispositivo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-purple-500"
                    placeholder="https://... o sube una foto con el botón de arriba"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!imageUrl) return alert('Ingresa una URL de imagen primero.');
                      setCropTargetUrl(imageUrl);
                      setIsCropOpen(true);
                    }}
                    className="flex items-center gap-1 px-3.5 py-3 rounded-2xl bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold hover:bg-purple-600/50 transition-colors shrink-0"
                    title="Recortar y ajustar"
                  >
                    <Crop className="w-4 h-4" />
                    <span>Ajustar</span>
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

              {/* Visibilidad en Catálogo Público */}
              <div className="lg:col-span-3 flex items-center gap-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-bold text-white cursor-pointer select-none">
                  {isActive ? '👁️ Visible en Catálogo Público' : '👁️‍🗨️ Oculto (Solo Admin)'}
                </label>
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

      {/* Barra de Búsqueda y Filtros de Visibilidad */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Input de Búsqueda */}
          <div className="relative max-w-md w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Filtros de Visibilidad en Catálogo */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => setVisibilityFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                visibilityFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-neon-purple'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setVisibilityFilter('visible')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                visibilityFilter === 'visible'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Visibles ({products.filter((p) => p.is_active !== false).length})
            </button>
            <button
              onClick={() => setVisibilityFilter('hidden')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                visibilityFilter === 'hidden'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ocultos ({products.filter((p) => p.is_active === false).length})
            </button>
          </div>
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
          const isProdVisible = prod.is_active !== false;

          return (
            <div
              key={prod.id}
              className={`group bg-zinc-900/90 border rounded-2xl p-3.5 flex flex-col justify-between transition-all shadow-lg ${
                !isProdVisible
                  ? 'border-amber-500/40 bg-zinc-950/60 opacity-80'
                  : 'border-zinc-800 hover:border-purple-500/50 hover:shadow-neon-purple'
              }`}
            >
              {/* Previsualización 1:1 Cuadrada */}
              <SquareImageContainer
                src={prod.image_url}
                alt={prod.name}
                objectFit="cover"
                badgeText={
                  !isProdVisible
                    ? 'Oculto en Tienda'
                    : prod.stock < 6
                    ? prod.stock === 0
                      ? 'Agotado'
                      : `Stock: ${prod.stock}`
                    : undefined
                }
                badgeType={
                  !isProdVisible
                    ? 'warning'
                    : prod.stock < 6
                    ? prod.stock === 0
                      ? 'outOfStock'
                      : 'warning'
                    : undefined
                }
              />

              <div className="mt-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-purple-400">
                      {prod.category}
                    </span>
                    {!isProdVisible && (
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">
                        Oculto
                      </span>
                    )}
                  </div>
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
                        prod.stock < 6 ? 'text-red-400 animate-pulse' : 'text-zinc-200'
                      }`}
                    >
                      {prod.stock} un.
                    </span>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between gap-1.5">
                  {/* Botón Rápido de Ocultar / Mostrar en Tienda */}
                  <button
                    onClick={() => handleToggleVisibility(prod)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                      isProdVisible
                        ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-500/30'
                    }`}
                    title={isProdVisible ? 'Ocultar producto de la tienda pública' : 'Mostrar producto en tienda pública'}
                  >
                    {isProdVisible ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                        <span>Oculto</span>
                      </>
                    )}
                  </button>

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
