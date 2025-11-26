import { useMemo } from 'react';
import { StorageService } from '../utils/storage';
import {
  DollarSign,
  ShoppingCart,
  Package,
  FileText,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const invoices = StorageService.getInvoices();
  const purchases = StorageService.getPurchases();
  const products = StorageService.getProducts();
  const clients = StorageService.getClients();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlySales = invoices
      .filter((inv: any) => {
        const date = new Date(inv.issueDate);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);

    const monthlyPurchases = purchases
      .filter((pur: any) => {
        const date = new Date(pur.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum: number, pur: any) => sum + (pur.total || 0), 0);

    const lowStockProducts = products.filter(
      (p: any) => p.stock <= p.minStock && p.trackInventory
    );

    const pendingInvoices = invoices.filter((inv: any) => inv.status === 'pending');

    return {
      monthlySales,
      monthlyPurchases,
      lowStockCount: lowStockProducts.length,
      pendingInvoices: pendingInvoices.length,
      totalProducts: products.length,
      totalClients: clients.length,
    };
  }, [invoices, purchases, products, clients]);

  const cardStats = [
    {
      label: 'Ventas del mes',
      value: stats.monthlySales,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      link: '/invoices',
      suffix: 'USD',
    },
    {
      label: 'Compras del mes',
      value: stats.monthlyPurchases,
      icon: ShoppingCart,
      color: 'from-sky-500 to-sky-600',
      link: '/purchases',
      suffix: 'USD',
    },
    {
      label: 'Productos con stock bajo',
      value: stats.lowStockCount,
      icon: Package,
      color: 'from-amber-500 to-amber-600',
      link: '/inventory',
    },
    {
      label: 'Facturas pendientes',
      value: stats.pendingInvoices,
      icon: FileText,
      color: 'from-rose-500 to-rose-600',
      link: '/invoices',
    },
  ];

  const monthFormatter = new Intl.DateTimeFormat('es-EC', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-blue-600 to-primary-700 p-6 shadow-xl">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_#ffffff33,_transparent_60%)]" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-100">
              Sistema Contable IngetSoport
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-black text-white tracking-tight">
              Panel de control financiero
            </h1>
            <p className="mt-2 text-sm text-primary-50 max-w-xl">
              Resumen rápido de ventas, compras, clientes y productos del periodo actual.
              Todo lo necesario para tomar decisiones en segundos.
            </p>
            <p className="mt-3 text-xs font-semibold text-primary-100">
              Periodo:&nbsp;
              {monthFormatter.format(new Date())}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <p className="text-xs text-primary-100">Ganancia bruta del mes</p>
            <p className="text-3xl font-black text-white">
              $
              {(stats.monthlySales - stats.monthlyPurchases).toLocaleString('es-EC', {
                minimumFractionDigits: 2,
              })}
            </p>
            <p className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-primary-50 border border-white/20">
              <TrendingUp className="w-3 h-3" />
              {stats.monthlySales > 0
                ? (
                    ((stats.monthlySales - stats.monthlyPurchases) / stats.monthlySales) *
                    100
                  ).toFixed(1)
                : '0.0'}
              % margen
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur shadow-sm border border-gray-100 hover:shadow-xl transition-all"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${stat.color}`}
              />
              <div className="relative p-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-gray-900">
                    {typeof stat.value === 'number'
                      ? stat.suffix === 'USD'
                        ? `$${stat.value.toLocaleString('es-EC', {
                            minimumFractionDigits: 2,
                          })}`
                        : stat.value.toLocaleString('es-EC')
                      : stat.value}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 group-hover:text-gray-700">
                    Ver detalle
                  </p>
                </div>
                <div
                  className={`shrink-0 rounded-2xl bg-gradient-to-br ${stat.color} p-3 shadow-lg group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-primary-600" />
            Resumen financiero del mes
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Ventas totales</span>
              <span className="font-semibold text-emerald-600">
                $
                {stats.monthlySales.toLocaleString('es-EC', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Compras totales</span>
              <span className="font-semibold text-sky-600">
                $
                {stats.monthlyPurchases.toLocaleString('es-EC', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-3 mt-2">
              <span className="text-gray-900 font-semibold">Ganancia bruta</span>
              <span className="font-bold text-primary-600">
                $
                {(stats.monthlySales - stats.monthlyPurchases).toLocaleString('es-EC', {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-600" />
            Accesos rápidos
          </h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Link
              to="/invoices"
              className="flex items-center justify-between rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-primary-700 hover:bg-primary-100 transition-colors"
            >
              <span>Nueva factura</span>
              <FileText className="w-4 h-4" />
            </Link>
            <Link
              to="/inventory"
              className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <span>Inventario</span>
              <Package className="w-4 h-4" />
            </Link>
            <Link
              to="/accounting"
              className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sky-800 hover:bg-sky-100 transition-colors"
            >
              <span>Asientos contables</span>
              <TrendingUp className="w-4 h-4" />
            </Link>
            <Link
              to="/reports"
              className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <span>Reportes</span>
              <DollarSign className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Clientes activos
            </p>
            <p className="mt-1 text-3xl font-black text-gray-900">
              {stats.totalClients.toLocaleString('es-EC')}
            </p>
          </div>
          <div className="rounded-2xl bg-primary-50 p-3">
            <Users className="w-7 h-7 text-primary-600" />
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Productos registrados
            </p>
            <p className="mt-1 text-3xl font-black text-gray-900">
              {stats.totalProducts.toLocaleString('es-EC')}
            </p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-3">
            <Package className="w-7 h-7 text-sky-600" />
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Margen del mes
            </p>
            <p className="mt-1 text-3xl font-black text-gray-900">
              {stats.monthlySales > 0
                ? (
                    ((stats.monthlySales - stats.monthlyPurchases) / stats.monthlySales) *
                    100
                  ).toFixed(1)
                : '0.0'}
              %
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3">
            <TrendingUp className="w-7 h-7 text-emerald-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

