import { useState, useMemo } from 'react';
import { StorageService } from '../utils/storage';
import { Plus, Search, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function WorkOrders() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    status: 'pending',
  });

  const workOrders = StorageService.getWorkOrders();
  const clients = StorageService.getClients();

  const filteredOrders = useMemo(() => {
    return workOrders.filter(
      (o: any) =>
        o.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workOrders, searchTerm]);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c: any) => c.id === formData.clientId);
    if (!client) {
      toast.error('Seleccione un cliente');
      return;
    }

    const subtotal = formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    const newOrder = {
      id: Date.now().toString(),
      number: `OT-${String(workOrders.length + 1).padStart(6, '0')}`,
      clientId: formData.clientId,
      client: client,
      description: formData.description,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      items: formData.items,
      subtotal,
      iva,
      total,
      status: formData.status,
      createdAt: new Date().toISOString(),
    };

    StorageService.setWorkOrders([...workOrders, newOrder]);
    toast.success('Orden de trabajo creada exitosamente');
    setShowForm(false);
    setFormData({
      clientId: '',
      description: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      status: 'pending',
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          Órdenes de Trabajo
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Nueva Orden
        </button>
      </div>

      {showForm && (
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-2xl p-6 mb-6 border-2 border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Nueva Orden de Trabajo</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.identification}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Vencimiento</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Items</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  + Agregar Item
                </button>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Precio"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="w-full px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <X className="w-4 h-4 mx-auto" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-lg"
              >
                Crear Orden
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
              placeholder="Buscar órdenes..."
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
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Número</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Fecha Inicio</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Fecha Venc.</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase">Total</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No hay órdenes de trabajo.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {order.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.client?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.startDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.dueDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                      ${order.total?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-bold ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status === 'completed' ? 'Completada' : order.status === 'in_progress' ? 'En Progreso' : order.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
