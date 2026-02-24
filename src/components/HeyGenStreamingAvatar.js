import React, { useEffect, useRef, useState } from 'react';
import StreamingAvatar, { 
  AvatarQuality, 
  StreamingEvents,
  TaskType,
  TaskMode
} from '@heygen/streaming-avatar';
import Avatar from './Avatar';

const HeyGenStreamingAvatar = ({ 
  isProcessing = false, 
  isPlaying = false, 
  isPaused = false,
  onAvatarReady = () => {},
  onAvatarError = () => {}
}) => {
  const [isHeyGenAvailable, setIsHeyGenAvailable] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [avatarState, setAvatarState] = useState('idle'); // idle, thinking, speaking
  
  const avatarRef = useRef(null);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Initialize HeyGen Streaming Avatar
  useEffect(() => {
    const initializeAvatar = async () => {
      if (!isHeyGenAvailable || isInitializing) return;
      
      setIsInitializing(true);
      
      try {
        console.log('🎬 Initializing HeyGen Streaming Avatar...');
        
        // Get token from backend
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const tokenResponse = await fetch(`${backendUrl}/api/heygen/streaming-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          throw new Error(`Failed to get token: ${tokenResponse.status} - ${errorText}`);
        }
        
        const tokenData = await tokenResponse.json();
        const { token, avatar_id } = tokenData;
        
        if (!token) {
          throw new Error('No token received from backend');
        }
        
        console.log('✅ Token received, Avatar ID:', avatar_id);
        
        // Create streaming avatar instance
        const avatar = new StreamingAvatar({ token });
        avatarRef.current = avatar;
        
        // Set up event listeners
        avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
          console.log('🗣️ Avatar started talking');
          setAvatarState('speaking');
        });
        
        avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
          console.log('🤐 Avatar stopped talking');
          setAvatarState('idle');
        });
        
        avatar.on(StreamingEvents.STREAM_READY, (event) => {
          console.log('📺 Stream ready:', event);
          if (event.detail && videoRef.current) {
            videoRef.current.srcObject = event.detail;
            videoRef.current.play().catch(e => console.error('Play error:', e));
          }
          setIsConnected(true);
          onAvatarReady();
        });
        
        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          console.log('❌ Stream disconnected');
          setIsConnected(false);
          handleFallbackToCSS('Stream disconnected');
        });
        
        // Create and start session
        console.log('🚀 Creating avatar session...');
        const sessionInfo = await avatar.createStartAvatar({
          quality: AvatarQuality.High,
          avatarName: avatar_id,
          language: 'es',
          voice: {
            rate: 1.0,
            emotion: 'Friendly'
          }
        });
        
        console.log('✅ Avatar session created:', sessionInfo);
        
      } catch (err) {
        console.error('❌ HeyGen initialization error:', err);
        setError(err.message);
        handleFallbackToCSS(err.message);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeAvatar();
    
    // Cleanup
    return () => {
      if (avatarRef.current) {
        console.log('🧹 Cleaning up avatar session...');
        avatarRef.current.stopAvatar().catch(e => console.error('Stop error:', e));
      }
    };
  }, []);
  
  const handleFallbackToCSS = (reason) => {
    // Silent fallback - log to console only
    console.info('ℹ️ Using CSS avatar (HeyGen not available)');
    setIsHeyGenAvailable(false);
    onAvatarError(reason);
  };
  
  // Method to send text to avatar (will be called from parent)
  const speak = async (text) => {
    if (!avatarRef.current || !isConnected) {
      console.warn('⚠️ Avatar not ready, cannot speak');
      return false;
    }
    
    try {
      console.log('💬 Sending text to HeyGen avatar:', text.substring(0, 50) + '...');
      setAvatarState('thinking');
      
      await avatarRef.current.speak({
        text: text,
        task_type: TaskType.REPEAT,
        task_mode: TaskMode.SYNC
      });
      
      console.log('✅ Text sent to avatar successfully');
      return true;
    } catch (err) {
      console.error('❌ Speak error:', err);
      return false;
    }
  };
  
  // Expose speak method to parent
  useEffect(() => {
    if (window.heygenAvatar) {
      window.heygenAvatar.speak = speak;
    } else {
      window.heygenAvatar = { speak };
    }
  }, [isConnected]);
  
  // If HeyGen is not available, use CSS fallback (silently)
  if (!isHeyGenAvailable) {
    return (
      <Avatar 
        isProcessing={isProcessing} 
        isPlaying={isPlaying} 
        isPaused={isPaused} 
      />
    );
  }
  
  // Show CSS avatar while initializing
  if (isInitializing || !isConnected) {
    return (
      <div>
        <Avatar 
          isProcessing={true} 
          isPlaying={false} 
          isPaused={false} 
        />
        <div className="mt-2 text-sm text-blue-600 text-center">
          <p className="font-medium">🎬 Inicializando avatar de video...</p>
        </div>
      </div>
    );
  }
  
  // Render HeyGen video avatar
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Video Container */}
      <div className="relative">
        {/* Animated rings when speaking */}
        {avatarState === 'speaking' && (
          <>
            <div className="absolute -inset-4 rounded-full border-4 border-emerald-500 animate-ping opacity-75"></div>
            <div className="absolute -inset-2 rounded-full border-4 border-emerald-400 animate-pulse opacity-50" style={{ animationDelay: '0.3s' }}></div>
          </>
        )}
        
        {/* Thinking ring */}
        {avatarState === 'thinking' && (
          <div className="absolute -inset-2 rounded-full border-4 border-blue-500 animate-spin" style={{ borderTopColor: 'transparent' }}></div>
        )}
        
        {/* Video Avatar */}
        <div className={`
          relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full overflow-hidden
          shadow-2xl
          transition-all duration-300
          ${avatarState === 'speaking' ? 'ring-8 ring-emerald-500 ring-opacity-50 scale-105' : ''}
          ${avatarState === 'thinking' ? 'ring-8 ring-blue-500 ring-opacity-50' : ''}
          ${avatarState === 'idle' ? 'ring-4 ring-gray-300' : ''}
        `}>
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror video for more natural look
          />
          
          {/* Overlay when thinking */}
          {avatarState === 'thinking' && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
              <div className="w-16 h-16 border-8 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {/* Glow effect when speaking */}
          {avatarState === 'speaking' && (
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/30 to-transparent animate-pulse"></div>
          )}
        </div>
      </div>
      
      {/* Status Text */}
      <div className="text-center min-h-[50px]">
        {avatarState === 'thinking' ? (
          <p className="text-lg font-semibold text-blue-600 animate-pulse">
            Pensando...
          </p>
        ) : avatarState === 'speaking' ? (
          <p className="text-lg font-semibold text-emerald-600 animate-pulse">
            🗣️ Hablando...
          </p>
        ) : (
          <p className="text-lg font-semibold text-gray-700">
            Dra. Prados de Paraíso
          </p>
        )}
        
        {/* Connection status badge */}
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-500">
            {isConnected ? 'Avatar de video activo' : 'Conectando...'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeyGenStreamingAvatar;
