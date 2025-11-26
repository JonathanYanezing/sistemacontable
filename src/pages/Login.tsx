import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success('Bienvenido al sistema');
        navigate('/dashboard');
      } else {
        toast.error('Credenciales incorrectas');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      const errorMessage = error.message || 'Error al iniciar sesión';
      
      if (errorMessage.includes('Invalid login credentials') || 
          errorMessage.includes('Credenciales incorrectas')) {
        toast.error('Email o contraseña incorrectos');
      } else if (errorMessage.includes('Email not confirmed')) {
        toast.error('Por favor, confirma tu email antes de iniciar sesión');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative"
      style={{
        // Para usar una imagen local, coloca la imagen en la carpeta public y usa: 'url(/nombre-imagen.jpg)'
        // O importa la imagen y usa: backgroundImage: `url(${importedImage})`
        backgroundImage: 'url(https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay oscuro para mejor legibilidad */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* Nombre del sistema sobre la imagen de fondo */}
      <div className="absolute top-8 left-8 z-20">
        <h1 className="text-5xl font-black text-white drop-shadow-2xl mb-2 tracking-tight leading-tight">
          <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            Sistema Contable
          </span>
        </h1>
        <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 via-blue-300 to-primary-200 drop-shadow-xl tracking-wide">
          IngetSoport
        </p>
        <div className="mt-3 w-32 h-1 bg-gradient-to-r from-white/80 to-blue-300/80 rounded-full"></div>
      </div>
      
      {/* Contenido del login */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-10 w-full max-w-md border border-white/20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-600 rounded-2xl mb-6 shadow-xl transform hover:scale-105 transition-transform">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-blue-600 to-primary-700 mb-2 tracking-tight">
            Sistema Contable
          </h1>
          <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-primary-600 tracking-wide">
            IngetSoport
          </p>
          <div className="mt-4 w-24 h-1 bg-gradient-to-r from-primary-600 to-blue-600 rounded-full mx-auto"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-gray-800 font-medium placeholder-gray-400"
              placeholder="Ingresa tu email"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 text-gray-800 font-medium placeholder-gray-400"
              placeholder="Ingresa tu contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:from-primary-700 hover:via-primary-800 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}




