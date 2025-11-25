
import React, { useState, useRef } from 'react';
import { audio } from '../services/audioService';

interface VerificationGameProps {
  onComplete: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const VerificationGame: React.FC<VerificationGameProps> = ({ onComplete }) => {
  const [step, setStep] = useState<'MATH' | 'CLICKER'>('MATH');
  
  // Math Challenge State
  const [mathProblem] = useState(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { a, b, answer: a + b };
  });
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');

  // Clicker Game State
  const [clicks, setClicks] = useState(0);
  // Target clicks: Random odd number between 15 and 31
  const [targetClicks] = useState(() => 15 + (Math.floor(Math.random() * 9) * 2));
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const [buttonScale, setButtonScale] = useState(1);

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAnswer) === mathProblem.answer) {
      audio.playPop(); // Sound feedback
      setStep('CLICKER');
      setError('');
    } else {
      // Error feedback could be a distinct sound, but silence/visual is often enough
      if (navigator.vibrate) navigator.vibrate(200); // Haptic Error
      setError('哎呀，再算算看哦～ 🌸');
      setUserAnswer('');
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (clicks >= targetClicks) return;

    // Haptic Feedback (if supported on mobile)
    if (navigator.vibrate) navigator.vibrate(10);
    
    // Audio Feedback
    audio.playPop();

    const newClicks = clicks + 1;
    setClicks(newClicks);
    
    // Button bump effect
    setButtonScale(0.9);
    setTimeout(() => setButtonScale(1), 100);

    // Create Particle
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const texts = ['+1', '✨', '❤️', 'Energy!', '🌟', 'UP!'];
    const colors = ['text-yellow-300', 'text-white', 'text-rose-200', 'text-orange-200'];
    
    const newParticle: Particle = {
      id: Date.now(),
      x,
      y,
      text: texts[Math.floor(Math.random() * texts.length)],
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    setParticles(prev => [...prev, newParticle]);

    // Remove particle after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 800);

    if (newClicks >= targetClicks) {
      audio.playSparkle(); // Completion Sound
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Completion Haptic
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  const progress = Math.min((clicks / targetClicks) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-50/95 backdrop-blur-sm p-4 animate-fade-in overflow-hidden">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 border-4 border-orange-100 text-center relative z-10">
        
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        {step === 'MATH' ? (
          <div className="relative z-10 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-stone-700 mb-2">你是我的小幸运吗？</h2>
            <p className="text-stone-500 mb-6">简单确认一下，防止好运迷路～</p>
            
            <div className="text-4xl font-bold text-orange-500 mb-8 font-mono tracking-wider bg-orange-50 py-6 rounded-2xl border border-orange-100 transform rotate-1">
              {mathProblem.a} + {mathProblem.b} = ?
            </div>

            <form onSubmit={handleMathSubmit}>
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="在此输入答案"
                className="w-full text-center text-2xl px-4 py-4 rounded-2xl border-2 border-orange-200 focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100/50 mb-4 text-stone-700 bg-white"
                autoFocus
              />
              {error && <p className="text-rose-400 text-sm mb-4 animate-bounce font-bold">{error}</p>}
              
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-orange-400 to-rose-400 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 active:scale-95"
              >
                确认 ✨
              </button>
            </form>
          </div>
        ) : (
          <div className="relative z-10 animate-fade-in select-none">
            <h2 className="text-2xl font-bold text-orange-600 mb-1">注入能量</h2>
            <p className="text-stone-400 text-sm mb-6">点击按钮收集来自宇宙的祝福</p>

            {/* Progress Bar */}
            <div className="w-full h-6 bg-stone-100 rounded-full mb-8 overflow-hidden border border-stone-200 shadow-inner relative">
               <div className="absolute inset-0 flex items-center justify-center z-10 text-[10px] font-bold text-stone-400 tracking-widest">
                  ENERGY LOADING...
               </div>
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-rose-400 transition-all duration-200 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-20 animate-pulse"></div>
              </div>
            </div>

            <div className="relative h-48 w-full flex items-center justify-center">
              <button
                onClick={handleClick}
                disabled={clicks >= targetClicks}
                style={{ transform: `scale(${buttonScale})` }}
                className={`
                  relative z-20 w-40 h-40 rounded-full text-white font-black text-2xl shadow-[0_10px_40px_-10px_rgba(249,115,22,0.5)] transition-all duration-100
                  flex flex-col items-center justify-center gap-2 touch-manipulation border-4 border-white/30
                  ${clicks >= targetClicks 
                    ? 'bg-green-400 cursor-default' 
                    : 'bg-gradient-to-br from-orange-400 to-rose-500 hover:brightness-110 active:brightness-90'}
                `}
              >
                {clicks >= targetClicks ? (
                  <span className="animate-bounce">🎉 完成!</span>
                ) : (
                  <>
                    <span className="text-4xl filter drop-shadow-md">⚡️</span>
                    <span className="text-lg opacity-90">点我充能</span>
                  </>
                )}
              </button>

              {/* Particles */}
              {particles.map(p => (
                <div
                  key={p.id}
                  className={`absolute pointer-events-none font-bold text-xl animate-float-up ${p.color}`}
                  style={{ 
                    left: '50%', 
                    top: '50%',
                    transform: `translate(${p.x - 80}px, ${p.y - 80}px)`, // Center roughly relative to button center
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {p.text}
                </div>
              ))}
            </div>
            
            <p className="mt-8 text-stone-400 font-mono text-sm bg-stone-50 inline-block px-4 py-1 rounded-full">
              {Math.min(clicks, targetClicks)} / {targetClicks}
            </p>
          </div>
        )}
      </div>
      
      {/* Custom animation for particles */}
      <style>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translate(var(--tw-translate-x), var(--tw-translate-y)) scale(1); }
          100% { opacity: 0; transform: translate(var(--tw-translate-x), calc(var(--tw-translate-y) - 50px)) scale(1.5); }
        }
        .animate-float-up {
          animation: float-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default VerificationGame;
