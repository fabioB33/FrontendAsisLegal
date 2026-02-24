import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Scale, MessageCircle, FileText, TrendingUp, Users, Shield } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('seller');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/users`, {
        name,
        email,
        role
      });

      localStorage.setItem('user', JSON.stringify(response.data));
      toast.success('¡Bienvenido a Prados de Paraíso!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Navigation */}
      <nav className="absolute w-full px-8 py-6 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scale className="w-8 h-8 text-emerald-700" />
            <span className="text-2xl font-bold text-gray-900">Prados Legal Hub</span>
          </div>
          <Button 
            data-testid="login-nav-btn"
            onClick={() => setShowAuth(true)} 
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-6"
          >
            Acceder
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Soporte Legal Inteligente para
                <span className="text-emerald-700"> Prados de Paraíso</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Plataforma avanzada con agente conversacional IA para responder consultas legales, 
                gestionar documentos y mantener historial completo de interacciones.
              </p>
              <div className="flex gap-4">
                <Button 
                  data-testid="get-started-btn"
                  onClick={() => setShowAuth(true)} 
                  size="lg" 
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-6 text-lg"
                >
                  Comenzar Ahora
                </Button>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white p-8 rounded-3xl shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                    <MessageCircle className="w-6 h-6 text-emerald-700" />
                    <div>
                      <p className="font-semibold text-gray-900">Chat Inteligente</p>
                      <p className="text-sm text-gray-600">Respuestas instantáneas 24/7</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-xl">
                    <FileText className="w-6 h-6 text-teal-700" />
                    <div>
                      <p className="font-semibold text-gray-900">Gestión Documental</p>
                      <p className="text-sm text-gray-600">Sube y consulta archivos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-blue-700" />
                    <div>
                      <p className="font-semibold text-gray-900">Analytics Avanzado</p>
                      <p className="text-sm text-gray-600">Métricas y reportes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Funcionalidades Completas
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Todo lo que necesitas para gestionar consultas legales de manera eficiente
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
              <MessageCircle className="w-12 h-12 text-emerald-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Agente Conversacional IA</h3>
              <p className="text-gray-600 leading-relaxed">
                Chat inteligente con GPT-4 Turbo que responde consultas sobre propiedad, 
                posesión y saneamiento legal.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-white border border-teal-100">
              <Users className="w-12 h-12 text-teal-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Historial Persistente</h3>
              <p className="text-gray-600 leading-relaxed">
                Todas las conversaciones se guardan por usuario. Retoma consultas 
                anteriores sin perder contexto.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
              <FileText className="w-12 h-12 text-blue-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gestión Documental</h3>
              <p className="text-gray-600 leading-relaxed">
                Carga documentos para consultas específicas. Exporta conversaciones a PDF.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-100">
              <TrendingUp className="w-12 h-12 text-purple-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Panel de Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Métricas completas: consultas frecuentes, tiempos de respuesta, 
                y actividad de usuarios.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-pink-50 to-white border border-pink-100">
              <Shield className="w-12 h-12 text-pink-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Búsqueda Inteligente</h3>
              <p className="text-gray-600 leading-relaxed">
                Encuentra rápidamente información en todo el historial de conversaciones.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-white border border-orange-100">
              <Scale className="w-12 h-12 text-orange-700 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Respaldo Legal</h3>
              <p className="text-gray-600 leading-relaxed">
                Base de conocimiento con información de Notaría Tambini y Casahierro Abogados.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div 
          data-testid="auth-modal"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAuth(false)}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
            <p className="text-gray-600 mb-6">Ingresa tus datos para comenzar</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <Input
                  data-testid="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  data-testid="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@ejemplo.com"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  data-testid="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="seller">Vendedor</option>
                  <option value="client">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <Button
                data-testid="submit-auth-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-6 text-lg"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            <button
              data-testid="close-modal-btn"
              onClick={() => setShowAuth(false)}
              className="mt-4 w-full text-center text-gray-600 hover:text-gray-900"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;