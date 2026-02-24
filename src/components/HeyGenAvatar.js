/**
 * HeyGenAvatar — LiveAvatar LITE mode
 *
 * Flujo:
 *  1. Al montar: crea sesión LITE → backend conecta WS al avatar
 *  2. Video del avatar llega por LiveKit (sin cambios)
 *  3. PTT: el frontend graba audio con MediaRecorder
 *  4. Al soltar PTT: envía audio base64 a /api/liveavatar/speak
 *     El backend hace STT→LLM→TTS PCM→WS avatar (lip-sync con voz Karla peruana)
 *  5. Modo texto: envía texto a /api/liveavatar/speak-text
 *  6. Botón Detener: llama a /api/liveavatar/interrupt
 */
import React, {
  useEffect, useRef, useState,
  useImperativeHandle, forwardRef, useCallback,
} from 'react';
import {
  Loader2, AlertCircle, Mic, MessageSquare,
  User, Bot, VolumeX, Pause, Play, Square,
} from 'lucide-react';
import { Room, RoomEvent, Track } from 'livekit-client';

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const HeyGenAvatar = forwardRef((_props, ref) => {
  const [isConnected, setIsConnected]       = useState(false);
  const [isTalking, setIsTalking]           = useState(false);   // usuario grabando
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);  // avatar hablando
  const [isPaused, setIsPaused]             = useState(false);
  const [audioBlocked, setAudioBlocked]     = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);  // backend procesando
  const [error, setError]                   = useState(null);
  const [status, setStatus]                 = useState('Iniciando avatar...');
  const [messages, setMessages]             = useState([]);

  const videoRef       = useRef(null);
  const audioTrackRef  = useRef(null);
  const audioPlayerRef = useRef(null);   // <audio> element for local TTS playback
  const roomRef        = useRef(null);
  const sessionIdRef   = useRef(null);
  const initCalledRef  = useRef(false);
  const messagesEndRef = useRef(null);

  // MediaRecorder para PTT
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Init: crea sesión LITE y conecta LiveKit para video ──
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;

    const connect = async () => {
      try {
        setStatus('Creando sesión...');

        const resp = await fetch(`${BACKEND}/api/liveavatar/create-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.detail || `HTTP ${resp.status}`);
        }

        const result = await resp.json();
        if (!result.success) throw new Error(result.message || 'Error al crear sesión');

        const { session_id, livekit_url, livekit_token } = result.session;
        sessionIdRef.current = session_id;

        if (!livekit_url || !livekit_token) throw new Error('No se recibieron credenciales LiveKit');

        setStatus('Conectando video...');

        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;

        // Video del avatar
        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Video && videoRef.current) {
            track.attach(videoRef.current);
            console.log('📹 Avatar video attached');
          } else if (track.kind === Track.Kind.Audio) {
            audioTrackRef.current = track;
            track.attach();
            console.log('🔊 Avatar audio attached');
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) audioTrackRef.current = null;
        });

        room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
          setAudioBlocked(!room.canPlaybackAudio);
        });

        room.on(RoomEvent.Disconnected, (reason) => {
          console.warn('LiveKit disconnected:', reason);
          setAvatarSpeaking(false);
          // Don't show error on disconnect — attempt is enough to show video
        });

        room.on(RoomEvent.ConnectionStateChanged, (state) => {
          console.log('LiveKit state:', state);
        });

        // En LITE mode el backend controla lip-sync vía WS propio.
        // LiveKit solo trae el video del avatar — no hay data channel de control.
        try {
          await room.connect(livekit_url, livekit_token, {
            autoSubscribe: true,
          });
          console.log('✅ LiveKit connected (LITE mode)');
        } catch (connErr) {
          // CORS error on localhost is expected with LiveKit cloud — still show UI
          console.warn('LiveKit connect warning (may be CORS on localhost):', connErr?.message || connErr);
        }

        // Attach tracks ya presentes
        room.remoteParticipants.forEach(p => {
          p.trackPublications.forEach(pub => {
            if (!pub.track) return;
            if (pub.track.kind === Track.Kind.Video && videoRef.current) {
              pub.track.attach(videoRef.current);
            } else if (pub.track.kind === Track.Kind.Audio) {
              audioTrackRef.current = pub.track;
              pub.track.attach();
            }
          });
        });

        setIsConnected(true);
        setAudioBlocked(!room.canPlaybackAudio);
        setStatus('Listo');

      } catch (err) {
        console.error('❌ Connection error:', err);
        setError(err.message || 'Error al conectar con el avatar');
      }
    };

    connect();

    return () => {
      if (roomRef.current) roomRef.current.disconnect();
      if (sessionIdRef.current) {
        fetch(`${BACKEND}/api/liveavatar/close-session/${sessionIdRef.current}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    };
  }, []);

  // ── Desbloquear audio ──
  const handleUnblockAudio = useCallback(async () => {
    if (!roomRef.current) return;
    try { await roomRef.current.startAudio(); } catch {}
  }, []);

  // ── Pausa / Reanuda audio local ──
  const handlePauseResume = useCallback(() => {
    const audio = audioPlayerRef.current;
    if (audio) {
      if (isPaused) {
        audio.play().catch(() => {});
        setIsPaused(false);
      } else {
        audio.pause();
        setIsPaused(true);
      }
    }
  }, [isPaused]);

  // ── Play TTS audio locally ──
  const playAudio = useCallback((audioUrl) => {
    if (!audioUrl) return;
    // Stop any currently playing audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
    }
    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    audio.onended = () => {
      setAvatarSpeaking(false);
      setIsPaused(false);
    };
    audio.onerror = (e) => {
      console.error('Audio playback error:', e);
      setAvatarSpeaking(false);
    };
    audio.play().catch(err => {
      console.warn('Audio play blocked by browser:', err.message);
      setAvatarSpeaking(false);
    });
    setAvatarSpeaking(true);
  }, []);

  // ── Detener avatar ──
  const handleStop = useCallback(async () => {
    // Stop local audio
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
    }
    if (!sessionIdRef.current) { setAvatarSpeaking(false); setIsPaused(false); return; }
    try {
      await fetch(`${BACKEND}/api/liveavatar/interrupt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdRef.current }),
      });
    } catch (e) {
      console.error('Interrupt error:', e);
    }
    setAvatarSpeaking(false);
    setIsPaused(false);
  }, []);

  // ── PTT: start recording ──
  const startTalking = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!isConnected || isProcessing) return;

    // Desbloquear audio del browser si hace falta
    if (audioBlocked && roomRef.current) {
      try { await roomRef.current.startAudio(); } catch {}
    }

    // Pedir acceso al micrófono
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('No se pudo acceder al micrófono');
      return;
    }

    audioChunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    mr.ondataavailable = (ev) => {
      if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
    };
    mr.start(100);
    mediaRecorderRef.current = mr;
    setIsTalking(true);
    console.log('🎤 Recording started');
  }, [isConnected, isProcessing, audioBlocked]);

  // ── PTT: stop recording → send to backend ──
  const stopTalking = useCallback(async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!isTalking || !mediaRecorderRef.current) return;

    setIsTalking(false);

    const mr = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    // Esperar que el recorder termine
    await new Promise((resolve) => {
      mr.onstop = resolve;
      mr.stop();
      // Detener tracks del stream
      mr.stream?.getTracks().forEach(t => t.stop());
    });

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
    if (audioBlob.size < 500) {
      console.warn('Audio muy corto, ignorado');
      return;
    }

    // Convertir a base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8       = new Uint8Array(arrayBuffer);
    const b64         = btoa(String.fromCharCode(...uint8));

    console.log(`🎤 Sending audio: ${audioBlob.size} bytes`);
    setIsProcessing(true);
    setStatus('Procesando...');

    try {
      const resp = await fetch(`${BACKEND}/api/liveavatar/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id:    sessionIdRef.current,
          audio_base64:  b64,
          conversation_id: null,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      console.log('✅ Speak response:', data);

      // Agregar al historial
      if (data.transcribed_text) {
        setMessages(prev => [...prev, {
          role: 'user', text: data.transcribed_text, id: Date.now(),
        }]);
      }
      if (data.ai_response) {
        setMessages(prev => [...prev, {
          role: 'assistant', text: data.ai_response, id: Date.now() + 1,
        }]);
        // Play audio locally — the backend returns MP3 as data URL
        if (data.audio_url) {
          playAudio(data.audio_url);
        }
      }

    } catch (err) {
      console.error('Speak error:', err);
      setError(`Error al procesar: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setStatus('Listo');
    }
  }, [isTalking, playAudio]);

  // ── Enviar mensaje de texto (modo texto desde MainPage) ──
  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || !sessionIdRef.current) return;

    setIsProcessing(true);
    setStatus('Procesando...');

    try {
      const resp = await fetch(`${BACKEND}/api/liveavatar/speak-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id:      sessionIdRef.current,
          text:            text.trim(),
          conversation_id: null,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${resp.status}`);
      }

      const data = await resp.json();

      setMessages(prev => [...prev, { role: 'user', text: text.trim(), id: Date.now() }]);
      if (data.ai_response) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.ai_response, id: Date.now() + 1 }]);
        if (data.audio_url) {
          playAudio(data.audio_url);
        }
      }

    } catch (err) {
      console.error('Text speak error:', err);
    } finally {
      setIsProcessing(false);
      setStatus('Listo');
    }
  }, [playAudio]);

  useImperativeHandle(ref, () => ({ isReady: isConnected, sendMessage }));

  // ── Render ──
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">

      {/* Avatar video */}
      <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[420px] md:h-[420px]">
        {!isConnected && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl z-10">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600 font-medium">{status}</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 rounded-2xl z-10 border-2 border-red-200 p-6">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold mb-3 text-lg">Error de Conexión</p>
            <p className="text-sm text-red-700 mb-4 leading-relaxed text-center">{error}</p>
            <button onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
              Recargar
            </button>
          </div>
        )}
        <video ref={videoRef} autoPlay playsInline
          className={`w-full h-full rounded-2xl object-cover shadow-2xl transition-opacity duration-300 ${isConnected ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {/* Nombre */}
      <div className="text-center">
        <p className="text-xl font-bold text-gray-800">Valeria - Asistente Legal IA</p>
        <p className="text-sm text-gray-500 mt-0.5">Prados de Paraíso</p>
      </div>

      {/* Audio bloqueado */}
      {isConnected && audioBlocked && (
        <button onClick={handleUnblockAudio}
          className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-semibold shadow-lg animate-pulse">
          <VolumeX className="w-5 h-5" />
          Tocá aquí para activar el audio
        </button>
      )}

      {/* Procesando */}
      {isConnected && isProcessing && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <p className="text-sm font-medium text-blue-700">Valeria está pensando...</p>
        </div>
      )}

      {/* Avatar hablando: controles Pausa + Detener */}
      {isConnected && !audioBlocked && !isProcessing && avatarSpeaking && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-200">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-sm font-medium text-emerald-700">
              {isPaused ? '⏸ En pausa' : '🔊 Valeria está respondiendo...'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePauseResume}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm shadow-md transition-all
                ${isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'}`}>
              {isPaused ? <><Play className="w-4 h-4" /> Reanudar</> : <><Pause className="w-4 h-4" /> Pausar</>}
            </button>
            <button onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm bg-red-500 hover:bg-red-600 text-white shadow-md transition-all">
              <Square className="w-4 h-4" />
              Detener
            </button>
          </div>
        </div>
      )}

      {/* PTT — solo cuando avatar NO está hablando ni procesando */}
      {isConnected && !audioBlocked && !avatarSpeaking && !isProcessing && (
        <div className="flex flex-col items-center gap-2">
          <button
            onMouseDown={startTalking}
            onMouseUp={stopTalking}
            onMouseLeave={isTalking ? stopTalking : undefined}
            onTouchStart={startTalking}
            onTouchEnd={stopTalking}
            className={`
              flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-white
              shadow-xl transition-all duration-150 select-none
              ${isTalking
                ? 'bg-red-500 scale-95 shadow-red-400/60 ring-4 ring-red-300'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-500/50'}
            `}
          >
            <Mic className={`w-5 h-5 ${isTalking ? 'animate-pulse' : ''}`} />
            {isTalking ? 'Soltá para terminar' : 'Mantené presionado para hablar'}
          </button>
          <p className="text-xs text-gray-400">{isTalking ? '🔴 Grabando...' : 'Push-to-Talk Mode'}</p>
        </div>
      )}

      {/* Historial */}
      {messages.length > 0 && (
        <div className="w-full mt-2">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-gray-700">Conversación</h3>
            <button onClick={() => setMessages([])}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Limpiar
            </button>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md overflow-hidden">
            <div className="max-h-64 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                    ${msg.role === 'user' ? 'bg-emerald-100' : 'bg-gradient-to-br from-blue-500 to-purple-600'}`}>
                    {msg.role === 'user'
                      ? <User className="w-3.5 h-3.5 text-emerald-700" />
                      : <Bot className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default HeyGenAvatar;
