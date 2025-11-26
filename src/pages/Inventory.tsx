import { useState, useMemo } from 'react';
import { StorageService } from '../utils/storage';
import { Plus, Search, AlertTriangle, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function Inventory() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    stock: 0,
    minStock: 0,
    costPrice: 0,
    salePrice: 0,
    ivaRate: 12,
    trackInventory: true,
  });

  const products = StorageService.getProducts();
  const movements = StorageService.getInventoryMovements();

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p: any) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const lowStockProducts = filteredProducts.filter((p: any) => p.stock <= p.minStock && p.trackInventory);

  // Kardex para un producto
  const getProductKardex = (productId: string) => {
    return movements.filter((m: any) => m.productId === productId).sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    StorageService.setProducts([...products, newProduct]);
    toast.success('Producto creado exitosamente');
    setShowForm(false);
    setFormData({
      code: '',
      name: '',
      description: '',
      stock: 0,
      minStock: 0,
      costPrice: 0,
      salePrice: 0,
      ivaRate: 12,
      trackInventory: true,
    });
  };

  const handleMovement = (product: any, type: 'entry' | 'exit' | 'adjustment', quantity: number) => {
    const newMovement = {
      id: Date.now().toString(),
      productId: product.id,
      product: product,
      type,
      quantity,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updatedProducts = products.map((p: any) => {
      if (p.id === product.id) {
        let newStock = p.stock;
        if (type === 'entry') newStock += quantity;
        else if (type === 'exit') newStock -= quantity;
        else if (type === 'adjustment') newStock = quantity;
        return { ...p, stock: Math.max(0, newStock) };
      }
      return p;
    });

    StorageService.setProducts(updatedProducts);
    StorageService.setInventoryMovements([...movements, newMovement]);
    toast.success('Movimiento registrado exitosamente');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
          Inventario y Kardex
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 mb-6 flex items-center gap-3 shadow-md">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          <div>
            <p className="font-bold text-yellow-900 text-lg">
              ⚠️ {lowStockProducts.length} producto(s) con stock bajo
            </p>
            <p className="text-sm text-yellow-800">Revisa el inventario y realiza compras urgentes</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl p-6 mb-6 border-2 border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Nuevo Producto</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Mínimo</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio Costo</label>
                <input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Precio Venta</label>
                <input
                  type="number"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">IVA (%)</label>
              <input
                type="number"
                value={formData.ivaRate}
                onChange={(e) => setFormData({ ...formData, ivaRate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
              >
                Crear Producto
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200">
        <div className="p-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Código</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Precio Costo</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Precio Venta</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No hay productos. Crea uno nuevo para comenzar.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {product.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={product.stock <= product.minStock ? 'text-red-600 font-bold text-base' : 'font-semibold'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${product.costPrice?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ${product.salePrice?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.stock <= product.minStock ? (
                        <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800 font-bold">
                          Stock Bajo
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 font-bold">
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="text-primary-600 hover:text-primary-800 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Ver Kardex"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Kardex */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Kardex - {selectedProduct.name}</h2>
                  <p className="text-sm text-gray-600">Código: {selectedProduct.code}</p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Movimientos rápidos */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => {
                    const qty = prompt('Cantidad a ingresar:');
                    if (qty) handleMovement(selectedProduct, 'entry', parseFloat(qty));
                  }}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-semibold"
                >
                  <TrendingUp className="w-5 h-5" />
                  Entrada
                </button>
                <button
                  onClick={() => {
                    const qty = prompt('Cantidad a salir:');
                    if (qty) handleMovement(selectedProduct, 'exit', parseFloat(qty));
                  }}
                  className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-semibold"
                >
                  <TrendingDown className="w-5 h-5" />
                  Salida
                </button>
                <button
                  onClick={() => {
                    const qty = prompt('Nuevo stock:');
                    if (qty) handleMovement(selectedProduct, 'adjustment', parseFloat(qty));
                  }}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-semibold"
                >
                  Ajuste
                </button>
              </div>

              {/* Tabla Kardex */}
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-bold">Tipo</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">Cantidad</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">Stock Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getProductKardex(selectedProduct.id).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-gray-500">
                          No hay movimientos registrados
                        </td>
                      </tr>
                    ) : (
                      getProductKardex(selectedProduct.id).map((movement: any, index: number) => {
                        let stockAfter = selectedProduct.stock;
                        for (let i = 0; i <= index; i++) {
                          const m = getProductKardex(selectedProduct.id)[i] as any;
                          if (m.type === 'entry') stockAfter += m.quantity;
                          else if (m.type === 'exit') stockAfter -= m.quantity;
                          else if (m.type === 'adjustment') stockAfter = m.quantity;
                        }
                        return (
                          <tr key={movement.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {format(new Date(movement.date), 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                  movement.type === 'entry'
                                    ? 'bg-green-100 text-green-800'
                                    : movement.type === 'exit'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {movement.type === 'entry' ? 'ENTRADA' : movement.type === 'exit' ? 'SALIDA' : 'AJUSTE'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                              {movement.type === 'entry' ? '+' : movement.type === 'exit' ? '-' : ''}
                              {movement.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{stockAfter}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
