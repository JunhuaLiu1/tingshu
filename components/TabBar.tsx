import React from 'react';
import { Home, Search, Play, Clock, User } from 'lucide-react';
import { Tab } from '../types';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: Tab.HOME, icon: Home, label: '首页' },
    { id: Tab.SEARCH, icon: Search, label: '搜索' },
    { id: Tab.PLAYER, icon: Play, label: '播放', isSpecial: true },
    { id: Tab.HISTORY, icon: Clock, label: '记录' },
    { id: Tab.PROFILE, icon: User, label: '我的' },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[380px] px-4">
      <nav className="flex justify-between items-center bg-white/90 backdrop-blur-xl px-4 py-2 rounded-[32px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-white/50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          if (tab.isSpecial) {
             return (
                <button 
                  key={tab.id} 
                  onClick={() => onTabChange(tab.id)}
                  className="mx-1 w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all group"
                >
                  <Icon size={22} fill="currentColor" className="ml-1 text-white" />
                </button>
             );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-gray-100 active:scale-95 relative"
            >
              <Icon 
                 size={22} 
                 className={`transition-colors duration-300 ${isActive ? 'text-gray-900 stroke-[2.5px]' : 'text-gray-400 stroke-[2px]'}`}
              />
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-gray-900 rounded-full"></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabBar;