import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Users, MessageCircle, FileText, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }
    loadAnalytics();
  }, [navigate]);

  const loadAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/overview`);
      setAnalytics(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Error cargando analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b px-8 py-4">
        <div className="flex items-center gap-4">
          <Button
            data-testid="back-to-dashboard-btn"
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Analytics</h1>
            <p className="text-gray-600">Métricas y estadísticas de la plataforma</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div 
            data-testid="stats-users"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
          >
            <Users className="w-10 h-10 mb-3 opacity-80" />
            <h3 className="text-3xl font-bold mb-1">{analytics?.total_users || 0}</h3>
            <p className="text-sm opacity-90">Usuarios Totales</p>
          </div>

          <div 
            data-testid="stats-conversations"
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white"
          >
            <MessageCircle className="w-10 h-10 mb-3 opacity-80" />
            <h3 className="text-3xl font-bold mb-1">{analytics?.total_conversations || 0}</h3>
            <p className="text-sm opacity-90">Conversaciones</p>
          </div>

          <div 
            data-testid="stats-messages"
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
          >
            <TrendingUp className="w-10 h-10 mb-3 opacity-80" />
            <h3 className="text-3xl font-bold mb-1">{analytics?.total_messages || 0}</h3>
            <p className="text-sm opacity-90">Mensajes Totales</p>
          </div>

          <div 
            data-testid="stats-documents"
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white"
          >
            <FileText className="w-10 h-10 mb-3 opacity-80" />
            <h3 className="text-3xl font-bold mb-1">{analytics?.total_documents || 0}</h3>
            <p className="text-sm opacity-90">Documentos</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h2>
          
          {analytics?.recent_activity && analytics.recent_activity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recent_activity.map((activity) => (
                <div
                  key={activity.id}
                  data-testid={`activity-${activity.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">
                        Usuario: {activity.user_name} • {activity.message_count || 0} mensajes
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.updated_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No hay actividad reciente</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;