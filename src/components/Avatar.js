import React from 'react';

const Avatar = ({ isProcessing = false, isPlaying = false, isPaused = false }) => {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Avatar Container */}
      <div className="relative">
        {/* Enhanced animated rings when speaking */}
        {isPlaying && !isPaused && (
          <>
            {/* Outer ring - slower pulse */}
            <div className="absolute -inset-6 rounded-full border-4 border-emerald-400 animate-ping opacity-40" 
                 style={{ animationDuration: '2s' }}></div>
            {/* Middle ring */}
            <div className="absolute -inset-4 rounded-full border-4 border-emerald-500 animate-pulse opacity-60" 
                 style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}></div>
            {/* Inner ring - faster */}
            <div className="absolute -inset-2 rounded-full border-3 border-emerald-600 animate-pulse opacity-80" 
                 style={{ animationDelay: '0.6s', animationDuration: '1s' }}></div>
          </>
        )}
        
        {/* Enhanced processing ring with gradient */}
        {isProcessing && (
          <>
            <div className="absolute -inset-3 rounded-full animate-spin" 
                 style={{ 
                   background: 'conic-gradient(from 0deg, transparent, #3b82f6, transparent)',
                   animationDuration: '1.5s'
                 }}></div>
            <div className="absolute -inset-2 rounded-full border-4 border-blue-500 animate-pulse opacity-50"></div>
          </>
        )}
        
        {/* Avatar Image - Premium styling with REALISTIC ANIMATIONS */}
        <div className={`
          relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full overflow-hidden
          shadow-2xl
          transition-all duration-500 ease-out
          ${isPlaying && !isPaused ? 'ring-8 ring-emerald-500 ring-opacity-50 scale-105 shadow-emerald-500/50 animate-talking' : ''}
          ${isProcessing ? 'ring-8 ring-blue-500 ring-opacity-50 shadow-blue-500/50' : ''}
          ${!isPlaying && !isProcessing ? 'ring-4 ring-gray-300 hover:ring-emerald-300 hover:scale-102 animate-breathing' : ''}
        `}>
          <img 
            src="/avatar-dra-prados.png" 
            alt="Dra. Prados de Paraíso"
            className={`
              w-full h-full object-cover transition-transform duration-300
              ${isPlaying && !isPaused ? 'animate-subtle-shake' : ''}
            `}
            style={{ objectPosition: 'center 20%' }}
          />
          
          {/* Enhanced overlay when processing */}
          {isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-blue-600/20 to-transparent flex items-center justify-center backdrop-blur-sm">
              <div className="relative">
                <div className="w-16 h-16 border-8 border-white/30 border-t-white rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" 
                     style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
              </div>
            </div>
          )}
          
          {/* Enhanced glow effect when speaking with gradient */}
          {isPlaying && !isPaused && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/40 via-emerald-400/20 to-transparent animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-radial from-transparent via-emerald-300/10 to-emerald-500/30 animate-pulse" 
                   style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
            </>
          )}
          
          {/* Subtle shine effect on idle */}
          {!isPlaying && !isProcessing && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50"></div>
          )}
        </div>
      </div>
      
      {/* Status Text with enhanced styling */}
      <div className="text-center min-h-[50px]">
        {isProcessing ? (
          <div className="space-y-2">
            <p className="text-lg font-semibold text-blue-600 animate-pulse">
              Pensando...
            </p>
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : isPlaying ? (
          <div className="space-y-2">
            <p className="text-lg font-semibold text-emerald-600 animate-pulse">
              {isPaused ? '⏸️ En pausa' : '🗣️ Hablando...'}
            </p>
            {!isPaused && (
              <div className="flex justify-center gap-1">
                <div className="w-1 h-6 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
                <div className="w-1 h-8 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-7 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-9 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-1 h-6 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-700">
              Dra. Prados de Paraíso
            </p>
            <p className="text-xs text-gray-500 italic">
              Asistente Legal Inteligente
            </p>
          </div>
        )}
      </div>
      
      {/* Custom CSS animations for realistic movement */}
      <style jsx>{`
        @keyframes talking {
          0%, 100% { transform: scale(1.05) rotate(0deg); }
          25% { transform: scale(1.06) rotate(-0.5deg); }
          50% { transform: scale(1.05) rotate(0deg); }
          75% { transform: scale(1.06) rotate(0.5deg); }
        }
        
        @keyframes subtle-shake {
          0%, 100% { transform: translateX(0) translateY(0); }
          10% { transform: translateX(-1px) translateY(0.5px); }
          20% { transform: translateX(1px) translateY(-0.5px); }
          30% { transform: translateX(-0.5px) translateY(1px); }
          40% { transform: translateX(0.5px) translateY(-1px); }
          50% { transform: translateX(0) translateY(0); }
          60% { transform: translateX(-0.5px) translateY(0.5px); }
          70% { transform: translateX(0.5px) translateY(-0.5px); }
          80% { transform: translateX(-1px) translateY(0.5px); }
          90% { transform: translateX(1px) translateY(-0.5px); }
        }
        
        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        .animate-talking {
          animation: talking 2s ease-in-out infinite;
        }
        
        .animate-subtle-shake {
          animation: subtle-shake 3s ease-in-out infinite;
        }
        
        .animate-breathing {
          animation: breathing 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Avatar;
