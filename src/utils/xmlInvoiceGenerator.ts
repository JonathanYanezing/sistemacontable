import { format } from 'date-fns';
import { calculateIVA, generateAccessKey } from './ecuadorianRules';

const IVA_CODE_MAP: Record<number, string> = {
  0: '0',
  5: '5',
  8: '6',
  10: '7',
  12: '2',
  14: '3',
  15: '4',
};

const sanitizeText = (value?: string | number | null): string => {
  if (value === undefined || value === null) return '';
  return value
    .toString()
    .replace(/\s+/g, ' ')
    .trim();
};

const escapeXml = (value?: string | number | null): string => {
  const sanitized = sanitizeText(value);
  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const formatNumber = (value: number, decimals: number = 2): string => {
  return (Number(value) || 0).toFixed(decimals);
};

const getEnvironmentCode = (environment?: string): string => {
  return environment === 'production' ? '2' : '1'; // 1=Pruebas, 2=Producción
};

const getIdentificationType = (client: any): string => {
  const identification = client?.identification || '';
  if (identification.length === 13) return '04'; // RUC
  if (identification.length === 10) return '05'; // Cédula
  if (identification.length > 0) return '06'; // Pasaporte u otros
  return '07'; // Consumidor final
};

const getIvaCode = (rate: number): string => {
  const normalized = Math.round(Number(rate) || 0);
  return IVA_CODE_MAP[normalized] || normalized.toString();
};

const buildAccessKey = (
  invoice: any,
  company: any,
  issueDate: Date,
  establishment: string,
  pointOfSale: string,
  sequential: string
): string => {
  const formattedDate = format(issueDate, 'ddMMyyyy');
  const environment = getEnvironmentCode(company?.environment);
  const emissionType = '1'; // Emisión normal
  const numericCode = (invoice?.numericCode || Math.floor(Math.random() * 100000000))
    .toString()
    .padStart(8, '0');

  return generateAccessKey(
    formattedDate,
    '01', // Código de factura
    (company?.ruc || '').padStart(13, '0'),
    environment,
    establishment,
    pointOfSale,
    sequential,
    numericCode,
    emissionType
  );
};

const mapTaxTotals = (items: any[]) => {
  return items.reduce((acc, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discount = Number(item.discount) || 0;
    const base = quantity * unitPrice - discount;
    const rate = Number(item.ivaRate) || 0;
    const iva = calculateIVA(base, rate);

    const key = `iva-${rate}`;
    if (!acc[key]) {
      acc[key] = {
        codigo: '2',
        codigoPorcentaje: getIvaCode(rate),
        tarifa: formatNumber(rate, 2),
        baseImponible: 0,
        valor: 0,
      };
    }

    acc[key].baseImponible += base;
    acc[key].valor += iva;

    return acc;
  }, {} as Record<string, { codigo: string; codigoPorcentaje: string; tarifa: string; baseImponible: number; valor: number }>);
};


export const generateInvoiceXML = (invoice: any, company: any, client: any): string => {
  if (!company) {
    throw new Error('Configura la información de la empresa antes de generar el XML.');
  }

  if (!company.ruc || String(company.ruc).length !== 13) {
    throw new Error('El RUC de la empresa debe tener 13 dígitos.');
  }

  if (!client) {
    throw new Error('La factura no tiene un cliente asociado.');
  }

  const items = invoice.items || [];
  if (!items.length) {
    throw new Error('La factura no tiene productos.');
  }

  const issueDate = new Date(invoice.issueDate || new Date());
  const formattedDate = format(issueDate, 'dd/MM/yyyy');
  const environmentCode = getEnvironmentCode(company.environment);
  const tipoEmision = '1';

  if (!invoice.number) {
    throw new Error('La factura no tiene un número válido.');
  }

  const numberParts = (invoice.number || '').split('-');
  const establishment = (numberParts[0] || company.establishment || '001').padStart(3, '0');
  const pointOfSale = (numberParts[1] || company.pointOfSale || '001').padStart(3, '0');
  const sequential = (numberParts[2] || '').replace(/\D/g, '').padStart(9, '0');

  const accessKey = invoice.accessKey || buildAccessKey(invoice, company, issueDate, establishment, pointOfSale, sequential);

  const subtotal = items.reduce(
    (sum: number, item: any) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  );
  const discounts = items.reduce((sum: number, item: any) => sum + (Number(item.discount) || 0), 0);
  const totalSinImpuestos = subtotal - discounts;
  const totalIVA = items.reduce(
    (sum: number, item: any) =>
      sum + calculateIVA((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0), Number(item.ivaRate) || 0),
    0
  );
  const importeTotal = totalSinImpuestos + totalIVA;

  const impuestosTotales = mapTaxTotals(items);

  const detallesXml = items
    .map((item: any) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      const base = quantity * unitPrice - discount;
      const ivaRate = Number(item.ivaRate) || 0;
      const iva = calculateIVA(base, ivaRate);
      const ivaCode = getIvaCode(ivaRate);

      const impuestosXml = ivaRate > 0 ? `
        <impuestos>
          <impuesto>
            <codigo>2</codigo>
            <codigoPorcentaje>${ivaCode}</codigoPorcentaje>
            <tarifa>${formatNumber(ivaRate, 2)}</tarifa>
            <baseImponible>${formatNumber(base, 2)}</baseImponible>
            <valor>${formatNumber(iva, 2)}</valor>
          </impuesto>
        </impuestos>` : '';

      return `<detalle>
      <codigoPrincipal>${escapeXml(item.code || `ITEM-${Date.now()}`)}</codigoPrincipal>
      <descripcion>${escapeXml(item.description)}</descripcion>
      <cantidad>${formatNumber(quantity, 2)}</cantidad>
      <precioUnitario>${formatNumber(unitPrice, 2)}</precioUnitario>
      <descuento>${formatNumber(discount, 2)}</descuento>
      <precioTotalSinImpuesto>${formatNumber(base, 2)}</precioTotalSinImpuesto>
      ${impuestosXml}
    </detalle>`;
    })
    .join('');

  const totalImpuestosXml = (Object.values(impuestosTotales) as Array<{
    codigo: string;
    codigoPorcentaje: string;
    tarifa: string;
    baseImponible: number;
    valor: number;
  }>)
    .map((tax) => {
      if (tax.baseImponible <= 0 && tax.valor <= 0) {
        return '';
      }
      return `<totalImpuesto>
        <codigo>${tax.codigo}</codigo>
        <codigoPorcentaje>${tax.codigoPorcentaje}</codigoPorcentaje>
        <baseImponible>${formatNumber(tax.baseImponible, 2)}</baseImponible>
        <tarifa>${tax.tarifa}</tarifa>
        <valor>${formatNumber(tax.valor, 2)}</valor>
      </totalImpuesto>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="1.1.0" xmlns="urn:factura">
  <infoTributaria>
    <ambiente>${environmentCode}</ambiente>
    <tipoEmision>${tipoEmision}</tipoEmision>
    <razonSocial>${escapeXml(company.name)}</razonSocial>
    <nombreComercial>${escapeXml(company.tradeName || company.name)}</nombreComercial>
    <ruc>${escapeXml(company.ruc)}</ruc>
    <claveAcceso>${accessKey}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>${establishment}</estab>
    <ptoEmi>${pointOfSale}</ptoEmi>
    <secuencial>${sequential}</secuencial>
    <dirMatriz>${escapeXml(company.address)}</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${formattedDate}</fechaEmision>
    <dirEstablecimiento>${escapeXml(company.address)}</dirEstablecimiento>
    <obligadoContabilidad>${company.accountingObligation || 'NO'}</obligadoContabilidad>
    <tipoIdentificacionComprador>${getIdentificationType(client)}</tipoIdentificacionComprador>
    <razonSocialComprador>${escapeXml(client.name)}</razonSocialComprador>
    <identificacionComprador>${escapeXml(client.identification || '9999999999999')}</identificacionComprador>
    <totalSinImpuestos>${formatNumber(totalSinImpuestos, 2)}</totalSinImpuestos>
    <totalDescuento>${formatNumber(discounts, 2)}</totalDescuento>
    <totalConImpuestos>
      ${totalImpuestosXml}
    </totalConImpuestos>
    <propina>${formatNumber(invoice.propina || 0, 2)}</propina>
    <importeTotal>${formatNumber(importeTotal, 2)}</importeTotal>
    <moneda>${invoice.moneda || 'DOLAR'}</moneda>
  </infoFactura>
  <detalles>
    ${detallesXml}
  </detalles>
</factura>`;

  return xml;
};

