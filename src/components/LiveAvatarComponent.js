import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Volume2, Loader2, User } from 'lucide-react';
import StreamingAvatar, { AvatarQuality, StreamingEvents } from '@heygen/streaming-avatar';

const LiveAvatarComponent = forwardRef((props, ref) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Inicializando...');
  
  const videoRef = useRef(null);
  const avatarRef = useRef(null);
  const mediaStreamRef = useRef(null);
  
  // Initialize LiveAvatar
  useEffect(() => {
    const initAvatar = async () => {
      try {
        setStatus('Obteniendo token de sesión...');
        
        // Get session token from backend
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const tokenResponse = await fetch(`${backendUrl}/api/liveavatar/session-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!tokenResponse.ok) {
          throw new Error('No se pudo obtener el token de sesión');
        }
        
        const { token, avatar_id } = await tokenResponse.json();
        
        setStatus('Conectando con avatar...');
        
        // Initialize StreamingAvatar
        const avatar = new StreamingAvatar({ token });
        avatarRef.current = avatar;
        
        // Event listeners
        avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
          console.log('🗣️ Avatar speaking');
          setIsSpeaking(true);
        });
        
        avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
          console.log('🤐 Avatar stopped speaking');
          setIsSpeaking(false);
        });
        
        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          console.log('📡 Stream disconnected');
          setStatus('Desconectado');
          setIsInitialized(false);
        });
        
        avatar.on(StreamingEvents.STREAM_READY, (event) => {
          console.log('✅ Stream ready');
          const { detail } = event;
          if (detail && videoRef.current) {
            videoRef.current.srcObject = detail;
            videoRef.current.play();
            mediaStreamRef.current = detail;
          }
          setIsInitialized(true);
          setStatus('Avatar listo');
        });
        
        // Start session
        setStatus('Iniciando sesión...');
        await avatar.createStartAvatar({
          quality: AvatarQuality.High,
          avatarName: avatar_id,
          voice: {
            voiceId: "d5cbf7a530f247cf99f0ae3a45e15c82",  // Spanish voice
            rate: 1.0,
            emotion: 'Friendly'
          },
          language: 'es',
          disableIdleTimeout: false
        });
        
        console.log('✅ LiveAvatar initialized successfully');
        
      } catch (err) {
        console.error('Error initializing LiveAvatar:', err);
        setError(err.message);
        setStatus('Error en inicialización');
      }
    };
    
    initAvatar();
    
    // Cleanup
    return () => {
      if (avatarRef.current) {
        avatarRef.current.stopAvatar().catch(console.error);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Method to send message to avatar (speak)
  const sendMessage = async (message) => {
    if (!avatarRef.current || !isInitialized) {
      console.warn('Avatar not ready');
      return;
    }
    
    try {
      setStatus('Procesando consulta...');
      
      // Send to backend for semantic search + LLM response
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener respuesta');
      }
      
      const data = await response.json();
      
      setStatus('Generando respuesta...');
      
      // Make avatar speak the response
      await avatarRef.current.speak({
        text: data.response,
        taskType: 'talk'
      });
      
      setStatus('Avatar listo');
      
      return data;
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
      setStatus('Error');
      throw err;
    }
  };
  
  // Expose method to parent via ref
  useImperativeHandle(ref, () => ({
    sendMessage,
    isReady: isInitialized
  }));
  
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Container */}
      <div className="relative">
        {/* Loading/Error overlays */}
        {!isInitialized && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 font-medium">{status}</p>
            </div>
          </div>
        )}
        
        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-2xl z-10 border-2 border-red-200">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-red-600 font-semibold mb-2">Error de Conexión</p>
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </div>
        )}
        
        {/* Avatar Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`
            w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] md:w-[500px] md:h-[500px]
            rounded-2xl overflow-hidden shadow-2xl object-cover
            transition-all duration-300 bg-black
            ${isSpeaking ? 'ring-8 ring-emerald-500 ring-opacity-50 scale-105' : ''}
            ${!isInitialized ? 'opacity-0' : 'opacity-100'}
          `}
        />
        
        {/* Speaking indicator */}
        {isInitialized && isSpeaking && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse shadow-lg">
              <Volume2 className="w-4 h-4" />
              Hablando
            </div>
          </div>
        )}
        
        {/* Ready indicator */}
        {isInitialized && !isSpeaking && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-2 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded-full text-xs">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              En línea
            </div>
          </div>
        )}
      </div>
      
      {/* Status Text */}
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800">
          Dra. Valeria - Asistente Legal IA
        </p>
        <p className="text-sm text-gray-500">{status}</p>
      </div>
    </div>
  );
});

export default LiveAvatarComponent;
