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
            ? { ...p, name, description, category, price, stock, image_url: imageUrl }
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
        stock,
        image_url: imageUrl,
        is_active: true,
      };
      setProducts((prev) => [newProd, ...prev]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" />
            Gestión de Productos e Inventario
          </h1>
          <p className="text-xs text-zinc-400">
            Administra el catálogo individual y controla los niveles de stock en tiempo real.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white text-xs font-bold shadow-neon-purple hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Bar de búsqueda */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar producto por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((prod) => {
          const isLow = prod.stock > 0 && prod.stock < 3;
          const isOut = prod.stock === 0;

          return (
            <div
              key={prod.id}
              className={`bg-zinc-900 border rounded-2xl p-3 flex flex-col justify-between ${
                isLow
                  ? 'border-red-500/50 shadow-neon-red'
                  : isOut
                  ? 'border-zinc-800 opacity-75'
                  : 'border-zinc-800'
              }`}
            >
              {/* Contenedor Cuadrado de Imagen (1:1) */}
              <SquareImageContainer
                src={prod.image_url}
                alt={prod.name}
                objectFit="cover"
                badgeText={isOut ? 'AGOTADO' : isLow ? `¡STOCK < 3! (${prod.stock})` : prod.category}
                badgeType={isOut ? 'outOfStock' : isLow ? 'warning' : 'category'}
              />

              <div className="mt-3 space-y-2">
                <h3 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h3>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Precio:</span>
                  <span className="font-extrabold text-white">
                    ${prod.price.toLocaleString('es-CL')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Stock Actual:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md ${
                      isLow ? 'bg-red-500/20 text-red-400' : isOut ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {prod.stock} un.
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEditModal(prod)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  title="Editar producto"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteProduct(prod.id)}
                  className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-400 transition-colors"
                  title="Eliminar producto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-extrabold text-white">
                {editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                  placeholder="Ej: Pisco Mistral 35° 1L"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white resize-none"
                  placeholder="Descripción detallada del producto"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Precio de Venta ($)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Stock Actual (Unidades)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-xl bg-zinc-950 border text-xs text-white ${
                    stock < 3 ? 'border-red-500 font-extrabold text-red-400' : 'border-zinc-800'
                  }`}
                />
                {stock < 3 && (
                  <span className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3" /> Activará alerta visual de stock crítico (&lt; 3)
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">URL de Imagen (Supabase Storage)</label>
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
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold hover:bg-purple-600/50"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    Encuadre 1:1
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
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 text-white font-bold text-xs"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de recorte y encuadre de imagen 1:1 */}
      <ImageCropModal
        isOpen={isCropOpen}
        onClose={() => setIsCropOpen(false)}
        imageUrl={cropTargetUrl}
        onSave={(finalUrl) => setImageUrl(finalUrl)}
      />
    </div>
  );
}
