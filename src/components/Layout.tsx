import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  FileText,
  Package,
  Calculator,
  Users,
  ShoppingCart,
  CreditCard,
  Briefcase,
  BarChart3,
  Settings,
  LogOut,
  UserCircle,
  Building2,
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/company', icon: Building2, label: 'Empresa' },
    { path: '/invoices', icon: FileText, label: 'Facturación' },
    { path: '/inventory', icon: Package, label: 'Inventario' },
    { path: '/clients', icon: Users, label: 'Clientes' },
    { path: '/suppliers', icon: Users, label: 'Proveedores' },
    { path: '/purchases', icon: ShoppingCart, label: 'Compras' },
    { path: '/payroll', icon: CreditCard, label: 'Planilla' },
    { path: '/work-orders', icon: Briefcase, label: 'Órdenes' },
    { path: '/accounting', icon: Calculator, label: 'Contabilidad' },
    { path: '/reports', icon: BarChart3, label: 'Reportes' },
    ...(user?.is_admin ? [{ path: '/users', icon: Settings, label: 'Usuarios' }] : []),
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-white to-gray-50 shadow-2xl flex flex-col border-r-2 border-gray-200">
        <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-primary-600 to-blue-600">
          <h1 className="text-2xl font-black text-white drop-shadow-lg">Sistema Contable</h1>
          <p className="text-sm text-blue-100 font-semibold">IngetSoport</p>
        </div>

        <nav className="flex-1 mt-6 overflow-y-auto px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 mx-2 mb-1 text-gray-700 rounded-lg transition-all transform hover:scale-105 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg font-bold'
                    : 'hover:bg-gradient-to-r hover:from-gray-100 hover:to-blue-50 hover:shadow-md'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                <span className={isActive ? 'font-bold' : 'font-medium'}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center mb-3 p-3 bg-white rounded-lg shadow-sm">
            <UserCircle className="w-10 h-10 text-primary-600 mr-3 bg-primary-100 rounded-full p-2" />
            <div>
              <p className="text-sm font-bold text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg shadow-md transition-all transform hover:scale-105"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

