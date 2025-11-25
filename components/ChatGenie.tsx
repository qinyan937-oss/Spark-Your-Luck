
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { createGenieChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import { audio } from '../services/audioService';

const ChatGenie: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: '嗨！我是你的专属好运小精灵。有什么心事都可以告诉我哦，我会一直陪着你～ ✨', timestamp: Date.now() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Use a ref to persist the chat session across renders
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createGenieChat();
    }
  }, []);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    audio.playPop();
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatSessionRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    
    // Play user sent sound
    audio.playPop();

    try {
      const result: GenerateContentResponse = await chatSessionRef.current.sendMessage({
        message: userMsg.text
      });
      
      const responseText = result.text || "抱歉，我刚刚走神啦，能再说一遍吗？🌸";

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
      
      // Play received message sound
      audio.playPing();

    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "哎呀，魔法信号好像中断了，请稍后再试一下～ 🌟",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center
          ${isOpen ? 'bg-rose-400 rotate-90' : 'bg-gradient-to-tr from-yellow-300 to-orange-400 animate-bounce'}`}
      >
        <span className="text-3xl">{isOpen ? '✖️' : '🧚‍♀️'}</span>
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-[2rem] shadow-2xl z-40 overflow-hidden transition-all duration-300 origin-bottom-right flex flex-col border-4 border-orange-100
          ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center">
           <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center mr-3 shadow-inner text-xl">
             🧚‍♀️
           </div>
           <div>
             <h3 className="font-bold text-stone-700">好运小精灵</h3>
             <p className="text-xs text-stone-400">只说好听的给你听 ❤️</p>
           </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 scrollbar-hide">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-orange-400 text-white rounded-tr-none' 
                    : 'bg-warm-100 text-stone-700 rounded-tl-none'}`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-warm-50 p-3 rounded-2xl rounded-tl-none text-stone-400 text-xs animate-pulse">
                小精灵正在思考... ✨
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-100">
          <div className="flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="说点什么吧..."
              className="flex-1 bg-transparent focus:outline-none text-sm text-stone-700 placeholder-stone-400"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="ml-2 w-8 h-8 flex items-center justify-center bg-orange-400 rounded-full text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatGenie;
    