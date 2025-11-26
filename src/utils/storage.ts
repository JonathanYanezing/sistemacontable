// Sistema de almacenamiento local para todos los datos
// Simula una base de datos en localStorage

const STORAGE_KEYS = {
  COMPANY: 'scontable_company',
  ADMIN_USERS: 'scontable_admin_users',
  INTERNAL_USERS: 'scontable_internal_users',
  CLIENTS: 'scontable_clients',
  SUPPLIERS: 'scontable_suppliers',
  PRODUCTS: 'scontable_products',
  INVOICES: 'scontable_invoices',
  PURCHASES: 'scontable_purchases',
  WORK_ORDERS: 'scontable_work_orders',
  EMPLOYEES: 'scontable_employees',
  PAYROLL: 'scontable_payroll',
  ACCOUNTS: 'scontable_accounts',
  ENTRIES: 'scontable_entries',
  INVENTORY_MOVEMENTS: 'scontable_inventory_movements',
} as const;

export class StorageService {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }

  // Métodos específicos para cada entidad
  static getCompany() {
    return this.get(STORAGE_KEYS.COMPANY, null);
  }

  static setCompany(company: any) {
    this.set(STORAGE_KEYS.COMPANY, company);
  }

  static getAdminUsers() {
    return this.get(STORAGE_KEYS.ADMIN_USERS, []);
  }

  static setAdminUsers(users: any[]) {
    this.set(STORAGE_KEYS.ADMIN_USERS, users);
  }

  static getInternalUsers() {
    return this.get(STORAGE_KEYS.INTERNAL_USERS, []);
  }

  static setInternalUsers(users: any[]) {
    this.set(STORAGE_KEYS.INTERNAL_USERS, users);
  }

  // Compatibilidad con métodos antiguos
  static getUsers() {
    return this.getInternalUsers();
  }

  static setUsers(users: any[]) {
    this.setInternalUsers(users);
  }

  static getClients() {
    return this.get(STORAGE_KEYS.CLIENTS, []);
  }

  static setClients(clients: any[]) {
    this.set(STORAGE_KEYS.CLIENTS, clients);
  }

  static getSuppliers() {
    return this.get(STORAGE_KEYS.SUPPLIERS, []);
  }

  static setSuppliers(suppliers: any[]) {
    this.set(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  static getProducts() {
    return this.get(STORAGE_KEYS.PRODUCTS, []);
  }

  static setProducts(products: any[]) {
    this.set(STORAGE_KEYS.PRODUCTS, products);
  }

  static getInvoices() {
    return this.get(STORAGE_KEYS.INVOICES, []);
  }

  static setInvoices(invoices: any[]) {
    this.set(STORAGE_KEYS.INVOICES, invoices);
  }

  static getPurchases() {
    return this.get(STORAGE_KEYS.PURCHASES, []);
  }

  static setPurchases(purchases: any[]) {
    this.set(STORAGE_KEYS.PURCHASES, purchases);
  }

  static getWorkOrders() {
    return this.get(STORAGE_KEYS.WORK_ORDERS, []);
  }

  static setWorkOrders(orders: any[]) {
    this.set(STORAGE_KEYS.WORK_ORDERS, orders);
  }

  static getEmployees() {
    return this.get(STORAGE_KEYS.EMPLOYEES, []);
  }

  static setEmployees(employees: any[]) {
    this.set(STORAGE_KEYS.EMPLOYEES, employees);
  }

  static getPayroll() {
    return this.get(STORAGE_KEYS.PAYROLL, []);
  }

  static setPayroll(payroll: any[]) {
    this.set(STORAGE_KEYS.PAYROLL, payroll);
  }

  static getAccounts() {
    return this.get(STORAGE_KEYS.ACCOUNTS, []);
  }

  static setAccounts(accounts: any[]) {
    this.set(STORAGE_KEYS.ACCOUNTS, accounts);
  }

  static getEntries() {
    return this.get(STORAGE_KEYS.ENTRIES, []);
  }

  static setEntries(entries: any[]) {
    this.set(STORAGE_KEYS.ENTRIES, entries);
  }

  static getInventoryMovements() {
    return this.get(STORAGE_KEYS.INVENTORY_MOVEMENTS, []);
  }

  static setInventoryMovements(movements: any[]) {
    this.set(STORAGE_KEYS.INVENTORY_MOVEMENTS, movements);
  }
}












