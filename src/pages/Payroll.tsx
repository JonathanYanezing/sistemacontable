import { useState } from 'react';
import { StorageService } from '../utils/storage';
import { Plus, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { calculateIESS, calculateIncomeTax, calculate13thSalary, calculate14thSalary } from '../utils/ecuadorianRules';

export default function Payroll() {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    period: format(new Date(), 'yyyy-MM'),
    baseSalary: 0,
    monthsWorked: 12,
  });

  const employees = StorageService.getEmployees();
  const payroll = StorageService.getPayroll();


  const calculatePayroll = (_employee: any, baseSalary: number, monthsWorked: number) => {
    const iessEmployee = calculateIESS(baseSalary, true);
    const iessEmployer = calculateIESS(baseSalary, false);
    const taxableIncome = baseSalary - iessEmployee;
    const incomeTax = calculateIncomeTax(taxableIncome);
    const netSalary = baseSalary - iessEmployee - incomeTax;
    const thirteenth = calculate13thSalary(baseSalary, monthsWorked);
    const fourteenth = calculate14thSalary(baseSalary, monthsWorked);
    const totalCost = baseSalary + iessEmployer + thirteenth + fourteenth;

    return {
      baseSalary,
      iessEmployee,
      iessEmployer,
      incomeTax,
      netSalary,
      thirteenth,
      fourteenth,
      totalCost,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e: any) => e.id === formData.employeeId);
    if (!emp) {
      toast.error('Seleccione un empleado');
      return;
    }

    const calculations = calculatePayroll(emp, formData.baseSalary, formData.monthsWorked);
    
    const newPayroll = {
      id: Date.now().toString(),
      employeeId: formData.employeeId,
      employee: emp,
      period: formData.period,
      ...calculations,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    StorageService.setPayroll([...payroll, newPayroll]);
    toast.success('Planilla calculada exitosamente');
    setShowForm(false);
    setFormData({
      employeeId: '',
      period: format(new Date(), 'yyyy-MM'),
      baseSalary: 0,
      monthsWorked: 12,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
          Planilla de Nómina
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Calcular Planilla
        </button>
      </div>

      {showForm && (
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-2xl p-6 mb-6 border-2 border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Calcular Planilla</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Empleado *</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => {
                    setFormData({ ...formData, employeeId: e.target.value });
                    const emp = employees.find((emp: any) => emp.id === e.target.value);
                    if (emp) setSelectedEmployee(emp);
                  }}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Seleccionar empleado</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.identification}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Período *</label>
                <input
                  type="month"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sueldo Base *</label>
                <input
                  type="number"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Meses Trabajados</label>
                <input
                  type="number"
                  value={formData.monthsWorked}
                  onChange={(e) => setFormData({ ...formData, monthsWorked: parseFloat(e.target.value) || 12 })}
                  min="1"
                  max="12"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {selectedEmployee && formData.baseSalary > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-3">Vista Previa de Cálculos</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(() => {
                    const calc = calculatePayroll(selectedEmployee as any, formData.baseSalary, formData.monthsWorked);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Sueldo Base:</span>
                          <span className="font-semibold">${calc.baseSalary.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">IESS Empleado (9.45%):</span>
                          <span className="font-semibold text-red-600">-${calc.iessEmployee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">IESS Empleador (11.15%):</span>
                          <span className="font-semibold text-blue-600">${calc.iessEmployer.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Impuesto a la Renta:</span>
                          <span className="font-semibold text-red-600">-${calc.incomeTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t-2 border-gray-300 pt-2">
                          <span className="font-bold text-gray-900">Sueldo Neto:</span>
                          <span className="font-bold text-green-600">${calc.netSalary.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">13ro Sueldo:</span>
                          <span className="font-semibold">${calc.thirteenth.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">14to Sueldo:</span>
                          <span className="font-semibold">${calc.fourteenth.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t-2 border-primary-600 pt-2 bg-primary-50 p-2 rounded">
                          <span className="font-bold text-primary-900">Costo Total Empleador:</span>
                          <span className="font-bold text-primary-900">${calc.totalCost.toFixed(2)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 shadow-lg"
              >
                Guardar Planilla
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200">
        <div className="p-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar planillas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Empleado</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Período</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase">Sueldo Base</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase">Sueldo Neto</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase">Costo Total</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payroll.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No hay planillas calculadas.
                  </td>
                </tr>
              ) : (
                payroll.map((p: any) => (
                  <tr key={p.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {p.employee?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                      ${p.baseSalary?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                      ${p.netSalary?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-primary-600">
                      ${p.totalCost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 font-bold">
                        Completada
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
