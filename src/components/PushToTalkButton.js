import React, { useState, useRef, useEffect } from 'react';
import { Mic, Volume2, Loader2, Pause, Play, Square } from 'lucide-react';

const ELEVENLABS_AGENT_ID = 'agent_1501kf702acxfcd9bvcd3qkdxwpd';

const PushToTalkButton = ({ onStateChange }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioElementRef = useRef(null);
  
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
  
  useEffect(() => {
    // Limpiar al desmontar
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await sendToElevenLabsAgent(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      
      // Mensaje de error más detallado
      let errorMessage = 'No se pudo acceder al micrófono. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Debes permitir el acceso al micrófono. Busca el ícono 🔒 en la barra de direcciones y habilita el permiso.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No se encontró ningún micrófono en tu dispositivo.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'El micrófono está siendo usado por otra aplicación.';
      } else {
        errorMessage += 'Verifica los permisos de tu navegador.';
      }
      
      setError(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const sendToElevenLabsAgent = async (audioBlob) => {
    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || 'https://backendasislegal-e5n9.onrender.com';
      
      // Step 1: Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const transcribeResponse = await fetch(`${apiUrl}/api/voice-chat`, {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Error al transcribir audio');
      }

      const transcribeData = await transcribeResponse.json();
      const userQuestion = transcribeData.transcription || transcribeData.user_message;
      
      if (!userQuestion) {
        throw new Error('No se pudo transcribir el audio');
      }
      
      console.log('📝 Transcription:', userQuestion);
      
      // Step 2: Get AI response with semantic search
      const chatResponse = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userQuestion }),
      });

      if (!chatResponse.ok) {
        let errorMessage = 'Error al procesar la consulta';
        try {
          const errorData = await chatResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // Si no se puede parsear, usar mensaje genérico
        }
        throw new Error(errorMessage);
      }

      const chatData = await chatResponse.json();
      console.log('🤖 AI Response:', chatData.response);
      console.log('📚 Sources used:', chatData.context_used);
      
      // Step 3: Generate audio with TTS
      const ttsResponse = await fetch(`${apiUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: chatData.response }),
      });

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        if (ttsData.audio) {
          // Convert base64 to audio URL
          const audioBlob = await fetch(`data:audio/mp3;base64,${ttsData.audio}`).then(r => r.blob());
          const audioUrl = URL.createObjectURL(audioBlob);
          await playAudioResponse(audioUrl);
        }
      }
      
      setIsProcessing(false);
    } catch (err) {
      console.error('Error processing voice query:', err);
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
        setIsPlaying(false);
        setIsPaused(false);
        audioElementRef.current = null;
      };
      
      audioElementRef.current.onerror = () => {
        setError('Error al reproducir audio');
        setIsPlaying(false);
        setIsPaused(false);
        audioElementRef.current = null;
      };
      
      await audioElementRef.current.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Error al reproducir audio');
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

  const handleMouseDown = () => {
    startRecording();
  };

  const handleMouseUp = () => {
    stopRecording();
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    startRecording();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    stopRecording();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Controles de audio cuando está reproduciendo */}
      {isPlaying && (
        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-4 border-2 border-emerald-300 shadow-md mb-4 w-full max-w-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center animate-pulse">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                {isPaused ? '⏸️ Pausado' : '🗣️ Reproduciendo'}
              </p>
              <p className="text-xs text-emerald-700">Respuesta del agente</p>
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
      {/* Botón Principal PTT */}
      <div className="relative">
        <button
          data-testid="ptt-button"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          disabled={isProcessing || isPlaying}
          className={`
            relative w-32 h-32 rounded-full shadow-2xl
            transition-all duration-200 transform
            ${isRecording 
              ? 'bg-red-500 scale-95 shadow-red-500/50' 
              : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 shadow-emerald-500/50'
            }
            ${isProcessing || isPlaying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90'}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {/* Icono */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isProcessing ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : isPlaying ? (
              <Volume2 className="w-12 h-12 text-white animate-pulse" />
            ) : isRecording ? (
              <Mic className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </div>

          {/* Animación de pulso cuando está grabando */}
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
              <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-50"></span>
            </>
          )}
        </button>

        {/* Controles de reproducción (arriba del botón) */}
        {isPlaying && (
          <div className="absolute -top-24 left-1/2 transform -translate-x-1/2 w-80">
            <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-4 border-2 border-emerald-300 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center animate-pulse">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    {isPaused ? '⏸️ Pausado' : '🗣️ Reproduciendo'}
                  </p>
                  <p className="text-xs text-emerald-700">Respuesta del agente</p>
                </div>
              </div>
              
              {/* Botones de control */}
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePause}
                  className="p-2.5 rounded-full bg-white hover:bg-emerald-200 text-emerald-600 transition-all transform hover:scale-110 active:scale-95 shadow-md"
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
                  className="p-2.5 rounded-full bg-white hover:bg-red-200 text-red-600 transition-all transform hover:scale-110 active:scale-95 shadow-md"
                  title="Detener"
                >
                  <Square className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Texto de instrucción */}
      <div className="text-center min-h-[60px] mt-12">
        {isRecording ? (
          <p className="text-lg font-semibold text-red-600 animate-pulse">
            🔴 Grabando... Suelta para enviar
          </p>
        ) : isProcessing ? (
          <p className="text-lg font-semibold text-blue-600">
            ⏳ Procesando consulta...
          </p>
        ) : isPlaying ? (
          <>
            <p className="text-lg font-semibold text-emerald-600 animate-pulse">
              {isPaused ? '⏸️ En pausa' : '🔊 Dr. Prados está respondiendo...'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Usa los controles para pausar o detener
            </p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-gray-700">
              Mantén presionado para hablar
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Estilo WhatsApp
            </p>
          </>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default PushToTalkButton;
