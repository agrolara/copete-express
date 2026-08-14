'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
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
} from 'lucide-react';

export default function AdminProductsPage() {
  const { products, setProducts } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const categoriesList = ['Piscos', 'Cervezas', 'Destilados', 'Vinos', 'Bebidas & Hielo'];

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setCategory('Piscos');
    setPrice(8990);
    setCostPrice(5000);
    setStock(10);
    setImageUrl('https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setCategory(product.category);
    setPrice(product.price);
    setCostPrice(product.cost_price || Math.round(product.price * 0.6));
    setStock(product.stock);
    setImageUrl(product.image_url);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto del inventario?')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      // Actualizar
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? { ...p, name, description, category, price, cost_price: costPrice, stock, image_url: imageUrl }
            : p
        )
      );
    } else {
      // Crear Nuevo
      const newProd: Product = {
        id: crypto.randomUUID(),
        name,
        description,
        category,
        price,
        cost_price: costPrice,
        stock,
        image_url: imageUrl,
        is_active: true,
      };
      setProducts((prev) => [newProd, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleApplyCroppedImage = (croppedUrl: string) => {
    setImageUrl(croppedUrl);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Botón Agregar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-purple-400" />
            Gestión de Productos e Inventario
          </h1>
          <p className="text-xs text-zinc-400">
            Administra precios de venta, costos unitarios, margen bruto y existencias en tiempo real.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white font-extrabold text-xs shadow-neon-purple hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Producto</span>
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
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
              className="group bg-zinc-900/90 border border-zinc-800 hover:border-purple-500/50 rounded-2xl p-3 flex flex-col justify-between transition-all shadow-lg hover:shadow-neon-purple"
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
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">{prod.description}</p>
                </div>

                {/* Precios, Costo Unitario y Márgenes */}
                <div className="mt-3 p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Precio Venta:</span>
                    <span className="font-extrabold text-white">${prod.price.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Costo Unitario:</span>
                    <span className="font-semibold text-orange-400">${cost.toLocaleString('es-CL')}</span>
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

                {/* Botones Acciones */}
                <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditModal(prod)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-purple-300 hover:text-white text-xs font-bold transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    className="p-1.5 rounded-xl bg-red-950/50 hover:bg-red-900 text-red-400 transition-colors"
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

      {/* MODAL CREAR / EDITAR PRODUCTO CON COSTO UNITARIO Y PREVISUALIZADOR 1:1 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-extrabold text-white">
                {editingProduct ? 'Editar Producto & Costo' : 'Agregar Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Pisco Alto del Carmen 35° 1L"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve reseña o formato..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Stock en Bodega</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-bold"
                  />
                </div>
              </div>

              {/* CAMPOS DE PRECIO DE VENTA Y COSTO UNITARIO */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">Precio Venta ($ CLP)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-black text-sm"
                  />
                </div>

                <div>
                  <label className="block text-orange-400 font-bold mb-1">Costo Unitario ($ CLP)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-orange-500/40 text-orange-400 font-black text-sm"
                  />
                </div>
              </div>

              {/* Margen Calculado en Tiempo Real */}
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex justify-between items-center text-xs">
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Margen Bruto Estimado:
                </span>
                <span className="font-black text-emerald-400 text-sm">
                  ${(price - costPrice).toLocaleString('es-CL')} (
                  {price > 0 ? Math.round(((price - costPrice) / price) * 100) : 0}%)
                </span>
              </div>

              {/* URL de Imagen y Previsualización 1:1 */}
              <div className="space-y-2">
                <label className="block text-zinc-400 font-semibold">URL Imagen del Producto</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!imageUrl) return alert('Ingresa una URL de imagen válida primero.');
                      setCropTargetUrl(imageUrl);
                      setIsCropOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 hover:text-white font-bold transition-colors"
                  >
                    <Crop className="w-4 h-4" />
                    <span>Encuadrar 1:1</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white font-black shadow-lg"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Encuadre 1:1 de Imagen */}
      <ImageCropModal
        isOpen={isCropOpen}
        imageUrl={cropTargetUrl}
        onClose={() => setIsCropOpen(false)}
        onApply={handleApplyCroppedImage}
      />
    </div>
  );
}
