// Servicio para integración con SRI (modo pruebas)

export interface SriAuthorizationResponse {
  authorized: boolean;
  authorizationNumber?: string;
  authorizationDate?: string;
  accessKey?: string;
  message?: string;
}

export class SriService {
  // Generar clave de acceso SRI según formato oficial
  // Formato: Fecha(8) + Tipo(2) + RUC(13) + Ambiente(1) + Establecimiento(3) + PuntoVenta(3) + Secuencial(9) + Random(8) + Emisión(1) + Verificador(1) = 49 dígitos
  static generateAccessKey(
    date: string,
    type: string,
    ruc: string,
    environment: string,
    establishment: string,
    pointOfSale: string,
    sequential: string
  ): string {
    // Formatear fecha YYYYMMDD
    const formattedDate = date.replace(/-/g, '');
    
    // Tipo de comprobante: 01=Factura, 04=Nota de Crédito, 05=Nota de Débito
    const docType = type || '01';
    
    // RUC sin guiones
    const cleanRuc = ruc.replace(/[^0-9]/g, '').padStart(13, '0');
    
    // Ambiente: 1=Producción, 2=Pruebas
    const env = environment === 'production' ? '1' : '2';
    
    // Establecimiento (3 dígitos)
    const estab = establishment.padStart(3, '0').substring(0, 3);
    
    // Punto de venta (3 dígitos)
    const pos = pointOfSale.padStart(3, '0').substring(0, 3);
    
    // Secuencial (9 dígitos)
    const seq = sequential.padStart(9, '0').substring(0, 9);
    
    // Número aleatorio (8 dígitos)
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    
    // Tipo de emisión: 1=Normal
    const emission = '1';
    
    // Construir clave sin verificador (48 dígitos)
    const keyWithoutCheck = `${formattedDate}${docType}${cleanRuc}${env}${estab}${pos}${seq}${random}${emission}`;
    
    // Calcular dígito verificador usando módulo 11
    const digits = keyWithoutCheck.split('').map(Number);
    const multipliers = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
    let sum = 0;
    
    for (let i = 0; i < 48; i++) {
      let product = digits[i] * multipliers[i];
      if (product >= 10) {
        product = Math.floor(product / 10) + (product % 10);
      }
      sum += product;
    }
    
    const remainder = sum % 11;
    const checkDigit = remainder < 2 ? remainder : 11 - remainder;
    
    return keyWithoutCheck + checkDigit;
  }

  // Simular autorización del SRI (modo pruebas)
  static async authorizeInvoice(invoice: any, company: any): Promise<SriAuthorizationResponse> {
    // En modo pruebas, simulamos una respuesta del SRI
    // En producción, esto haría una llamada real al servicio del SRI
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simular que el 90% de las facturas se autorizan
        const isAuthorized = Math.random() > 0.1;
        
        if (isAuthorized) {
          // Generar número de autorización (12 dígitos)
          const authorizationNumber = Math.floor(Math.random() * 1000000000000)
            .toString()
            .padStart(12, '0');
          const authorizationDate = new Date().toISOString();
          
          // Generar clave de acceso si no existe
          if (!invoice.accessKey) {
            const date = invoice.issueDate;
            const sequential = invoice.number.split('-')[2] || String(invoice.id).slice(-9);
            invoice.accessKey = this.generateAccessKey(
              date,
              '01', // Factura
              company.ruc || '1234567890001',
              company.environment || 'testing',
              company.establishment || '001',
              company.pointOfSale || '001',
              sequential
            );
          }
          
          resolve({
            authorized: true,
            authorizationNumber,
            authorizationDate,
            accessKey: invoice.accessKey,
            message: 'Factura autorizada correctamente',
          });
        } else {
          resolve({
            authorized: false,
            message: 'Error en la autorización. Verifique los datos de la factura.',
          });
        }
      }, 1500); // Simular delay de red
    });
  }

  // Validar factura antes de enviar al SRI
  static validateInvoice(invoice: any, company: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!company) {
      errors.push('No se ha configurado la información de la empresa');
    }

    if (!company?.ruc) {
      errors.push('El RUC de la empresa es requerido');
    }

    if (!invoice.client) {
      errors.push('La factura debe tener un cliente asignado');
    }

    if (!invoice.items || invoice.items.length === 0) {
      errors.push('La factura debe tener al menos un item');
    }

    if (!invoice.issueDate) {
      errors.push('La fecha de emisión es requerida');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
