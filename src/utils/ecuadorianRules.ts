// Normas y cálculos ecuatorianos

export const validateRUC = (ruc: string): boolean => {
  if (!ruc || ruc.length !== 13) return false;
  const digits = ruc.split('').map(Number);
  const multipliers = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    let product = digits[i] * multipliers[i];
    if (product >= 10) product -= 9;
    sum += product;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[9];
};

export const validateCedula = (cedula: string): boolean => {
  if (!cedula || (cedula.length !== 10 && cedula.length !== 13)) return false;
  if (cedula.length === 13) return validateRUC(cedula);
  
  const digits = cedula.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    let digit = digits[i];
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[9];
};

export const calculateIVA = (subtotal: number, rate: number = 12): number => {
  return subtotal * (rate / 100);
};

export const calculateIESS = (salary: number, isEmployee: boolean = true): number => {
  // Empleado: 9.45%, Empleador: 11.15%
  const rate = isEmployee ? 0.0945 : 0.1115;
  return salary * rate;
};

export const calculateIncomeTax = (taxableIncome: number): number => {
  // Tabla progresiva 2024 Ecuador
  if (taxableIncome <= 11212) return 0;
  if (taxableIncome <= 14285) return (taxableIncome - 11212) * 0.05;
  if (taxableIncome <= 17854) return 153.65 + (taxableIncome - 14285) * 0.10;
  if (taxableIncome <= 21442) return 510.65 + (taxableIncome - 17854) * 0.12;
  if (taxableIncome <= 42874) return 941.21 + (taxableIncome - 21442) * 0.15;
  if (taxableIncome <= 64297) return 4156.01 + (taxableIncome - 42874) * 0.20;
  if (taxableIncome <= 85729) return 8438.21 + (taxableIncome - 64297) * 0.25;
  if (taxableIncome <= 114288) return 13779.21 + (taxableIncome - 85729) * 0.30;
  return 22366.11 + (taxableIncome - 114288) * 0.35;
};

export const calculate13thSalary = (salary: number, monthsWorked: number): number => {
  return (salary / 12) * monthsWorked;
};

export const calculate14thSalary = (salary: number, monthsWorked: number): number => {
  return (salary / 12) * monthsWorked;
};

export const generateInvoiceNumber = (
  establishment: string,
  pointOfSale: string,
  sequential: number
): string => {
  return `${establishment}-${pointOfSale}-${String(sequential).padStart(9, '0')}`;
};

export const generateAccessKey = (
  date: string,
  type: string,
  ruc: string,
  environment: string,
  establishment: string,
  pointOfSale: string,
  sequential: string,
  numericCode: string,
  emission: string
): string => {
  const base = `${date}${type}${ruc}${environment}${establishment}${pointOfSale}${sequential}${numericCode}${emission}`;
  const coefficients = [2, 3, 4, 5, 6, 7];
  let sum = 0;
  let coefficientIndex = 0;

  for (let i = base.length - 1; i >= 0; i--) {
    const digit = parseInt(base[i], 10);
    sum += digit * coefficients[coefficientIndex];
    coefficientIndex = (coefficientIndex + 1) % coefficients.length;
  }

  const modulo = sum % 11;
  let verifier = 11 - modulo;
  if (verifier === 11) verifier = 0;
  if (verifier === 10) verifier = 1;

  return `${base}${verifier}`;
};












