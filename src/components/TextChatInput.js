import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Volume2, Pause, Play, Square } from 'lucide-react';

const TextChatInput = ({ onStateChange, avatarRef }) => {
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const audioElementRef = useRef(null);
  const mountedRef = useRef(true);
  const blobUrlRef = useRef(null); // para revocar blob URLs al terminar

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
      if (audioElementRef.current) { audioElementRef.current.pause(); audioElementRef.current = null; }
    };
  }, []);

  // Notify parent component of state changes
  React.useEffect(() => {
    if (onStateChange) {
      onStateChange({
        isProcessing,
        isPlaying,
        isPaused
      });
    }
  }, [isProcessing, isPlaying, isPaused, onStateChange]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Por favor escribe tu pregunta');
      return;
    }

    try {
      setError(null);
      setResponse(null);
      setIsProcessing(true);

      // Use avatar if available, otherwise fallback to direct call
      if (avatarRef?.current?.isReady && avatarRef?.current?.sendMessage) {
        console.log('🎬 Using LiveAvatar to speak');
        await avatarRef.current.sendMessage(message);
        setMessage(''); // Clear input
        setResponse(null); // Avatar responds via audio/video
        setIsProcessing(false);
        return;
      } else {
        // Fallback: Use direct API call with audio
        console.log('⚠️ Avatar not ready, using fallback with audio');
        const apiUrl = process.env.REACT_APP_BACKEND_URL || 'https://backendasislegal.onrender.com';
        const res = await fetch(`${apiUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message }),
        });

        if (!res.ok) {
          let errorMessage = 'Error al procesar la consulta';
          try {
            const errorData = await res.json();
            errorMessage = errorData.detail || errorMessage;
          } catch (e) {
            // Si no se puede parsear, usar mensaje genérico
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        
        // Display response
        setResponse(data.response);
        
        // Generate audio with ElevenLabs
        console.log('🔊 Generating audio for response...');
        const audioRes = await fetch(`${apiUrl}/api/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: data.response }),
        });
        
        if (audioRes.ok) {
          const audioData = await audioRes.json();
          if (audioData.audio) {
            // Convert base64 to audio URL
            const audioBlob = await fetch(`data:audio/mp3;base64,${audioData.audio}`).then(r => r.blob());
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
            const audioUrl = URL.createObjectURL(audioBlob);
            blobUrlRef.current = audioUrl;
            await playAudioResponse(audioUrl);
            URL.revokeObjectURL(audioUrl);
            blobUrlRef.current = null;
          }
        }
        
        setMessage(''); // Clear input
      }
      
      setIsProcessing(false);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al procesar la consulta');
      setIsProcessing(false);
    }
  };

  const playAudioResponse = async (audioUrl) => {
    try {
      setIsPlaying(true);
      setIsPaused(false);
      
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => {
        if (!mountedRef.current) return;
        setIsPlaying(false);
        setIsPaused(false);
        audioElementRef.current = null;
      };

      audioElementRef.current.onerror = () => {
        if (!mountedRef.current) return;
        setError('Error al reproducir audio');
        setIsPlaying(false);
        setIsPaused(false);
        audioElementRef.current = null;
      };
      
      await audioElementRef.current.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const togglePause = () => {
    if (audioElementRef.current) {
      if (isPaused) {
        audioElementRef.current.play();
        setIsPaused(false);
      } else {
        audioElementRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const stopAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      audioElementRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input de texto */}
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu pregunta sobre Prados de Paraíso..."
            disabled={isProcessing || isPlaying}
            rows={3}
            className="w-full px-4 py-3 pr-12 rounded-2xl border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={isProcessing || isPlaying || !message.trim()}
            className="absolute right-3 bottom-3 p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-all transform hover:scale-105 active:scale-95"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Controles de audio */}
        {isPlaying && (
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-4 border-2 border-emerald-300 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center animate-pulse">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  {isPaused ? '⏸️ Pausado' : '🗣️ Reproduciendo respuesta'}
                </p>
                <p className="text-xs text-emerald-700">Asistente legal</p>
              </div>
            </div>
            
            {/* Botones de control */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePause}
                className="p-3 rounded-full bg-white hover:bg-emerald-200 text-emerald-600 transition-all transform hover:scale-110 active:scale-95 shadow-md"
                title={isPaused ? 'Reanudar' : 'Pausar'}
              >
                {isPaused ? (
                  <Play className="w-5 h-5" />
                ) : (
                  <Pause className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={stopAudio}
                className="p-3 rounded-full bg-white hover:bg-red-200 text-red-600 transition-all transform hover:scale-110 active:scale-95 shadow-md"
                title="Detener"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Respuesta */}
        {response && !isProcessing && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0">
                <Volume2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Respuesta del Asistente:</h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{response}</p>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default TextChatInput;
