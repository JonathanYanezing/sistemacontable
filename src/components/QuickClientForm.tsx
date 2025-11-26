import { useState } from 'react';
import { StorageService } from '../utils/storage';
import { validateCedula, validateRUC } from '../utils/ecuadorianRules';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

interface QuickClientFormProps {
  onClose: () => void;
  onClientCreated: (clientId: string) => void;
}

export default function QuickClientForm({ onClose, onClientCreated }: QuickClientFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    identification: '',
    type: 'person' as 'person' | 'company',
    email: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isValid = formData.type === 'person' 
      ? validateCedula(formData.identification)
      : validateRUC(formData.identification);
    
    if (!isValid) {
      toast.error('Cédula/RUC inválido');
      return;
    }

    const clients = StorageService.getClients();
    const existingClient = clients.find((c: any) => c.identification === formData.identification) as any;
    
    if (existingClient) {
      toast.info('Cliente ya existe');
      onClientCreated(existingClient.id);
      onClose();
      return;
    }

    const newClient = {
      id: Date.now().toString(),
      ...formData,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    StorageService.setClients([...clients, newClient]);
    toast.success('Cliente creado exitosamente');
    onClientCreated(newClient.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Crear Cliente Rápido</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'person' | 'company' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="person">Persona Natural</option>
                <option value="company">Empresa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'company' ? 'Razón Social' : 'Nombre Completo'} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder={formData.type === 'company' ? 'Razón Social' : 'Nombre Completo'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'company' ? 'RUC' : 'Cédula'} *
              </label>
              <input
                type="text"
                value={formData.identification}
                onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                required
                maxLength={13}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder={formData.type === 'company' ? '1234567890001' : '1234567890'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Crear y Usar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

