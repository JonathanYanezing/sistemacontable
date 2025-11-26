import { useState, useEffect } from 'react';
import { StorageService } from '../utils/storage';
import { useAuthStore } from '../store/authStore';
import { Plus, Search, Edit, Trash2, Shield, X } from 'lucide-react';
import { toast } from 'react-toastify';

const MODULES = [
  { id: 'dashboard', name: 'Dashboard', description: 'Panel principal' },
  { id: 'invoices', name: 'Facturación', description: 'Gestión de facturas' },
  { id: 'inventory', name: 'Inventario', description: 'Gestión de productos' },
  { id: 'clients', name: 'Clientes', description: 'Gestión de clientes' },
  { id: 'suppliers', name: 'Proveedores', description: 'Gestión de proveedores' },
  { id: 'purchases', name: 'Compras', description: 'Registro de compras' },
  { id: 'payroll', name: 'Planilla', description: 'Gestión de planilla' },
  { id: 'work-orders', name: 'Órdenes de Trabajo', description: 'Gestión de órdenes' },
  { id: 'accounting', name: 'Contabilidad', description: 'Asientos contables' },
  { id: 'reports', name: 'Reportes', description: 'Reportes financieros' },
  { id: 'company', name: 'Empresa', description: 'Configuración de empresa' },
];

export default function Users() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [internalUsers, setInternalUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    status: 'active',
    permissions: [] as any[],
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      setLoading(true);
      const users = StorageService.getInternalUsers() || [];
      setInternalUsers(users);
    } catch (error: any) {
      console.error('Error al cargar usuarios internos:', error);
      toast.error('No se pudieron cargar los usuarios internos');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = internalUsers.filter(
    (u: any) =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTogglePermission = (moduleId: string, permission: 'can_view' | 'can_create' | 'can_edit' | 'can_delete') => {
    const newPermissions = [...formData.permissions];
    const existingIndex = newPermissions.findIndex((p: any) => p.module === moduleId);
    
    if (existingIndex >= 0) {
      newPermissions[existingIndex] = {
        ...newPermissions[existingIndex],
        [permission]: !newPermissions[existingIndex][permission],
      };
    } else {
      newPermissions.push({
        module: moduleId,
        can_view: permission === 'can_view',
        can_create: permission === 'can_create',
        can_edit: permission === 'can_edit',
        can_delete: permission === 'can_delete',
      });
    }
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const getPermission = (userPermissions: any[], moduleId: string, permission: string) => {
    const perm = userPermissions.find((p: any) => p.module === moduleId);
    return perm?.[permission] || false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const users = [...internalUsers];
      const timestamp = new Date().toISOString();

      if (editingUser) {
        const updatedUsers = users.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                ...formData,
                updated_at: timestamp,
              }
            : u
        );
        StorageService.setInternalUsers(updatedUsers);
        setInternalUsers(updatedUsers);
        toast.success('Usuario actualizado exitosamente');
      } else {
        const newUser = {
          ...formData,
          id: Date.now().toString(),
          created_at: timestamp,
          updated_at: timestamp,
        };
        const updatedUsers = [...users, newUser];
        StorageService.setInternalUsers(updatedUsers);
        setInternalUsers(updatedUsers);
        toast.success('Usuario creado exitosamente');
      }

      setShowForm(false);
      setEditingUser(null);
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        status: 'active',
        permissions: [],
      });
      loadUsers();
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      toast.error(error.message || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email || '',
      phone: user.phone || '',
      status: user.status,
      permissions: user.permissions || [],
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este usuario interno?')) {
      return;
    }

    try {
      setLoading(true);
      const updatedUsers = internalUsers.filter((user) => String(user.id) !== String(id));
      StorageService.setInternalUsers(updatedUsers);
      setInternalUsers(updatedUsers);
      toast.success('Usuario eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar usuario:', error);
      toast.error('Error al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      status: 'active',
      permissions: [],
    });
  };

  // Verificar si el usuario actual es admin
  if (!user?.is_admin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">Solo los administradores pueden gestionar usuarios internos.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuarios Internos</h1>
          <p className="text-gray-600 mt-1">Gestiona los usuarios internos y sus permisos por módulo</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario Interno
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {editingUser ? 'Editar Usuario Interno' : 'Nuevo Usuario Interno'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                  placeholder="usuario123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Permisos por Módulo */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Permisos por Módulo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                {MODULES.map((module) => (
                  <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{module.name}</h4>
                    <p className="text-xs text-gray-500 mb-3">{module.description}</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={getPermission(formData.permissions, module.id, 'can_view')}
                          onChange={() => handleTogglePermission(module.id, 'can_view')}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>Ver</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={getPermission(formData.permissions, module.id, 'can_create')}
                          onChange={() => handleTogglePermission(module.id, 'can_create')}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>Crear</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={getPermission(formData.permissions, module.id, 'can_edit')}
                          onChange={() => handleTogglePermission(module.id, 'can_edit')}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>Editar</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={getPermission(formData.permissions, module.id, 'can_delete')}
                          onChange={() => handleTogglePermission(module.id, 'can_delete')}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>Eliminar</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar usuarios internos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Módulos con Permisos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No hay usuarios internos. Crea uno nuevo para comenzar.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.permissions && user.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.map((perm: any) => {
                            const module = MODULES.find(m => m.id === perm.module);
                            return module ? (
                              <span
                                key={perm.id}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                              >
                                {module.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin permisos</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-primary-600 hover:text-primary-800 p-1 hover:bg-primary-50 rounded transition-colors"
                          title="Editar usuario"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
