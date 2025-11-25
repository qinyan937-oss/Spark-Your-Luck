
import React, { useState, useRef, useEffect } from 'react';
import { FortuneResult, UserProfile } from '../types';
import FortuneCard from './FortuneCard';
import { audio } from '../services/audioService';

// Declare html2canvas globally as it is loaded via script tag
declare global {
  interface Window {
    html2canvas: any;
  }
}

interface DashboardProps {
  user: UserProfile;
  fortune: FortuneResult;
  onReset: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, fortune, onReset }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Tarot Flip State
  const [isTarotFlipped, setIsTarotFlipped] = useState(false);

  // Fallback Detection Effect
  useEffect(() => {
    if (fortune.isFallback) {
      setToastMessage("🔮 网络开小差了，已为您切换到基础星盘模式 (结果依然准确哦)");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  }, [fortune.isFallback]);

  // Celebrity Match Swiping State
  const [matchIndex, setMatchIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'right' | 'left' | null>(null);
  
  // Ensure we have an array (handle backward compatibility if API fails partially)
  const matches = Array.isArray(fortune.celebrityMatch) ? fortune.celebrityMatch : [fortune.celebrityMatch];
  const currentMatch = matches[matchIndex];

  const handleNextMatch = () => {
    audio.playSwoosh();
    if (navigator.vibrate) navigator.vibrate(10);
    
    setSwipeDirection('right'); // Visual cues: Right = Next/New
    setTimeout(() => {
      setMatchIndex((prev) => (prev + 1) % matches.length);
      setSwipeDirection(null);
    }, 300); // Wait for animation
  };

  const handleLikeMatch = () => {
    audio.playSparkle();
    if (navigator.vibrate) navigator.vibrate([10, 30]);
    // Visual only for now, could save to favorites later
  };

  const handleTarotFlip = () => {
    if (!isTarotFlipped) {
      audio.playSwoosh();
      if (navigator.vibrate) navigator.vibrate(20);
      setIsTarotFlipped(true);
    }
  };

  const handleShare = async () => {
    audio.playPop();

    // 1. Random "Lucky Hook" phrases to make sharing more fun
    const luckyHooks = [
      "你今天的运气好像开了挂！🚀",
      "全宇宙的星星都在为你眨眼睛 ✨",
      "检测到你的快乐指数正在飙升 📈",
      "今日运势：宜快乐，宜暴富，宜被爱 💖",
      "这是什么神仙运气呀？😍",
      "快来看，这里有一份满分好运试卷 💯",
      "滴！你有一份来自宇宙的快递请查收 📦",
      "没想到吧，好运竟然藏在这里！🎉"
    ];
    const randomHook = luckyHooks[Math.floor(Math.random() * luckyHooks.length)];

    // 2. Construct the personalized share text
    const shareText = `✨ 幸运点点 · 好运投递 📨\n\n${randomHook}\n\n👤 捕捉到一只正在发光的 ${user.name} ：\n\n🌞 能量金句：${fortune.dailyAffirmation}\n💘 今日最配：${currentMatch.name} (${currentMatch.romanticVibe})\n🔮 宇宙信号：${fortune.astralChart.keyAspect}\n🥑 治愈时刻：${fortune.luckyFood.food}\n\n👇 点击链接，领取你的专属好运（真的很准哦）：\n${window.location.href}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: '幸运点点 - 你的专属小幸运',
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
             copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      const isPreview = ['localhost', '127.0.0.1', 'bolt.new', 'stackblitz', 'webcontainer'].some(domain => window.location.hostname.includes(domain));
      if (isPreview) {
        setToastMessage("已复制！⚠️ 这是预览链接，请先点击右上角「部署」发布后，朋友才能访问哦！");
      } else {
        setToastMessage("好运文案已复制，快去分享吧！✨");
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const handleSaveImage = async () => {
    if (!dashboardRef.current || !window.html2canvas) return;
    
    audio.playShutter();
    if (navigator.vibrate) navigator.vibrate(50);

    setIsSaving(true);
    setToastMessage("正在生成完整好运长图... 📸");
    setShowToast(true);

    // Save current scroll position
    const originalScrollPos = window.scrollY;

    try {
      // 1. Scroll to top to ensure no viewport clipping issues
      window.scrollTo(0, 0);
      
      // 2. Wait a brief moment for any layout repaints and images to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = dashboardRef.current;
      
      // Calculate full scroll height (including potential off-screen content)
      // We use scrollHeight to get the full height of the container
      const fullHeight = element.scrollHeight;

      // 3. Capture with explicit height settings to force full page render
      const canvas = await window.html2canvas(element, {
        useCORS: true,
        scale: 2, // High resolution (Retina)
        backgroundColor: '#fff7ed', // Ensure background color matches theme
        height: fullHeight + 80, // Full height + bottom padding buffer
        windowHeight: fullHeight + 80, // Tell pseudo-browser window is tall enough
        scrollY: 0, // Force top alignment
        x: 0,
        y: 0,
        ignoreElements: (el: Element) => el.hasAttribute('data-html2canvas-ignore')
      });

      // 4. Restore user's scroll position
      window.scrollTo(0, originalScrollPos);

      // 5. Generate download
      const image = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement('a');
      link.href = image;
      link.download = `幸运点点_好运报告_${user.name}_${new Date().toISOString().split('T')[0]}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setToastMessage("完整长图已保存到相册！✨");
      setTimeout(() => setShowToast(false), 3000);

    } catch (error) {
      console.error("Screenshot failed:", error);
      setToastMessage("保存失败，请重试或手动截图 😿");
      window.scrollTo(0, originalScrollPos); // Restore scroll on error too
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-8 md:px-8 max-w-7xl mx-auto relative">
      {/* Toast Notification */}
      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 w-full max-w-md px-4 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-stone-800/95 backdrop-blur text-white px-6 py-4 rounded-2xl shadow-xl flex items-start md:items-center border border-stone-700">
          <span className="mr-3 text-xl">{isSaving ? '📸' : '✨'}</span>
          <span className="text-sm md:text-base leading-tight whitespace-pre-wrap">{toastMessage}</span>
        </div>
      </div>

      {/* Capture Container - Wraps everything we want in the image */}
      <div 
        ref={dashboardRef} 
        className="bg-warm-plaid relative -mx-4 px-4 py-8 md:p-8 md:rounded-[2.5rem] overflow-hidden"
      >
        {/* Floating Ambient Particles (CSS Animation) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" data-html2canvas-ignore="true">
           {[...Array(12)].map((_, i) => (
             <div 
               key={i} 
               className="particle"
               style={{
                 left: `${Math.random() * 100}%`,
                 top: '110%',
                 width: `${Math.random() * 8 + 4}px`,
                 height: `${Math.random() * 8 + 4}px`,
                 animationDelay: `${Math.random() * 5}s`,
                 animationDuration: `${10 + Math.random() * 10}s`
               }}
             />
           ))}
        </div>

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4 relative z-10">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-stone-800">
              你好呀，<span className="text-orange-500">{user.name}</span> ✨
            </h1>
            <p className="text-stone-500 mt-1">今天也是被好运包围的一天！</p>
          </div>
          
          {/* Action Buttons - Ignored in screenshot */}
          <div className="flex gap-2 flex-wrap justify-center" data-html2canvas-ignore="true">
            <button 
              onClick={handleSaveImage}
              disabled={isSaving}
              className="px-4 py-2 bg-stone-800 text-white font-bold rounded-full text-sm hover:shadow-lg transform hover:scale-105 transition-all flex items-center shadow-stone-300"
            >
              <span className="mr-1">📸</span> 留住好运
            </button>
            <button 
              onClick={handleShare}
              className="px-4 py-2 bg-gradient-to-r from-orange-400 to-rose-400 text-white font-bold rounded-full text-sm hover:shadow-lg transform hover:scale-105 transition-all flex items-center"
            >
              <span className="mr-1">💌</span> 分享好运
            </button>
            <button 
              onClick={onReset}
              className="px-4 py-2 bg-white text-stone-500 rounded-full text-sm hover:bg-stone-50 border border-stone-200 transition-colors"
            >
              重测
            </button>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 relative z-10">
          
          {/* Polaroid Style Affirmation Card */}
          <div className="md:col-span-2 lg:col-span-3 flex justify-center mb-8 mt-4">
            <div className="relative group perspective">
               
              {/* Beads Decoration - Hanging from top */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-20 z-20 pointer-events-none flex flex-col items-center">
                 {/* String */}
                 <div className="absolute top-0 w-[2px] h-10 bg-stone-300"></div>
                 {/* Beads */}
                 <div className="absolute top-10 flex items-center justify-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-rose-400 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm"></div>
                    <div className="w-5 h-5 rounded-full bg-blue-300 shadow-sm border-2 border-white"></div>
                    <div className="w-3 h-3 rounded-full bg-green-300 shadow-sm"></div>
                    <div className="w-4 h-4 rounded-full bg-purple-400 shadow-sm"></div>
                 </div>
                 {/* "Read with me" text */}
                 <div className="absolute top-16 whitespace-nowrap text-[10px] md:text-xs text-stone-400 font-medium tracking-widest bg-white/80 px-2 py-0.5 rounded-full backdrop-blur-sm border border-stone-100 shadow-sm">
                    请跟我一起读
                 </div>
              </div>

              {/* Sparkles */}
              <div className="absolute -top-4 -right-8 text-2xl animate-pulse">✨</div>
              <div className="absolute bottom-10 -left-6 text-xl animate-pulse delay-75">✨</div>

              {/* The Polaroid */}
              <div className="bg-white p-4 pb-16 shadow-xl transform -rotate-1 hover:rotate-0 transition-transform duration-500 max-w-2xl w-full mx-auto relative rounded-sm border border-stone-100 mt-6">
                
                {/* Inner Photo Area */}
                <div className="bg-gradient-to-tr from-orange-100/50 via-rose-50/50 to-blue-50/50 h-64 md:h-80 w-full flex flex-col items-center justify-center p-8 relative overflow-hidden border border-stone-100/50">
                  <div className="absolute top-0 right-0 text-9xl opacity-5 select-none">☀️</div>
                  <div className="absolute bottom-0 left-0 text-9xl opacity-5 select-none">✨</div>
                  
                  <p className="text-stone-400 font-semibold mb-6 tracking-[0.2em] uppercase text-xs z-10 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
                    Today's Energy
                  </p>
                  <h2 className="text-4xl md:text-5xl text-stone-700 leading-snug font-handwriting z-10 text-center drop-shadow-sm px-4">
                    "{fortune.dailyAffirmation}"
                  </h2>
                </div>
                
                {/* Handwritten Note at bottom */}
                <div className="absolute bottom-5 right-6 font-handwriting text-stone-500 text-2xl transform -rotate-2">
                   From 幸运点点
                </div>
                <div className="absolute bottom-5 left-6 font-mono text-stone-300 text-xs tracking-wider">
                   {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Deep Astral Chart Analysis */}
          <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-br from-indigo-50 to-purple-50 border-l-4 border-purple-300 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 text-xl">🔮</div>
              <h3 className="text-xl font-bold text-purple-800">深度星盘解读</h3>
            </div>
            <div className="text-stone-700 leading-relaxed text-lg font-handwriting">
              <p className="mb-6 text-2xl">{fortune.astralChart.analysis}</p>
              
              <div className="flex flex-wrap gap-3">
                 <div className="flex items-center text-purple-600 text-sm font-sans font-medium bg-white/60 px-3 py-1 rounded-full border border-purple-100 shadow-sm">
                  <span>🪐 星象指引：</span>
                  <span className="ml-1">{fortune.astralChart.planetaryInfluence}</span>
                </div>
                <div className="flex items-center text-indigo-600 text-sm font-sans font-medium bg-white/60 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">
                  <span>📐 能量相位：</span>
                  <span className="ml-1">{fortune.astralChart.keyAspect}</span>
                </div>
                 <div className="flex items-center text-fuchsia-600 text-sm font-sans font-medium bg-white/60 px-3 py-1 rounded-full border border-fuchsia-100 shadow-sm">
                  <span>🏠 幸运宫位：</span>
                  <span className="ml-1">{fortune.astralChart.luckyHouse}</span>
                </div>
              </div>

            </div>
          </div>
          
          {/* New Feature: Tinder-Style Celebrity Match Swiping */}
          <div className="md:col-span-2 lg:col-span-1">
             <div 
               className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-500 border-l-4 border-l-rose-400 relative overflow-hidden h-full flex flex-col"
               style={{ minHeight: '360px' }}
             >
                <div className="flex items-center mb-4 shrink-0">
                  <span className="text-3xl mr-3">💘</span>
                  <h3 className="text-xl font-bold text-rose-800">今日最配名人</h3>
                </div>

                {/* Card Container for Swipe Animation */}
                <div className="relative flex-1 w-full">
                  <div 
                    className={`absolute inset-0 transition-all duration-300 ease-out transform ${
                      swipeDirection === 'right' ? 'translate-x-full rotate-12 opacity-0' : 'translate-x-0 rotate-0 opacity-100'
                    }`}
                  >
                     <div className="bg-gradient-to-b from-rose-50 to-white rounded-2xl p-4 border border-rose-100 h-full flex flex-col shadow-inner">
                        {/* Avatar / Initials */}
                        <div className="flex justify-center mb-3">
                           <div className="w-20 h-20 bg-rose-200 rounded-full flex items-center justify-center text-3xl shadow-sm border-4 border-white">
                              {currentMatch.name.slice(0, 1)}
                           </div>
                        </div>

                        {/* Info */}
                        <div className="text-center flex-1 flex flex-col">
                           <div className="text-2xl font-bold text-rose-500 mb-0 font-handwriting">{currentMatch.name}</div>
                           <div className="text-xs text-rose-300 font-bold uppercase tracking-widest mb-2">{currentMatch.desc}</div>
                           
                           <div className="bg-white/80 rounded-lg p-2 text-left shadow-sm mb-2 flex-1 overflow-y-auto scrollbar-hide">
                             <p className="text-xs text-stone-600 leading-snug">"{currentMatch.reason}"</p>
                           </div>

                           <div className="flex items-center justify-center mt-auto shrink-0 pt-2">
                              <span className="text-xs bg-rose-100 text-rose-500 px-3 py-1 rounded-full border border-rose-200 font-bold">
                                 #{currentMatch.romanticVibe}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Social App Style Buttons */}
                <div className="flex justify-center gap-6 mt-4 shrink-0" data-html2canvas-ignore="true">
                   <button 
                     onClick={handleNextMatch}
                     className="w-12 h-12 rounded-full bg-white border-2 border-stone-200 text-stone-400 text-xl shadow-sm hover:scale-110 hover:border-red-300 hover:text-red-400 hover:bg-red-50 transition-all flex items-center justify-center"
                     title="换一个"
                   >
                     ✖️
                   </button>
                   <button 
                     onClick={handleLikeMatch}
                     className="w-12 h-12 rounded-full bg-rose-400 text-white text-xl shadow-lg hover:scale-110 hover:bg-rose-500 transition-all flex items-center justify-center animate-pulse"
                   >
                     ❤️
                   </button>
                </div>
             </div>
          </div>

          {/* Tarot Flip Card */}
          <div className="perspective-1000 h-full w-full min-h-[360px]" onClick={handleTarotFlip}>
             <div className={`relative w-full h-full transition-all duration-700 transform-style-3d cursor-pointer ${isTarotFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front (Hidden initially) - The Content */}
                <div className="rotate-y-180 h-full w-full backface-hidden">
                   <FortuneCard title="今日幸运塔罗" icon="🃏" colorTheme="purple" delay={400} className="h-full flex flex-col">
                      <div className="flex flex-col h-full">
                         <div className="flex-1 flex flex-col justify-center text-center">
                            <p className="font-bold text-2xl text-purple-700 mb-2">{fortune.tarot.cardName}</p>
                            <p className="text-base italic mb-4 text-stone-600">"{fortune.tarot.meaning}"</p>
                         </div>
                         <div className="mt-auto">
                            <p className="text-sm bg-purple-50 p-3 rounded-xl text-purple-600 border border-purple-100 shadow-sm">💡 指引: {fortune.tarot.advice}</p>
                         </div>
                      </div>
                   </FortuneCard>
                </div>

                {/* Back (Visible initially) - The Card Back */}
                <div className="absolute inset-0 backface-hidden h-full w-full">
                   <div className="bg-purple-900 h-full rounded-3xl p-6 shadow-md border-4 border-purple-300 flex flex-col items-center justify-center text-purple-200 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                      {/* Mystic Pattern */}
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #d8b4fe 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                      <div className="w-24 h-32 border-2 border-purple-400 rounded-lg flex items-center justify-center mb-2 z-10 bg-purple-800/50 backdrop-blur-sm">
                         <span className="text-4xl animate-pulse">🔮</span>
                      </div>
                      <p className="text-sm font-bold tracking-widest z-10">点击翻牌</p>
                      <p className="text-[10px] text-purple-400 mt-1 z-10">接收宇宙指引</p>
                   </div>
                </div>

             </div>
          </div>

          <FortuneCard title={`${fortune.zodiac.sign}的好运`} icon="🌟" colorTheme="orange" delay={200} className="h-full">
            <div className="flex flex-col h-full justify-center">
              <p className="font-bold text-lg mb-2">{fortune.zodiac.luckyTrait}</p>
              <p className="text-sm">{fortune.zodiac.compliment}</p>
            </div>
          </FortuneCard>

          <FortuneCard title={`属相·${fortune.chineseZodiac.animal}`} icon="🐲" colorTheme="yellow" delay={300} className="h-full">
            <div className="flex flex-col h-full justify-center">
              <p className="font-bold text-lg mb-2">{fortune.chineseZodiac.secretStrength}</p>
              <p className="text-sm">{fortune.chineseZodiac.compliment}</p>
            </div>
          </FortuneCard>

          <FortuneCard title={`人格魅力 (${fortune.mbtiAnalysis.type})`} icon="🧠" colorTheme="blue" delay={500} className="h-full">
            <div className="flex flex-col h-full justify-center">
              <p className="font-bold text-lg mb-2">天赋：{fortune.mbtiAnalysis.superpower}</p>
              <p className="text-sm">{fortune.mbtiAnalysis.socialVibe}</p>
            </div>
          </FortuneCard>

          <FortuneCard title="本命星宿" icon="🌌" colorTheme="yellow" delay={600} className="h-full">
             <div className="flex flex-col h-full justify-center">
               <p className="font-bold text-lg mb-2">{fortune.constellation.starName}</p>
               <p className="text-sm">{fortune.constellation.guidance}</p>
             </div>
          </FortuneCard>

          <FortuneCard title="幸运加持" icon="🍀" colorTheme="orange" delay={700} className="h-full">
             <div className="grid grid-cols-3 gap-2 text-center mt-auto h-full items-center">
                <div className="bg-orange-50 p-2 rounded-xl h-full flex flex-col justify-center">
                   <div className="text-xs text-stone-400">颜色</div>
                   <div className="font-bold text-stone-700">{fortune.luckyItems.color}</div>
                </div>
                <div className="bg-orange-50 p-2 rounded-xl h-full flex flex-col justify-center">
                   <div className="text-xs text-stone-400 mb-0.5">生命灵数</div>
                   <div className="font-bold text-stone-800 text-xl leading-none">{fortune.luckyItems.number}</div>
                   <div className="text-[10px] text-orange-400 scale-90 origin-center mt-1 font-medium">命定能量</div>
                </div>
                <div className="bg-orange-50 p-2 rounded-xl h-full flex flex-col justify-center">
                   <div className="text-xs text-stone-400">小物</div>
                   <div className="font-bold text-stone-700">{fortune.luckyItems.item}</div>
                </div>
             </div>
          </FortuneCard>

          <FortuneCard title="今日幸运食物" icon="🥐" colorTheme="yellow" delay={750} className="h-full">
            <div className="flex flex-col h-full justify-center">
              <p className="font-bold text-lg mb-2 text-stone-800">{fortune.luckyFood.food}</p>
              <p className="text-sm text-stone-600">😋 {fortune.luckyFood.reason}</p>
            </div>
          </FortuneCard>

          <FortuneCard title="今日幸运动作" icon="🧘‍♀️" colorTheme="rose" delay={780} className="h-full">
            <div className="flex flex-col h-full justify-center">
              <p className="font-bold text-lg mb-2 text-stone-800">{fortune.luckyActivity.action}</p>
              <p className="text-sm text-stone-600">✨ {fortune.luckyActivity.benefit}</p>
            </div>
          </FortuneCard>

          <FortuneCard title="今日治愈影单" icon="🎬" colorTheme="purple" delay={800} className="h-full">
            <div className="flex flex-col h-full justify-center">
              <p className="font-bold text-lg mb-2 text-stone-800">《{fortune.dailyMovie.title}》</p>
              <p className="text-sm text-stone-600">{fortune.dailyMovie.reason}</p>
            </div>
          </FortuneCard>

          <FortuneCard title="今日能量BGM" icon="🎧" colorTheme="blue" delay={900} className="h-full">
            <div className="flex flex-col h-full justify-center">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs shrink-0">🎵</div>
                <div>
                   <p className="font-bold text-base text-stone-800 leading-none">{fortune.dailyMusic.title}</p>
                   <p className="text-xs text-stone-400">{fortune.dailyMusic.artist}</p>
                </div>
              </div>
              <p className="text-sm text-stone-600">{fortune.dailyMusic.vibe}</p>
            </div>
          </FortuneCard>

          <FortuneCard title="今日合拍动物" icon="🐾" colorTheme="green" delay={950} className="h-full">
            <div className="flex flex-col h-full justify-center">
              <p className="font-bold text-lg mb-1 text-stone-800">{fortune.compatibleAnimal.animal}</p>
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">{fortune.compatibleAnimal.trait}</p>
              <p className="text-sm text-stone-600">{fortune.compatibleAnimal.reason}</p>
            </div>
          </FortuneCard>

        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center pb-8 relative z-10">
          <p className="text-stone-300 text-sm font-handwriting text-xl">幸运点点 · Lucky</p>
        </div>

        {/* Watermark for screenshot only (default hidden, can be styled if needed) */}
      </div>
    </div>
  );
};

export default Dashboard;
