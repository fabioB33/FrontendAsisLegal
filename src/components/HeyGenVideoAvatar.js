import React, { useEffect, useRef, useState } from 'react';

const HeyGenVideoAvatar = ({ isProcessing, isPlaying, isPaused, onStateChange }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const videoRef = useRef(null);
  const lastTextRef = useRef('');
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);
  
  const generateVideo = async (text) => {
    // Evitar generar el mismo texto dos veces
    if (text === lastTextRef.current) {
      console.log('⚠️ Same text, skipping generation');
      return;
    }
    
    lastTextRef.current = text;
    
    try {
      setError(null);
      setIsGenerating(true);
      if (onStateChange) {
        onStateChange({ isProcessing: true, isPlaying: false, isPaused: false });
      }
      
      console.log('🎬 Generating video with HeyGen:', text.substring(0, 50));
      
      const apiUrl = process.env.REACT_APP_BACKEND_URL || 'https://backendasislegal.onrender.com';
      const response = await fetch(`${apiUrl}/api/heygen/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error generating video: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Video generated:', data.video_url);
      
      setVideoUrl(data.video_url);
      setIsGenerating(false);
      
      // Reproducir video
      if (videoRef.current && data.video_url) {
        videoRef.current.src = data.video_url;
        videoRef.current.load();
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          if (onStateChange) {
            onStateChange({ isProcessing: false, isPlaying: true, isPaused: false });
          }
        };
        
        videoRef.current.onended = () => {
          console.log('✅ Video playback ended');
          if (onStateChange) {
            onStateChange({ isProcessing: false, isPlaying: false, isPaused: false });
          }
        };
      }
      
    } catch (err) {
      console.error('❌ Error generating video:', err);
      setError(err.message);
      setIsGenerating(false);
      if (onStateChange) {
        onStateChange({ isProcessing: false, isPlaying: false, isPaused: false });
      }
    }
  };
  
  // Expose method to parent
  useEffect(() => {
    if (window) {
      window.heygenSpeak = generateVideo;
    }
  }, []);
  
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Video Container */}
      <div className="relative">
        {/* Processing/Loading ring */}
        {(isGenerating || isProcessing) && (
          <div className="absolute -inset-2 rounded-full border-4 border-blue-500 animate-spin" style={{ borderTopColor: 'transparent' }}></div>
        )}
        
        {/* Speaking rings */}
        {isPlaying && !isPaused && (
          <>
            <div className="absolute -inset-4 rounded-full border-4 border-emerald-500 animate-ping opacity-75"></div>
            <div className="absolute -inset-2 rounded-full border-4 border-emerald-400 animate-pulse opacity-50" style={{ animationDelay: '0.3s' }}></div>
          </>
        )}
        
        {/* Video Element */}
        <div className={`
          relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full overflow-hidden
          shadow-2xl bg-gray-900
          transition-all duration-300
          ${isPlaying && !isPaused ? 'ring-8 ring-emerald-500 ring-opacity-50 scale-105' : ''}
          ${(isGenerating || isProcessing) ? 'ring-8 ring-blue-500 ring-opacity-50' : ''}
          ${!isGenerating && !isProcessing && !isPlaying ? 'ring-4 ring-gray-300' : ''}
        `}>
          {videoUrl ? (
            <video
              ref={videoRef}
              playsInline
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 20%' }}
            />
          ) : (
            <img 
              src="/avatar-dra-prados.png" 
              alt="Dra. Prados de Paraíso"
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center 20%' }}
            />
          )}
          
          {/* Loading overlay */}
          {(isGenerating || isProcessing) && (
            <div className="absolute inset-0 bg-gray-800 bg-opacity-70 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-8 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white text-sm font-medium">Generando respuesta...</p>
            </div>
          )}
          
          {/* Glow effect when speaking */}
          {isPlaying && !isPaused && (
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/30 to-transparent animate-pulse"></div>
          )}
        </div>
      </div>
      
      {/* Status Text */}
      <div className="text-center min-h-[50px]">
        {error ? (
          <p className="text-sm font-medium text-red-600">
            {error}
          </p>
        ) : (isGenerating || isProcessing) ? (
          <p className="text-lg font-semibold text-blue-600 animate-pulse">
            Pensando...
          </p>
        ) : isPlaying ? (
          <p className="text-lg font-semibold text-emerald-600 animate-pulse">
            {isPaused ? '⏸️ En pausa' : '🗣️ Hablando...'}
          </p>
        ) : (
          <p className="text-lg font-semibold text-gray-700">
            Dra. Prados de Paraíso
          </p>
        )}
      </div>
    </div>
  );
};

export default HeyGenVideoAvatar;
