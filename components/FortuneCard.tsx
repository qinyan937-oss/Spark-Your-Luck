
import React from 'react';

interface FortuneCardProps {
  title: string;
  icon: string;
  colorTheme: 'orange' | 'rose' | 'purple' | 'yellow' | 'blue' | 'green';
  children: React.ReactNode;
  delay?: number;
}

const FortuneCard: React.FC<FortuneCardProps> = ({ title, icon, colorTheme, children, delay = 0 }) => {
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    rose: 'bg-rose-100 text-rose-800 border-rose-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const borderClasses = {
     orange: 'border-l-4 border-l-orange-400',
     rose: 'border-l-4 border-l-rose-400',
     purple: 'border-l-4 border-l-purple-400',
     yellow: 'border-l-4 border-l-yellow-400',
     blue: 'border-l-4 border-l-blue-400',
     green: 'border-l-4 border-l-emerald-400',
  };

  return (
    <div 
      className={`bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-500 transform opacity-0 animate-fade-in-up ${borderClasses[colorTheme]}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center mb-4">
        <span className="text-3xl mr-3">{icon}</span>
        <h3 className={`text-xl font-bold ${colorClasses[colorTheme].split(' ')[1]}`}>{title}</h3>
      </div>
      <div className="text-stone-600 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default FortuneCard;
