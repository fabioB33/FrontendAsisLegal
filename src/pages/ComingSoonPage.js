import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Scale, Eye, EyeOff } from 'lucide-react';

const ComingSoonPage = ({ onPasswordCorrect }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (password === 'prados2025') {
        toast.success('¡Acceso concedido!');
        localStorage.setItem('prados_access', 'true');
        onPasswordCorrect();
      } else {
        toast.error('Contraseña incorrecta');
        setPassword('');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mb-6 shadow-2xl">
            <Scale className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            PRADOS
          </h1>
          <p className="text-2xl text-emerald-300" style={{ fontFamily: 'Playfair Display, serif' }}>
            de Paraíso
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              SITIO EN CONSTRUCCIÓN
            </h2>
            <p className="text-emerald-200 text-sm">
              Este sitio está actualmente en desarrollo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-emerald-200 mb-2">
                Ingrese la contraseña
              </label>
              <div className="relative">
                <Input
                  data-testid="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-12 py-6 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-emerald-300 hover:text-emerald-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              data-testid="access-button"
              type="submit"
              disabled={!password || loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-6 text-lg font-semibold rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'ACCEDER'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-emerald-200 text-sm">
            Legal Hub - Asistencia Inteligente con IA
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
