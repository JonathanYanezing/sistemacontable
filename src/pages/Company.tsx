import { useState, useEffect } from 'react';
import { StorageService } from '../utils/storage';
import { toast } from 'react-toastify';
import { Building2, Save, Upload, X } from 'lucide-react';

export default function Company() {
  const [company, setCompany] = useState<any>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ruc: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    establishment: '001',
    pointOfSale: '001',
    accountingPeriod: new Date().getFullYear().toString(),
    environment: 'testing',
  });

  useEffect(() => {
    const savedCompany = StorageService.getCompany() as any;
    if (savedCompany) {
      setCompany(savedCompany);
      setFormData(savedCompany);
      if ((savedCompany as any).logo) {
        setLogoPreview((savedCompany as any).logo);
      }
    }
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('El logo debe ser menor a 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const companyData = {
      ...formData,
      id: company?.id || '1',
      logo: logoPreview,
      updatedAt: new Date().toISOString(),
    };
    StorageService.setCompany(companyData);
    setCompany(companyData);
    toast.success('Información de empresa guardada');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-bold text-gray-900">Configuración de Empresa</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Section */}
          <div className="border-b border-gray-200 pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Logo de la Empresa</label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-32 h-32 object-contain border-2 border-gray-300 rounded-lg p-2 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Upload className="w-4 h-4 mr-2" />
                  {logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Máximo 2MB. Formatos: JPG, PNG, GIF</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razón Social *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">RUC *</label>
              <input
                type="text"
                name="ruc"
                value={formData.ruc}
                onChange={handleChange}
                required
                maxLength={13}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sitio Web</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Establecimiento
              </label>
              <input
                type="text"
                name="establishment"
                value={formData.establishment}
                onChange={handleChange}
                required
                maxLength={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Punto de Venta</label>
              <input
                type="text"
                name="pointOfSale"
                value={formData.pointOfSale}
                onChange={handleChange}
                required
                maxLength={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período Contable
              </label>
              <input
                type="text"
                name="accountingPeriod"
                value={formData.accountingPeriod}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ambiente</label>
              <select
                name="environment"
                value={formData.environment}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="testing">Pruebas</option>
                <option value="production">Producción</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 shadow-lg transition-all"
            >
              <Save className="w-5 h-5" />
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
