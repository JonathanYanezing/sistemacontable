import { useState } from 'react';
import { StorageService } from '../utils/storage';
import { Plus, Calculator, FileText, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function Accounting() {
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    code: '',
    name: '',
    type: 'asset',
    parentId: null,
  });
  const [entryFormData, setEntryFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    entries: [
      { accountId: '', debit: 0, credit: 0 },
      { accountId: '', debit: 0, credit: 0 },
    ],
  });

  const accounts = StorageService.getAccounts();
  const entries = StorageService.getEntries();

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const newAccount = {
      id: Date.now().toString(),
      ...accountFormData,
      createdAt: new Date().toISOString(),
    };
    StorageService.setAccounts([...accounts, newAccount]);
    toast.success('Cuenta creada exitosamente');
    setShowAccountForm(false);
    setAccountFormData({ code: '', name: '', type: 'asset', parentId: null });
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const totalDebit = entryFormData.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entryFormData.entries.reduce((sum, e) => sum + e.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast.error('Los débitos y créditos deben ser iguales');
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      entryNumber: `AS-${String(entries.length + 1).padStart(6, '0')}`,
      date: entryFormData.date,
      description: entryFormData.description,
      entries: entryFormData.entries,
      totalDebit: totalDebit,
      totalCredit: totalCredit,
      createdAt: new Date().toISOString(),
    };

    StorageService.setEntries([...entries, newEntry]);
    toast.success('Asiento contable creado exitosamente');
    setShowEntryForm(false);
    setEntryFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      entries: [
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 },
      ],
    });
  };

  const addEntryLine = () => {
    setEntryFormData({
      ...entryFormData,
      entries: [...entryFormData.entries, { accountId: '', debit: 0, credit: 0 }],
    });
  };

  const removeEntryLine = (index: number) => {
    if (entryFormData.entries.length > 2) {
      setEntryFormData({
        ...entryFormData,
        entries: entryFormData.entries.filter((_, i) => i !== index),
      });
    }
  };

  const updateEntryLine = (index: number, field: string, value: any) => {
    const newEntries = [...entryFormData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntryFormData({ ...entryFormData, entries: newEntries });
  };

  // Calcular balance
  const calculateBalance = () => {
    const balance: any = {
      assets: 0,
      liabilities: 0,
      equity: 0,
      income: 0,
      expenses: 0,
    };

    entries.forEach((entry: any) => {
      entry.entries.forEach((line: any) => {
        const account = accounts.find((a: any) => a.id === line.accountId) as any;
        if (account) {
          if (account.type === 'asset') balance.assets += line.debit - line.credit;
          else if (account.type === 'liability') balance.liabilities += line.credit - line.debit;
          else if (account.type === 'equity') balance.equity += line.credit - line.debit;
          else if (account.type === 'income') balance.income += line.credit - line.debit;
          else if (account.type === 'expense') balance.expenses += line.debit - line.credit;
        }
      });
    });

    return balance;
  };

  const balance = calculateBalance();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-green-600 bg-clip-text text-transparent">
          Contabilidad
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAccountForm(!showAccountForm)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Nueva Cuenta
          </button>
          <button
            onClick={() => setShowEntryForm(!showEntryForm)}
            className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2 rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Nuevo Asiento
          </button>
        </div>
      </div>

      {/* Balance General */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
          <p className="text-sm opacity-90">Activos</p>
          <p className="text-2xl font-bold">${balance.assets.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 shadow-lg">
          <p className="text-sm opacity-90">Pasivos</p>
          <p className="text-2xl font-bold">${balance.liabilities.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
          <p className="text-sm opacity-90">Patrimonio</p>
          <p className="text-2xl font-bold">${balance.equity.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 shadow-lg">
          <p className="text-sm opacity-90">Ingresos</p>
          <p className="text-2xl font-bold">${balance.income.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
          <p className="text-sm opacity-90">Gastos</p>
          <p className="text-2xl font-bold">${balance.expenses.toFixed(2)}</p>
        </div>
      </div>

      {showAccountForm && (
        <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-2xl p-6 mb-6 border-2 border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Nueva Cuenta Contable</h2>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Código *</label>
                <input
                  type="text"
                  value={accountFormData.code}
                  onChange={(e) => setAccountFormData({ ...accountFormData, code: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo *</label>
                <select
                  value={accountFormData.type}
                  onChange={(e) => setAccountFormData({ ...accountFormData, type: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                >
                  <option value="asset">Activo</option>
                  <option value="liability">Pasivo</option>
                  <option value="equity">Patrimonio</option>
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
              <input
                type="text"
                value={accountFormData.name}
                onChange={(e) => setAccountFormData({ ...accountFormData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAccountForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 shadow-lg"
              >
                Crear Cuenta
              </button>
            </div>
          </form>
        </div>
      )}

      {showEntryForm && (
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-2xl p-6 mb-6 border-2 border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Nuevo Asiento Contable</h2>
          <form onSubmit={handleCreateEntry} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha *</label>
                <input
                  type="date"
                  value={entryFormData.date}
                  onChange={(e) => setEntryFormData({ ...entryFormData, date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción *</label>
                <input
                  type="text"
                  value={entryFormData.description}
                  onChange={(e) => setEntryFormData({ ...entryFormData, description: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Líneas del Asiento</label>
                <button
                  type="button"
                  onClick={addEntryLine}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  + Agregar Línea
                </button>
              </div>
              <div className="space-y-2">
                {entryFormData.entries.map((line, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 bg-gray-50 p-3 rounded-lg">
                    <div className="col-span-5">
                      <select
                        value={line.accountId}
                        onChange={(e) => updateEntryLine(index, 'accountId', e.target.value)}
                        required
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar cuenta</option>
                        {accounts.map((acc: any) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Débito"
                        value={line.debit}
                        onChange={(e) => updateEntryLine(index, 'debit', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Crédito"
                        value={line.credit}
                        onChange={(e) => updateEntryLine(index, 'credit', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="col-span-1">
                      {entryFormData.entries.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEntryLine(index)}
                          className="w-full px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        >
                          <X className="w-4 h-4 mx-auto" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex justify-between font-bold">
                  <span>Total Débito: ${entryFormData.entries.reduce((sum, e) => sum + e.debit, 0).toFixed(2)}</span>
                  <span>Total Crédito: ${entryFormData.entries.reduce((sum, e) => sum + e.credit, 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowEntryForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-lg"
              >
                Crear Asiento
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan de Cuentas */}
        <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200">
          <div className="p-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary-600" />
              Plan de Cuentas ({accounts.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tipo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                      No hay cuentas. Crea una nueva.
                    </td>
                  </tr>
                ) : (
                  accounts.map((account: any) => (
                    <tr key={account.id} className="hover:bg-green-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{account.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{account.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold">
                          {account.type}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asientos Contables */}
        <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200">
          <div className="p-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-600" />
              Asientos Contables ({entries.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Número</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase">Descripción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                      No hay asientos. Crea uno nuevo.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.entryNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {format(new Date(entry.date), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
