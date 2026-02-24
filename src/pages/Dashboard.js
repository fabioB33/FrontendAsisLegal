import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  FileText, 
  TrendingUp, 
  LogOut, 
  Clock,
  Download
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [convsRes, docsRes] = await Promise.all([
        axios.get(`${API}/conversations/user/${user.id}`),
        axios.get(`${API}/documents/user/${user.id}`)
      ]);
      setConversations(convsRes.data);
      setDocuments(docsRes.data);
    } catch (error) {
      console.error(error);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await axios.post(`${API}/conversations`, {
        user_id: user.id,
        user_name: user.name,
        title: 'Nueva Consulta Legal'
      });
      navigate(`/chat/${response.data.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Error creando conversación');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.id);

    try {
      await axios.post(`${API}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Documento subido exitosamente');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Error subiendo documento');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await axios.get(`${API}/search`, {
        params: { q: searchQuery, user_id: user.id }
      });
      setConversations(response.data.conversations);
      toast.success(`${response.data.message_matches} mensajes encontrados`);
    } catch (error) {
      console.error(error);
      toast.error('Error en búsqueda');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const exportConversation = async (convId) => {
    try {
      const response = await axios.get(`${API}/conversations/${convId}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `conversacion_${convId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF descargado');
    } catch (error) {
      console.error(error);
      toast.error('Error exportando conversación');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
              <p className="text-gray-600">Bienvenido, {user?.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                data-testid="analytics-btn"
                onClick={() => navigate('/analytics')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Analytics
              </Button>
              <Button
                data-testid="logout-btn"
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <button
            data-testid="new-conversation-btn"
            onClick={createNewConversation}
            className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl text-white hover:shadow-lg transition-shadow"
          >
            <Plus className="w-8 h-8 mb-2" />
            <h3 className="text-lg font-bold">Nueva Consulta</h3>
            <p className="text-sm opacity-90">Iniciar chat con el asistente</p>
          </button>

          <label className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white hover:shadow-lg transition-shadow cursor-pointer">
            <FileText className="w-8 h-8 mb-2" />
            <h3 className="text-lg font-bold">Subir Documento</h3>
            <p className="text-sm opacity-90">
              {uploadingFile ? 'Subiendo...' : 'Añadir archivo'}
            </p>
            <input
              data-testid="file-upload-input"
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploadingFile}
            />
          </label>

          <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white">
            <MessageCircle className="w-8 h-8 mb-2" />
            <h3 className="text-lg font-bold">{conversations.length}</h3>
            <p className="text-sm opacity-90">Conversaciones Totales</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                data-testid="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Buscar en conversaciones..."
                className="pl-10 py-6"
              />
            </div>
            <Button
              data-testid="search-btn"
              onClick={handleSearch}
              className="bg-emerald-700 hover:bg-emerald-800 px-8"
            >
              Buscar
            </Button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Conversaciones Recientes</h2>
          
          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes conversaciones aún</p>
              <Button
                onClick={createNewConversation}
                className="mt-4 bg-emerald-700 hover:bg-emerald-800"
              >
                Crear Primera Consulta
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  data-testid={`conversation-${conv.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/chat/${conv.id}`)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{conv.title}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(conv.updated_at).toLocaleDateString('es-ES')}
                        </span>
                        <span className="text-sm text-gray-500">
                          {conv.message_count || 0} mensajes
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    data-testid={`export-btn-${conv.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      exportConversation(conv.id);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documents List */}
        {documents.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Documentos</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  data-testid={`document-${doc.id}`}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl"
                >
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.filename}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;