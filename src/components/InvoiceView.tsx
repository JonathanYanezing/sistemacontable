import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { calculateIVA } from '../utils/ecuadorianRules';
import { StorageService } from '../utils/storage';

interface InvoiceViewProps {
  invoice: any;
  onClose: () => void;
}

const formatMoney = (value: number = 0) =>
  `$${(Number(value) || 0).toFixed(2)}`;

export default function InvoiceView({ invoice, onClose }: InvoiceViewProps) {
  const company = StorageService.getCompany() as any;
  const client = (invoice.client ||
    StorageService.getClients().find((c: any) => c.id === invoice.clientId)) as any;

  if (!invoice) return null;

  const normalizeItems = () =>
    (invoice.items || []).map((item: any, index: number) => {
      const quantity = Number(item.quantity ?? item.cantidad ?? 0);
      const unitPrice = Number(item.unitPrice ?? item.unit_price ?? 0);
      return {
        code: item.code || item.codigo || item.codigoPrincipal || `ITEM-${index + 1}`,
        auxCode: item.codeAux || item.codigoAuxiliar || '',
        description: item.description || item.descripcion || 'Detalle',
        additionalDetail: item.additionalDetail || item.detalleAdicional || '',
        quantity,
        unitPrice,
        discount: Number(item.discount ?? item.descuento ?? 0),
        subsidy: Number(item.subsidy ?? item.subsidio ?? 0),
        ivaRate: Number(item.ivaRate ?? item.iva_rate ?? 12),
      };
    });

  const items = normalizeItems();

  const parseDate = (value?: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const issueDate = parseDate(invoice.issueDate || invoice.issue_date);
  const authorizationDate = parseDate(
    invoice.authorizationDate || invoice.authorization_date
  );

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.unitPrice,
    0
  );
  const iva = items.reduce(
    (sum: number, item: any) =>
      sum + calculateIVA(item.quantity * item.unitPrice, item.ivaRate),
    0
  );
  const total = subtotal + iva;

  const subtotalByRate = (rate: number) =>
    items
      .filter((item: any) => item.ivaRate === rate)
      .reduce(
        (sum: number, item: any) => sum + item.quantity * item.unitPrice,
        0
      );

  const subtotal12 = subtotalByRate(12);
  const subtotal15 = subtotalByRate(15);
  const subtotal0 = subtotalByRate(0);

  const invoiceNumber =
    invoice.number ||
    invoice.sequential ||
    `${company?.establishment || '001'}-${company?.pointOfSale || '001'}-${String(
      invoice.id || 1
    ).padStart(9, '0')}`;
  const authorizationNumber =
    invoice.authorizationNumber || invoice.authorization_number || '';
  const accessKey = invoice.accessKey || invoice.claveAcceso || authorizationNumber;
  const environmentLabel =
    company?.environment === 'production' ? 'PRODUCCIÓN' : 'PRUEBAS';
  const paymentMethod =
    invoice.paymentMethod || invoice.payment_method || 'SIN UTILIZACION DEL SISTEMA FINANCIERO';

  const companyAddress = company?.address || 'N/A';
  const sucursalAddress = company?.branchAddress || companyAddress;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6" id="invoice-content">
          <div className="border-2 border-gray-800">
            {/* Header estilo TuFacturero */}
            <div className="grid grid-cols-3 border-b-2 border-gray-800">
              <div className="col-span-1 border-r-2 border-gray-800 bg-white">
                <div className="bg-blue-600 p-3 text-white text-center">
                  <p className="text-xs font-bold">SRI</p>
                  <p className="text-[10px] mt-1">FACTURACIÓN ELECTRÓNICA</p>
                </div>
                <div className="p-3 text-[10px] space-y-1">
                  <p className="font-semibold text-gray-800">Dirección Matriz:</p>
                  <p className="text-gray-700">{companyAddress}</p>
                  <p className="font-semibold text-gray-800 mt-2">Dirección Sucursal:</p>
                  <p className="text-gray-700">{sucursalAddress}</p>
                  {company?.specialContributor && (
                    <>
                      <p className="font-semibold text-gray-800 mt-2">Contribuyente Especial Nro:</p>
                      <p className="text-gray-700">{company.specialContributor}</p>
                    </>
                  )}
                  <p className="font-semibold text-gray-800 mt-2">
                    OBLIGADO A LLEVAR CONTABILIDAD:{' '}
                    <span className="font-normal">{company?.accountingObligation || 'SI'}</span>
                  </p>
                </div>
              </div>
              <div className="col-span-2 p-4 bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-700">R.U.C.:</p>
                    <p className="text-xl font-black text-gray-900">{company?.ruc || '---------------'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900 tracking-wide">FACTURA</p>
                    <p className="text-xs text-gray-700 mt-1">
                      No. <span className="font-bold">{invoiceNumber}</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-gray-300 pt-3">
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">NÚMERO DE AUTORIZACIÓN</p>
                    <p className="text-gray-900 font-mono text-[9px] break-all leading-tight">
                      {authorizationNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">FECHA Y HORA DE AUTORIZACIÓN</p>
                    <p className="text-gray-900">
                      {authorizationDate
                        ? format(authorizationDate, 'dd/MM/yyyy HH:mm:ss')
                        : issueDate
                        ? format(issueDate, 'dd/MM/yyyy HH:mm:ss')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">AMBIENTE</p>
                    <p className="text-gray-900 uppercase">{environmentLabel}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">EMISIÓN</p>
                    <p className="text-gray-900 uppercase">{invoice.emission || 'NORMAL'}</p>
                  </div>
                </div>
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <p className="text-[10px] font-semibold text-gray-700 mb-1">CLAVE DE ACCESO</p>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-32 bg-gray-100 border border-gray-300 flex items-center justify-center text-[8px] text-gray-500">
                      [Código QR]
                    </div>
                    <p className="font-mono text-[9px] break-all flex-1 text-gray-900">{accessKey || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Client info estilo TuFacturero */}
            <div className="border-b-2 border-gray-800 bg-gray-50 p-3">
              <div className="grid grid-cols-4 gap-3 text-[10px]">
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Razón Social / Nombres y Apellidos:</p>
                  <p className="text-gray-900">{client?.name || '---'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Identificación:</p>
                  <p className="text-gray-900">{client?.identification || '---'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Fecha Emisión:</p>
                  <p className="text-gray-900">{issueDate ? format(issueDate, 'dd/MM/yyyy') : '---'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">Dirección:</p>
                  <p className="text-gray-900">{client?.address || '---'}</p>
                </div>
              </div>
            </div>

            {/* Items tabla estilo TuFacturero */}
            <div className="p-3 border-b-2 border-gray-800">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-600 px-2 py-1.5 text-left font-bold">Cod. Principal</th>
                    <th className="border border-gray-600 px-2 py-1.5 text-left font-bold">Cod. Auxiliar</th>
                    <th className="border border-gray-600 px-2 py-1.5 text-center font-bold">Cant</th>
                    <th className="border border-gray-600 px-2 py-1.5 text-left font-bold">Descripción</th>
                    <th className="border border-gray-600 px-2 py-1.5 text-left font-bold">Detalle Adicional</th>
                    <th className="border border-gray-600 px-2 py-1.5 text-right font-bold">Precio Unitario</th>
                    <th className="border border-gray-600 px-2 py-1.5 text-right font-bold">Descuento</th>
                    <th className="border border-gray-600 px-2 py-1.5 text-right font-bold">Precio Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: number) => {
                    const lineSubtotal = item.quantity * item.unitPrice - item.discount;
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-400 px-2 py-1.5">{item.code}</td>
                        <td className="border border-gray-400 px-2 py-1.5">{item.auxCode || '-'}</td>
                        <td className="border border-gray-400 px-2 py-1.5 text-center">{item.quantity.toFixed(2)}</td>
                        <td className="border border-gray-400 px-2 py-1.5">{item.description}</td>
                        <td className="border border-gray-400 px-2 py-1.5">{item.additionalDetail || '-'}</td>
                        <td className="border border-gray-400 px-2 py-1.5 text-right">{formatMoney(item.unitPrice)}</td>
                        <td className="border border-gray-400 px-2 py-1.5 text-right">{formatMoney(item.discount)}</td>
                        <td className="border border-gray-400 px-2 py-1.5 text-right font-semibold">{formatMoney(lineSubtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Additional info and totals estilo TuFacturero */}
            <div className="grid grid-cols-2 gap-0 border-b-2 border-gray-800">
              <div className="p-3 border-r-2 border-gray-800 bg-white text-[10px]">
                <p className="font-bold mb-2 text-gray-800">Información Adicional</p>
                <div className="space-y-1 text-gray-700 mb-4">
                  {client?.address && (
                    <p><span className="font-semibold">Dirección:</span> {client.address}</p>
                  )}
                  {client?.email && (
                    <p><span className="font-semibold">Email:</span> {client.email}</p>
                  )}
                  {client?.phone && (
                    <p><span className="font-semibold">Teléfono:</span> {client.phone}</p>
                  )}
                  {invoice.additionalInfo &&
                    Object.entries(invoice.additionalInfo).map(([key, value]) => (
                      <p key={key}><span className="font-semibold">{key}:</span> {String(value)}</p>
                    ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="font-bold text-gray-800 mb-2">Forma de Pago</p>
                  <table className="w-full border border-gray-400">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 px-2 py-1 text-left font-semibold">Forma de Pago</th>
                        <th className="border border-gray-400 px-2 py-1 text-right font-semibold">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-2 py-1">{paymentMethod}</td>
                        <td className="border border-gray-400 px-2 py-1 text-right font-semibold">{formatMoney(total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="p-3 bg-white text-[10px]">
                <table className="w-full">
                  <tbody>
                    {subtotal12 > 0 && (
                      <tr>
                        <td className="py-0.5 text-gray-700">SUBTOTAL 12%</td>
                        <td className="py-0.5 text-right font-semibold">{formatMoney(subtotal12)}</td>
                      </tr>
                    )}
                    {subtotal15 > 0 && (
                      <tr>
                        <td className="py-0.5 text-gray-700">SUBTOTAL 15%</td>
                        <td className="py-0.5 text-right font-semibold">{formatMoney(subtotal15)}</td>
                      </tr>
                    )}
                    {subtotal0 > 0 && (
                      <tr>
                        <td className="py-0.5 text-gray-700">SUBTOTAL IVA 0%</td>
                        <td className="py-0.5 text-right font-semibold">{formatMoney(subtotal0)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-0.5 text-gray-700">SUBTOTAL NO OBJETO DE IVA</td>
                      <td className="py-0.5 text-right font-semibold">$0.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700">SUBTOTAL EXENTO IVA</td>
                      <td className="py-0.5 text-right font-semibold">$0.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700">SUBTOTAL SIN IMPUESTOS</td>
                      <td className="py-0.5 text-right font-semibold">{formatMoney(subtotal)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700">DESCUENTO</td>
                      <td className="py-0.5 text-right font-semibold">$0.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700">ICE</td>
                      <td className="py-0.5 text-right font-semibold">$0.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700">IVA 12%</td>
                      <td className="py-0.5 text-right font-semibold">{formatMoney(iva)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700">IRBPNR</td>
                      <td className="py-0.5 text-right font-semibold">$0.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700">PROPINA</td>
                      <td className="py-0.5 text-right font-semibold">$0.00</td>
                    </tr>
                    <tr className="border-t-2 border-gray-800">
                      <td className="py-1 font-black text-sm">VALOR TOTAL</td>
                      <td className="py-1 text-right font-black text-sm">{formatMoney(total)}</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700">VALOR TOTAL SIN SUBSIDIO</td>
                      <td className="py-0.5 text-right font-semibold">$0.00</td>
                    </tr>
                    <tr>
                      <td className="py-0.5 text-gray-700">AHORRO POR SUBSIDIO: (Incluye IVA cuando corresponda)</td>
                      <td className="py-0.5 text-right font-semibold">$0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        <div className="border-t border-gray-200 p-4 flex justify-end gap-2 bg-gray-50">
          <button
            onClick={async () => {
              try {
                const fileName = `Factura-${invoiceNumber}.pdf`;
                const { generateInvoicePDF } = await import('../utils/pdfGenerator');
                await generateInvoicePDF('invoice-content', fileName);
                onClose();
              } catch (error) {
                console.error('Error al generar PDF:', error);
              }
            }}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
