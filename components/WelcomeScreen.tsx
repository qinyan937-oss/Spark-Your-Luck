
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface WelcomeScreenProps {
  onStart: (profile: UserProfile) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [mbti, setMbti] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && birthDate) {
      onStart({ name, birthDate, mbti: mbti || undefined });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-fade-in relative overflow-hidden">
      <div className="mb-8 relative z-0">
        {/* Decorative Emojis - Moved to background layer (-z-10) and resized to text-xl */}
        <div className="absolute -top-6 -left-6 text-xl animate-float opacity-60 -z-10">✨</div>
        <div className="absolute -bottom-4 -right-4 text-xl animate-float opacity-60 -z-10" style={{ animationDelay: '1.5s' }}>🌸</div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-orange-500 mb-2 tracking-wide relative z-10 flex flex-col items-center">
          <span>幸运点点</span>
          <span className="text-3xl font-handwriting text-orange-300/90 mt-1 font-normal transform -rotate-2">Lucky</span>
        </h1>
        <p className="text-stone-500 text-lg font-medium relative z-10 mt-2">
          收集你的每一份小幸运
        </p>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm p-8 rounded-[2rem] shadow-xl border-2 border-white relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
            <label className="block text-stone-600 font-bold mb-2 ml-1">怎么称呼你呀？</label>
            <input
              type="text"
              required
              placeholder="请输入你的昵称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl bg-orange-50 border-2 border-orange-100 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all text-stone-700 placeholder-stone-400"
            />
          </div>

          <div className="text-left">
            <label className="block text-stone-600 font-bold mb-2 ml-1">破壳日是哪天？</label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl bg-orange-50 border-2 border-orange-100 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all text-stone-700"
            />
          </div>

          <div className="text-left">
            <label className="block text-stone-600 font-bold mb-2 ml-1">MBTI (选填)</label>
            <input
              type="text"
              placeholder="例如: ENFP (不知道也没关系哦)"
              value={mbti}
              onChange={(e) => setMbti(e.target.value.toUpperCase())}
              maxLength={4}
              className="w-full px-5 py-3 rounded-2xl bg-orange-50 border-2 border-orange-100 focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all text-stone-700 placeholder-stone-400"
            />
          </div>

          <button
            type="submit"
            disabled={!name || !birthDate}
            className="w-full py-4 mt-4 bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white font-bold text-xl rounded-2xl shadow-lg transform transition hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            开启幸运之旅 🚀
          </button>
        </form>
      </div>
      <p className="mt-8 text-stone-400 text-sm max-w-xs relative z-10">
        在这里，我们只谈美好。所有的解读都是为了给你满满的安全感。 ❤️
      </p>
    </div>
  );
};

export default WelcomeScreen;
