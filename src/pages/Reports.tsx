import { useMemo } from 'react';
import { StorageService } from '../utils/storage';
import { BarChart3, FileText, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function Reports() {
  const invoices = StorageService.getInvoices();
  const purchases = StorageService.getPurchases();
  const entries = StorageService.getEntries();
  const accounts = StorageService.getAccounts();

  // Balance General
  const balanceSheet = useMemo(() => {
    const assets = entries.reduce((sum: number, entry: any) => {
      return sum + entry.entries.reduce((s: number, line: any) => {
        const acc = accounts.find((a: any) => a.id === line.accountId) as any;
        return s + (acc?.type === 'asset' ? line.debit - line.credit : 0);
      }, 0);
    }, 0);

    const liabilities = entries.reduce((sum: number, entry: any) => {
      return sum + entry.entries.reduce((s: number, line: any) => {
        const acc = accounts.find((a: any) => a.id === line.accountId) as any;
        return s + (acc?.type === 'liability' ? line.credit - line.debit : 0);
      }, 0);
    }, 0);

    const equity = entries.reduce((sum: number, entry: any) => {
      return sum + entry.entries.reduce((s: number, line: any) => {
        const acc = accounts.find((a: any) => a.id === line.accountId) as any;
        return s + (acc?.type === 'equity' ? line.credit - line.debit : 0);
      }, 0);
    }, 0);

    return { assets, liabilities, equity, total: assets };
  }, [entries, accounts]);

  // Estado de Resultados
  const incomeStatement = useMemo(() => {
    const income = invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
    const expenses = purchases.reduce((sum: number, pur: any) => sum + (pur.total || 0), 0);
    const netIncome = income - expenses;

    return { income, expenses, netIncome };
  }, [invoices, purchases]);

  const handleDownloadReport = (type: string) => {
    toast.success(`Generando reporte ${type}...`);
    // Aquí se implementaría la generación real del PDF
  };

  return (
    <div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-6">
        Reportes y Análisis
      </h1>

      {/* Resumen Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Ingresos Totales</p>
              <p className="text-3xl font-black mt-2">${incomeStatement.income.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Gastos Totales</p>
              <p className="text-3xl font-black mt-2">${incomeStatement.expenses.toFixed(2)}</p>
            </div>
            <TrendingDown className="w-12 h-12 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Utilidad Neta</p>
              <p className={`text-3xl font-black mt-2 ${incomeStatement.netIncome >= 0 ? '' : 'text-red-200'}`}>
                ${incomeStatement.netIncome.toFixed(2)}
              </p>
            </div>
            <BarChart3 className="w-12 h-12 opacity-80" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Activos</p>
              <p className="text-3xl font-black mt-2">${balanceSheet.assets.toFixed(2)}</p>
            </div>
            <FileText className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Reportes Disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-gray-200 hover:shadow-2xl transition-all transform hover:scale-105">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Balance General</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Estado de situación financiera al cierre del período contable.
          </p>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Activos:</span>
              <span className="font-semibold text-blue-600">${balanceSheet.assets.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Pasivos:</span>
              <span className="font-semibold text-red-600">${balanceSheet.liabilities.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Patrimonio:</span>
              <span className="font-semibold text-green-600">${balanceSheet.equity.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => handleDownloadReport('balance')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Generar PDF
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-gray-200 hover:shadow-2xl transition-all transform hover:scale-105">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Estado de Resultados</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Estado de pérdidas y ganancias del período.
          </p>
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Ingresos:</span>
              <span className="font-semibold text-green-600">${incomeStatement.income.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Gastos:</span>
              <span className="font-semibold text-red-600">${incomeStatement.expenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-gray-300 pt-2">
              <span className="font-bold text-gray-900">Utilidad Neta:</span>
              <span className={`font-bold ${incomeStatement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${incomeStatement.netIncome.toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={() => handleDownloadReport('income')}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-lg hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Generar PDF
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-gray-200 hover:shadow-2xl transition-all transform hover:scale-105">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">ATS</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Anexo Transaccional Simplificado para el SRI.
          </p>
          <div className="space-y-2 mb-4 text-sm text-gray-700">
            <p>• Facturas emitidas: {invoices.length}</p>
            <p>• Compras registradas: {purchases.length}</p>
            <p>• Período: {format(new Date(), 'MM/yyyy')}</p>
          </div>
          <button
            onClick={() => handleDownloadReport('ats')}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Generar ATS
          </button>
        </div>
      </div>
    </div>
  );
}
