
import React, { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard';
import LoadingOverlay from './components/LoadingOverlay';
import ChatGenie from './components/ChatGenie';
import VerificationGame from './components/VerificationGame';
import { UserProfile, FortuneResult, AppState } from './types';
import { generateFortuneReport } from './services/geminiService';
import { audio } from './services/audioService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fortuneData, setFortuneData] = useState<FortuneResult | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize audio on first interaction via start
  const handleWelcomeSubmit = (profile: UserProfile) => {
    audio.init(); // Browser requires user gesture
    audio.playPop(); // Feedback
    setUserProfile(profile);
    setAppState(AppState.VERIFICATION);
  };

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    // If we just unmuted and we are in Dashboard, restart music
    if (!muted && appState === AppState.DASHBOARD) {
      audio.startBackgroundMusic();
    }
  };

  // Step 2: User completes the game -> Start fetching
  const handleVerificationComplete = async () => {
    if (!userProfile) return;
    
    setAppState(AppState.LOADING);
    
    // Minimum loading time for the animation to be seen
    const startTime = Date.now();
    
    try {
      const data = await generateFortuneReport(userProfile);
      setFortuneData(data);
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 2000 - elapsedTime);

      setTimeout(() => {
        setAppState(AppState.DASHBOARD);
        audio.playSparkle(); // Success sound entering dashboard
        audio.startBackgroundMusic(); // Start ambient BGM
      }, remainingTime);
      
    } catch (error) {
      console.error("Failed to generate fortune", error);
      // In a real app, handle error gracefully. 
      setAppState(AppState.WELCOME);
    }
  };

  const handleReset = () => {
    audio.stopBackgroundMusic(); // Stop BGM
    audio.playSwoosh();
    setAppState(AppState.WELCOME);
    setUserProfile(null);
    setFortuneData(null);
  };

  return (
    <div className="min-h-screen bg-warm-plaid text-stone-800 font-sans selection:bg-orange-200 relative">
      
      {/* Sound Toggle */}
      <button 
        onClick={handleToggleMute}
        className="fixed top-4 left-4 z-50 w-10 h-10 bg-white/50 backdrop-blur rounded-full flex items-center justify-center border border-white shadow-sm hover:bg-white transition-all text-xl"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      {appState === AppState.WELCOME && (
        <WelcomeScreen onStart={handleWelcomeSubmit} />
      )}

      {appState === AppState.VERIFICATION && (
        <VerificationGame onComplete={handleVerificationComplete} />
      )}

      {appState === AppState.LOADING && (
        <LoadingOverlay />
      )}

      {appState === AppState.DASHBOARD && userProfile && fortuneData && (
        <>
          <Dashboard 
            user={userProfile} 
            fortune={fortuneData} 
            onReset={handleReset} 
          />
          <ChatGenie />
        </>
      )}
      
      {/* Add keyframes for custom animations used in components */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 1s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
