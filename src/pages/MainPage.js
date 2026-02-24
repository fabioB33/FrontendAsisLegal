import React, { useState, useRef } from 'react';
import { Scale, MessageCircle, Sparkles } from 'lucide-react';
import HeyGenAvatar from '../components/HeyGenAvatar';
import TextChatInput from '@/components/TextChatInput';

const MainPage = () => {
  const [chatMode, setChatMode] = useState('voice'); // 'voice' or 'text'
  const [avatarState, setAvatarState] = useState({
    isProcessing: false,
    isPlaying: false,
    isPaused: false
  });
  
  const avatarRef = useRef(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-emerald-200/10 to-teal-200/10 rounded-full blur-3xl"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        
        {/* Logo y Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 mb-6 shadow-2xl shadow-emerald-500/50 transform hover:scale-110 transition-transform duration-300">
            <Scale className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-emerald-900 to-gray-900 bg-clip-text text-transparent" style={{ fontFamily: 'Playfair Display, serif' }}>
            Prados de Paraíso
          </h1>
          
          <p className="text-xl md:text-2xl text-emerald-800 font-medium mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
            Asistencia Legal Inteligente
          </p>
          
          <div className="max-w-2xl mx-auto">
            <p className="text-lg text-gray-600 leading-relaxed">
              Conversa con nuestro asistente legal impulsado por IA. 
              Obtén respuestas instantáneas sobre propiedad, posesión y saneamiento legal.
            </p>
          </div>
        </div>

        {/* Avatar de Valeria - HeyGen LiveAvatar con Push-to-Talk */}
        <div className="mb-8 animate-fade-in">
          <HeyGenAvatar ref={avatarRef} />
        </div>

        {/* Selector de modo */}
        <div className="mb-6 animate-fade-in-delayed">
          <div className="inline-flex rounded-full bg-white/80 backdrop-blur-sm p-1 shadow-lg border border-gray-200">
            <button
              onClick={() => setChatMode('voice')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                chatMode === 'voice'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎤 Voz
            </button>
            <button
              onClick={() => setChatMode('text')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                chatMode === 'text'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 Texto
            </button>
          </div>
        </div>

        {/* Chat de Texto (solo en modo texto) */}
        <div className="mb-12 animate-fade-in-delayed">
          {chatMode === 'text' && (
            <TextChatInput onStateChange={setAvatarState} avatarRef={avatarRef} />
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full animate-fade-in-delayed-2">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Conversación Natural</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Habla naturalmente con nuestro asistente de voz impulsado por IA
            </p>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Scale className="w-6 h-6 text-teal-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Información Legal Completa</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Accede a toda la información sobre condiciones legales de Prados de Paraíso
            </p>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-blue-700" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Disponible 24/7</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Consulta en cualquier momento, obtén respuestas inmediatas
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Legal Hub • Respaldo de Notaría Tambini y Casahierro Abogados
          </p>
          <p className="text-sm text-gray-400">
            Sitio realizado por{' '}
            <a 
              href="https://www.pampalabs.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors underline decoration-emerald-300 hover:decoration-emerald-500"
            >
              PampaLabs
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-delayed {
          animation: fade-in 0.8s ease-out 0.2s both;
        }

        .animate-fade-in-delayed-2 {
          animation: fade-in 0.8s ease-out 0.4s both;
        }
      `}</style>
    </div>
  );
};

export default MainPage;
