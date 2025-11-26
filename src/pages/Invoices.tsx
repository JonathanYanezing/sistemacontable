import { useState, useMemo } from 'react';
import { StorageService } from '../utils/storage';
import { calculateIVA, generateInvoiceNumber } from '../utils/ecuadorianRules';
import { Plus, Search, Download, X, Eye, CheckCircle, UserPlus, HelpCircle, FileCode } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import InvoiceView from '../components/InvoiceView';
import QuickClientForm from '../components/QuickClientForm';
import ProductSelector from '../components/ProductSelector';
import { SriService } from '../services/sriService';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { generateInvoiceXML } from '../utils/xmlInvoiceGenerator';

export default function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'emitidas' | 'recibidas'>('emitidas');
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [authorizing, setAuthorizing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    clientId: '',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    items: [{ code: '', description: '', quantity: 1, unitPrice: 0, ivaRate: 12, additionalDetail: '' }],
    paymentMethod: '20-OTROS CON UTILIZACION DEL SISTEMA FINANCIERO',
    paymentDetails: {
      bank: '',
      accountNumber: '',
      transferNumber: '',
      checkNumber: '',
    },
  });

  const invoices = StorageService.getInvoices() as any[];
  const clients = StorageService.getClients() as any[];
  const products = StorageService.getProducts() as any[];
  const purchases = StorageService.getPurchases() as any[];
  const company = StorageService.getCompany();

  const getInvoiceDate = (inv: any) => {
    const raw = inv?.issueDate || inv?.issue_date || inv?.issue_date || inv?.issueDate;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(
      (inv: any) =>
        inv.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  const handleProductSelect = (index: number, product: any) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      code: product.code,
      description: product.name,
      unitPrice: product.salePrice || 0,
      ivaRate: product.ivaRate || 12,
    };
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { code: '', description: '', quantity: 1, unitPrice: 0, ivaRate: 12, additionalDetail: '' }],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!company) {
      toast.error('Configure primero la información de la empresa');
      return;
    }

    const client = clients.find((c: any) => c.id === formData.clientId);
    if (!client) {
      toast.error('Seleccione un cliente');
      return;
    }

    const subtotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const iva = formData.items.reduce(
      (sum, item) => sum + calculateIVA(item.quantity * item.unitPrice, item.ivaRate),
      0
    );
    const total = subtotal + iva;

    const sequential = invoices.length + 1;
    const invoiceNumber = generateInvoiceNumber(
      (company as any)?.establishment || '001',
      (company as any)?.pointOfSale || '001',
      sequential
    );

    try {
      const newInvoice = {
        number: invoiceNumber,
        client_id: formData.clientId,
        issue_date: formData.issueDate,
        due_date: formData.dueDate,
        subtotal,
        iva,
        total,
        status: 'pending',
        payment_method: formData.paymentMethod,
        payment_details: formData.paymentDetails,
        items: formData.items.map(item => ({
          code: item.code || `ITEM-${Date.now()}`,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          iva_rate: item.ivaRate,
          additional_detail: item.additionalDetail,
        })),
      };

      // Guardar en localStorage
      const invoiceWithId = {
        ...newInvoice,
        id: Date.now().toString(),
        client: client,
        issueDate: formData.issueDate,
        issue_date: formData.issueDate,
        dueDate: formData.dueDate,
        due_date: formData.dueDate,
      };
      StorageService.setInvoices([...invoices, invoiceWithId]);
      
      toast.success('Factura creada exitosamente');
      setShowForm(false);
      setFormData({
        clientId: '',
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        items: [{ code: '', description: '', quantity: 1, unitPrice: 0, ivaRate: 12, additionalDetail: '' }],
        paymentMethod: '20-OTROS CON UTILIZACION DEL SISTEMA FINANCIERO',
        paymentDetails: {
          bank: '',
          accountNumber: '',
          transferNumber: '',
          checkNumber: '',
        },
      });
    } catch (error: any) {
      console.error('Error al crear factura:', error);
      toast.error(error.message || 'Error al crear la factura');
    }
  };

  const handleAuthorize = async (invoice: any) => {
    if (!company) {
      toast.error('Configure primero la información de la empresa');
      return;
    }
    const validation = SriService.validateInvoice(invoice, company);
    
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }

    setAuthorizing(invoice.id);
    try {
      const response = await SriService.authorizeInvoice(invoice, company);
      
      if (response.authorized) {
        const updatedInvoices = invoices.map((inv: any) => {
          if (inv.id === invoice.id) {
            return {
              ...inv,
              status: 'authorized',
              authorizationNumber: response.authorizationNumber,
              authorizationDate: response.authorizationDate,
              accessKey: response.accessKey,
            };
          }
          return inv;
        });
        StorageService.setInvoices(updatedInvoices);
        
        toast.success('Factura autorizada por el SRI');
      } else {
        toast.error(response.message || 'Error al autorizar la factura');
      }
    } catch (error: any) {
      toast.error('Error al conectar con el SRI: ' + error.message);
    } finally {
      setAuthorizing(null);
    }
  };

  const handleDownloadPDF = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setTimeout(async () => {
      try {
        const fileName = `Factura-${invoice.number}.pdf`;
        await generateInvoicePDF('invoice-content', fileName);
        toast.success('Factura descargada exitosamente');
      } catch (error: any) {
        toast.error('Error al generar PDF: ' + error.message);
      }
    }, 100);
  };

  const buildDemoInvoice = () => {
    const fallbackCompany = {
      name: 'Sistema Contable IngetSoport',
      tradeName: 'IngetSoport',
      ruc: '1792146739001',
      address: 'Av. Amazonas y NN.UU.',
      establishment: '001',
      pointOfSale: '001',
      environment: 'testing',
    };

    const fallbackClient = {
      id: 'demo-client',
      name: 'PRUEBAS SERVICIO DE RENTAS INTERNAS',
      identification: '1713328506001',
      address: 'Sebastián Moreno S/N',
      email: 'demo@sri.gob.ec',
      phone: '0999999999',
    };

    const activeCompany = (company as any) || fallbackCompany;
    const demoClient = clients[0] || fallbackClient;
    const issueDate = new Date();
    const items = [
      {
        code: '125BJC-01',
        description: 'SERVICIO CONTABLE EMPRESARIAL',
        quantity: 1,
        unitPrice: 400,
        ivaRate: 12,
        additionalDetail: 'Incluye facturación electrónica y ATS',
      },
      {
        code: 'SERV-002',
        description: 'IMPLEMENTACIÓN API SRI',
        quantity: 1,
        unitPrice: 250,
        ivaRate: 15,
        additionalDetail: 'Recepción y autorización offline',
      },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const ivaTotal = items.reduce(
      (sum, item) => sum + calculateIVA(item.quantity * item.unitPrice, item.ivaRate),
      0
    );

    return {
      id: 'demo-invoice',
      number: `${activeCompany.establishment}-${activeCompany.pointOfSale}-000000001`,
      issueDate: issueDate.toISOString(),
      issue_date: issueDate.toISOString(),
      dueDate: issueDate.toISOString(),
      clientId: demoClient.id,
      client: demoClient,
      items: items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice,
      })),
      subtotal,
      iva: ivaTotal,
      total: subtotal + ivaTotal,
      status: 'authorized',
      authorizationNumber: '2110201101179214673900110020010000000011234567813',
      authorizationDate: new Date().toISOString(),
      accessKey: '2110201101179214673900110020010000000011234567813',
      paymentMethod: '20-OTROS CON UTILIZACION DEL SISTEMA FINANCIERO',
      paymentDetails: {
        bank: 'Banco Pichincha',
        accountNumber: '1234567890',
        transferNumber: 'TRX-001234',
      },
    };
  };

  const handleOpenDemoPreview = () => {
    const demoInvoice = buildDemoInvoice();
    setSelectedInvoice(demoInvoice);
    toast.info('Vista previa demo cargada');
  };

  const handleDownloadDemoPDF = () => {
    const demoInvoice = buildDemoInvoice();
    handleDownloadPDF(demoInvoice);
  };

  const handleDownloadXML = (invoice: any) => {
    try {
      if (!company) {
        toast.error('Configura la información de la empresa antes de generar XML.');
        return;
      }

      const client =
        invoice.client ||
        clients.find((c: any) => c.id === invoice.clientId);

      const xml = generateInvoiceXML(invoice, company, client);
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Factura-${invoice.number}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('XML generado exitosamente');
    } catch (error: any) {
      console.error('Error al generar XML:', error);
      toast.error(error.message || 'No se pudo generar el XML');
    }
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
  };

  const handleClientCreated = (clientId: string) => {
    setFormData({ ...formData, clientId });
    setShowQuickClient(false);
  };

  const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Facturación Electrónica</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gestiona tus comprobantes de venta y visualiza las facturas emitidas y recibidas.
          </p>
        </div>
        <button
          onClick={() => {
            setActiveTab('emitidas');
            setShowForm(!showForm);
          }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Nueva Factura
        </button>
      </div>

      <div className="mb-6 inline-flex rounded-full bg-gray-100 p-1 border border-gray-200">
        <button
          onClick={() => setActiveTab('emitidas')}
          className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${
            activeTab === 'emitidas'
              ? 'bg-white shadow text-primary-700'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Facturas Emitidas ({filteredInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('recibidas')}
          className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${
            activeTab === 'recibidas'
              ? 'bg-white shadow text-primary-700'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Facturas Recibidas ({purchases.length})
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between shadow-sm">
        <div>
          <p className="text-sm font-semibold text-gray-700">Vista previa del formato oficial</p>
          <p className="text-xs text-gray-500">Abre el diseño demo o descarga el PDF sin cargar datos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleOpenDemoPreview}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Demo
          </button>
          <button
            onClick={handleDownloadDemoPDF}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar PDF Demo
          </button>
        </div>
      </div>

      {activeTab === 'emitidas' && showForm && (
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6 border border-gray-200">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Crear Factura</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Cliente *</label>
                  <Tooltip text="Seleccione un cliente existente o cree uno nuevo">
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <div className="flex gap-2">
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client: any) => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.identification}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowQuickClient(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    title="Crear cliente rápido"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">Fecha Emisión</label>
                    <Tooltip text="Fecha en que se emite la factura">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-medium text-gray-700">Fecha Vencimiento</label>
                    <Tooltip text="Fecha límite de pago">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">Items</label>
                  <Tooltip text="Productos o servicios a facturar. Escribe para buscar productos">
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Item
                </button>
              </div>
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="relative bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-12 md:col-span-5">
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-xs font-semibold text-gray-700">Producto/Servicio *</label>
                          <Tooltip text="Seleccione un producto del catálogo o escriba la descripción directamente">
                            <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <ProductSelector
                          value={item.code || item.description || ''}
                          onChange={(product) => handleProductSelect(index, product)}
                          products={products}
                          placeholder="Seleccione o busque un producto..."
                          allowManualInput={true}
                          onManualInput={(value) => handleItemChange(index, 'description', value)}
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-xs text-gray-600">Cantidad</label>
                            <Tooltip text="Cantidad del producto o servicio">
                              <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          required
                          min="0.01"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-xs text-gray-600">Precio Unit.</label>
                          <Tooltip text="Precio unitario sin IVA">
                            <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          required
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-xs text-gray-600">IVA %</label>
                          <Tooltip text="Porcentaje de IVA (12%, 15%, 0%)">
                            <HelpCircle className="w-3 h-3 text-gray-400 cursor-help" />
                          </Tooltip>
                        </div>
                        <input
                          type="number"
                          value={item.ivaRate}
                          onChange={(e) => handleItemChange(index, 'ivaRate', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-1">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="mt-6 w-full px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Eliminar item"
                          >
                            <X className="w-4 h-4 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Método de Pago */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Método de Pago</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pago *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="01-EFECTIVO">01 - EFECTIVO</option>
                    <option value="15-CHEQUE">15 - CHEQUE</option>
                    <option value="16-TARJETA DE CRÉDITO">16 - TARJETA DE CRÉDITO</option>
                    <option value="17-TARJETA DE DÉBITO">17 - TARJETA DE DÉBITO</option>
                    <option value="18-TARJETA PREPAGO">18 - TARJETA PREPAGO</option>
                    <option value="19-DINERO ELECTRÓNICO">19 - DINERO ELECTRÓNICO</option>
                    <option value="20-OTROS CON UTILIZACION DEL SISTEMA FINANCIERO">20 - OTROS CON UTILIZACION DEL SISTEMA FINANCIERO</option>
                    <option value="21-ENDOSO DE TÍTULOS">21 - ENDOSO DE TÍTULOS</option>
                  </select>
                </div>
                {(formData.paymentMethod.includes('20') || formData.paymentMethod.includes('15')) && (
                  <>
                    {formData.paymentMethod.includes('20') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Banco
                          </label>
                          <input
                            type="text"
                            value={formData.paymentDetails.bank}
                            onChange={(e) => setFormData({
                              ...formData,
                              paymentDetails: { ...formData.paymentDetails, bank: e.target.value }
                            })}
                            placeholder="Ej: Banco Pichincha"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Cuenta
                          </label>
                          <input
                            type="text"
                            value={formData.paymentDetails.accountNumber}
                            onChange={(e) => setFormData({
                              ...formData,
                              paymentDetails: { ...formData.paymentDetails, accountNumber: e.target.value }
                            })}
                            placeholder="Número de cuenta bancaria"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Transferencia
                          </label>
                          <input
                            type="text"
                            value={formData.paymentDetails.transferNumber}
                            onChange={(e) => setFormData({
                              ...formData,
                              paymentDetails: { ...formData.paymentDetails, transferNumber: e.target.value }
                            })}
                            placeholder="Número de transferencia"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </>
                    )}
                    {formData.paymentMethod.includes('15') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número de Cheque
                        </label>
                        <input
                          type="text"
                          value={formData.paymentDetails.checkNumber}
                          onChange={(e) => setFormData({
                            ...formData,
                            paymentDetails: { ...formData.paymentDetails, checkNumber: e.target.value }
                          })}
                          placeholder="Número de cheque"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
              >
                Crear Factura
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'emitidas' && (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar facturas por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No hay facturas. Crea una nueva factura para comenzar.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.client?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        const date = getInvoiceDate(invoice);
                        return date ? format(date, 'dd/MM/yyyy') : 'Sin fecha';
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${invoice.total?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          invoice.status === 'authorized'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {invoice.status === 'authorized' ? 'Autorizada' : invoice.status === 'pending' ? 'Pendiente' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="text-primary-600 hover:text-primary-800 p-1 hover:bg-primary-50 rounded transition-colors"
                          title="Ver factura"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPDF(invoice)}
                          className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded transition-colors"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadXML(invoice)}
                          className="text-purple-600 hover:text-purple-800 p-1 hover:bg-purple-50 rounded transition-colors"
                          title="Descargar XML"
                        >
                          <FileCode className="w-4 h-4" />
                        </button>
                        {invoice.status === 'pending' && (
                          <button
                            onClick={() => handleAuthorize(invoice)}
                            disabled={authorizing === invoice.id}
                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded disabled:opacity-50 transition-colors"
                            title="Autorizar con SRI"
                          >
                            {authorizing === invoice.id ? (
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {activeTab === 'recibidas' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar facturas recibidas por número o proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No hay facturas recibidas. Registra compras en el módulo de Compras.
                    </td>
                  </tr>
                ) : (
                  purchases
                    .filter(
                      (p: any) =>
                        p.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((purchase: any) => (
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
      )}

      {selectedInvoice && (
        <InvoiceView
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {showQuickClient && (
        <QuickClientForm
          onClose={() => setShowQuickClient(false)}
          onClientCreated={handleClientCreated}
        />
      )}
    </div>
  );
}
