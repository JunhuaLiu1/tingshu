import React, { useState } from 'react';
import TabBar from './components/TabBar';
import HomeView from './components/HomeView';
import SearchView from './components/SearchView';
import PlayerView from './components/PlayerView';
import HistoryView from './components/HistoryView';
import ProfileView from './components/ProfileView';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.HOME:
        return <HomeView />;
      case Tab.SEARCH:
        return <SearchView />;
      case Tab.PLAYER:
        return <PlayerView />;
      case Tab.HISTORY:
        return <HistoryView />;
      case Tab.PROFILE:
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EAECEF] flex justify-center items-center font-sans selection:bg-orange-200 selection:text-orange-900">
      {/* 
        Phone Frame Simulation Container 
      */}
      <div className="
        relative w-full h-full 
        md:w-[430px] md:h-[932px] 
        md:rounded-[3rem] md:border-[8px] md:border-[#FFFFFF] md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]
        bg-[#F5F6F8] overflow-hidden flex flex-col
      ">
        
        {/* Soft Background Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-orange-100/40 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute top-[20%] right-[-20%] w-[300px] h-[300px] bg-blue-50/50 rounded-full blur-[60px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[350px] h-[350px] bg-purple-50/40 rounded-full blur-[70px] pointer-events-none"></div>

        {/* Scrollable Content Area 
            Added pb-32 to ensure content isn't hidden behind the floating TabBar
        */}
        <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-32">
          {renderContent()}
        </main>

        {/* Floating Bottom Nav */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* iOS Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-300 rounded-full z-[60] md:block hidden"></div>
      </div>
    </div>
  );
};

export default App;