import { useState, useMemo } from 'react';
import { StorageService } from '../utils/storage';
import { Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { calculateIVA, generateInvoiceNumber } from '../utils/ecuadorianRules';

export default function Purchases() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    supplierId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    items: [{ productId: '', quantity: 1, unitPrice: 0 }],
  });

  const purchases = StorageService.getPurchases();
  const suppliers = StorageService.getSuppliers();
  const products = StorageService.getProducts();
  const clients = StorageService.getClients();
  const company = StorageService.getCompany();
  const invoices = StorageService.getInvoices();

  const filteredPurchases = useMemo(() => {
    return purchases.filter(
      (p: any) =>
        p.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [purchases, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = suppliers.find((s: any) => s.id === formData.supplierId);
    if (!supplier) {
      toast.error('Seleccione un proveedor');
      return;
    }

    const subtotal = formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const iva = subtotal * 0.12;
    const total = subtotal + iva;

    const newPurchase = {
      id: Date.now().toString(),
      number: `COMP-${String(purchases.length + 1).padStart(6, '0')}`,
      supplierId: formData.supplierId,
      supplier: supplier,
      date: formData.date,
      items: formData.items,
      subtotal,
      iva,
      total,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    StorageService.setPurchases([...purchases, newPurchase]);
    toast.success('Compra registrada exitosamente');
    
    // Automatización: Crear factura automáticamente si hay cliente asociado
    const autoCreateInvoice = window.confirm('¿Desea crear una factura automáticamente para esta compra?');
    if (autoCreateInvoice && company) {
      const supplierObj = supplier as any;
      // Buscar o crear cliente del proveedor
      let client: any = clients.find((c: any) => c.identification === supplierObj.ruc);
      if (!client) {
        // Crear cliente automáticamente desde el proveedor
        const newClient = {
          id: Date.now().toString(),
          name: supplierObj.name,
          identification: supplierObj.ruc,
          type: 'company',
          email: supplierObj.email,
          phone: supplierObj.phone,
          address: supplierObj.address,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        StorageService.setClients([...clients, newClient]);
        client = newClient;
      }
      
      // Crear factura automáticamente
      const invoiceItems = formData.items.map((item: any) => {
        const product = products.find((p: any) => p.id === item.productId) as any;
        return {
          code: product?.code || 'COMP-' + item.productId,
          description: product?.name || 'Producto de compra',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          ivaRate: product?.ivaRate || 12,
          additionalDetail: 'Compra automática',
        };
      });
      
      const invoiceSubtotal = invoiceItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const invoiceIva = invoiceItems.reduce((sum, item) => sum + calculateIVA(item.quantity * item.unitPrice, item.ivaRate), 0);
      const invoiceTotal = invoiceSubtotal + invoiceIva;
      
      const sequential = invoices.length + 1;
      const invoiceNumber = generateInvoiceNumber(
        (company as any)?.establishment || '001',
        (company as any)?.pointOfSale || '001',
        sequential
      );
      
      const autoInvoice = {
        id: (Date.now() + 1).toString(),
        number: invoiceNumber,
        clientId: client.id,
        client: client,
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        items: invoiceItems,
        subtotal: invoiceSubtotal,
        iva: invoiceIva,
        total: invoiceTotal,
        status: 'pending',
        type: 'invoice',
        paymentMethod: '20 - OTROS CON UTILIZACION DEL SISTEMA FINANCIERO',
        createdAt: new Date().toISOString(),
        relatedPurchaseId: newPurchase.id,
      };
      
      StorageService.setInvoices([...invoices, autoInvoice]);
      toast.success('Factura creada automáticamente');
    }
    
    setShowForm(false);
    setFormData({
      supplierId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      items: [{ productId: '', quantity: 1, unitPrice: 0 }],
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Compra
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Registrar Compra</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor *</label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier: any) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                Registrar Compra
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar compras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No hay compras registradas.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase: any) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {purchase.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {purchase.supplier?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(purchase.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${purchase.total?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {purchase.status === 'completed' ? 'Completada' : 'Pendiente'}
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

