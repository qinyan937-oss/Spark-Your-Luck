
import React, { useEffect, useState } from 'react';
import { audio } from '../services/audioService';

const LoadingOverlay: React.FC = () => {
  const [phase, setPhase] = useState<'FOCUS' | 'FLASH' | 'DEVELOPING'>('FOCUS');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Phase 1: Countdown / Focusing
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('FLASH');
          audio.playShutter(); // Play shutter sound
          if (navigator.vibrate) navigator.vibrate(50); // Shutter Haptic
          return 0;
        }
        audio.playTick(); // Play tick sound for 3, 2
        return prev - 1;
      });
    }, 900); 

    // Initial tick for 3
    audio.playTick();

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (phase === 'FLASH') {
      // Phase 2: Flash triggers immediately after countdown
      const timeout = setTimeout(() => {
        setPhase('DEVELOPING');
      }, 200); // Short flash duration
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  // Acid / Pop Art Style helper for numbers (Light Mode)
  const getPopAcidNumberContent = (num: number) => {
    switch(num) {
      case 3:
        return (
          <div className="relative animate-wiggle">
            {/* Decorative elements */}
            <div className="absolute -top-16 -left-16 text-6xl text-lime-400 animate-spin-slow opacity-60 z-0">❋</div>
            <div className="absolute top-8 -right-24 bg-yellow-300 text-stone-800 px-3 py-1 transform rotate-12 border-2 border-stone-800 z-20 font-black text-xs tracking-widest shadow-[4px_4px_0px_#f97316]">
              LUCKY MODE
            </div>
            
            {/* Number 3 - Acid Green on Light */}
            <div className="relative z-10 font-black italic text-[12rem] md:text-[14rem] text-lime-400 drop-shadow-[6px_6px_0px_#ec4899] transform -rotate-6 select-none leading-none" style={{ WebkitTextStroke: '3px #1c1917' }}>
              3
            </div>
            
            <div className="absolute -bottom-4 -right-8 text-5xl text-orange-400 animate-bounce">✦</div>
          </div>
        );
      case 2:
        return (
          <div className="relative animate-wiggle">
             <div className="absolute top-0 -left-20 text-6xl text-purple-400 animate-pulse opacity-60 z-0">✱</div>
             <div className="absolute -bottom-8 -right-16 bg-pink-400 text-white px-3 py-1 transform -rotate-6 border-2 border-stone-800 z-20 font-black text-xs tracking-widest shadow-[4px_4px_0px_#1c1917]">
              FOCUSING
            </div>
            
            {/* Number 2 - Hot Pink on Light */}
            <div className="relative z-10 font-black italic text-[12rem] md:text-[14rem] text-fuchsia-500 drop-shadow-[6px_6px_0px_#facc15] transform rotate-3 select-none leading-none" style={{ WebkitTextStroke: '3px #1c1917' }}>
              2
            </div>
            <div className="absolute top-10 -right-12 text-5xl text-blue-400 animate-spin-slow">✹</div>
          </div>
        );
      case 1:
        return (
          <div className="relative animate-wiggle">
             <div className="absolute -top-10 right-0 text-7xl text-yellow-400 animate-ping opacity-40 z-0">●</div>
             <div className="absolute top-1/2 -left-24 bg-cyan-300 text-stone-900 px-4 py-1 transform rotate-6 border-2 border-stone-800 z-20 font-black text-xs tracking-widest shadow-[4px_4px_0px_#f43f5e]">
              READY
            </div>
            
            {/* Number 1 - Cyan/Blue on Light */}
            <div className="relative z-10 font-black italic text-[12rem] md:text-[14rem] text-cyan-400 drop-shadow-[6px_6px_0px_#8b5cf6] transform -rotate-2 select-none leading-none" style={{ WebkitTextStroke: '3px #1c1917' }}>
              1
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-warm-50 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Texture/Patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fb923c 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {phase === 'FOCUS' && (
        <div className="relative z-10 transform scale-75 md:scale-100 transition-transform duration-300">
           {getPopAcidNumberContent(countdown)}
        </div>
      )}

      {phase === 'FLASH' && (
        <div className="absolute inset-0 bg-white animate-flash z-50"></div>
      )}

      {phase === 'DEVELOPING' && (
        <div className="flex flex-col items-center animate-fade-in">
           <div className="text-6xl mb-6 animate-bounce">📸</div>
           <h2 className="text-2xl font-bold text-stone-700 tracking-widest uppercase mb-2">显影中...</h2>
           <p className="text-stone-400 text-sm animate-pulse">正在绘制你的专属好运...</p>
           
           {/* Loading Bar */}
           <div className="w-48 h-2 bg-stone-200 rounded-full mt-6 overflow-hidden">
             <div className="h-full bg-gradient-to-r from-orange-400 to-rose-400 w-full animate-progress-indeterminate"></div>
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        .animate-wiggle { animation: wiggle 0.3s ease-in-out infinite; }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }

        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash { animation: flash 0.2s ease-out forwards; }

        @keyframes progress-indeterminate {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-progress-indeterminate {
            animation: progress-indeterminate 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;
