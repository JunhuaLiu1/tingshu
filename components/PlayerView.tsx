import React from 'react';
import { ChevronDown, MoreHorizontal, SkipBack, Play, SkipForward, Heart, ListMusic, Volume2 } from 'lucide-react';

const PlayerView: React.FC = () => {
  return (
    <div className="min-h-full flex flex-col px-6 pt-14 pb-8 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
         <button className="p-2 bg-white/50 rounded-full shadow-sm"><ChevronDown size={20} className="text-gray-600" /></button>
         <div className="text-center">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Now Playing</span>
         </div>
         <button className="p-2 bg-white/50 rounded-full shadow-sm"><MoreHorizontal size={20} className="text-gray-600" /></button>
      </div>

      {/* Album Art */}
      <div className="flex-1 flex justify-center items-center mb-8 relative min-h-[300px]">
         <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-[40px] shadow-[0_25px_50px_-12px_rgba(249,115,22,0.25)] overflow-hidden z-10 border-4 border-white">
            <img src="https://picsum.photos/600/600?random=1" alt="Cover" className="w-full h-full object-cover" />
         </div>
         {/* Decorative Blur behind */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-orange-300 blur-[60px] opacity-40 rounded-full"></div>
      </div>

      {/* Info */}
      <div className="mb-8">
         <div className="flex justify-between items-start">
            <div>
               <h2 className="text-2xl font-bold text-gray-800">百年孤独</h2>
               <p className="text-gray-400 font-medium mt-1">加西亚·马尔克斯</p>
            </div>
            <button className="p-3 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.05)] text-gray-300 hover:text-red-500 transition-colors">
               <Heart size={20} fill="currentColor" />
            </button>
         </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
         <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex items-center shadow-inner">
            <div className="h-full w-1/3 bg-gray-800 rounded-full relative">
               <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-gray-100 scale-125"></div>
            </div>
         </div>
         <div className="flex justify-between mt-2 text-xs font-bold text-gray-400">
            <span>12:45</span>
            <span>45:30</span>
         </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center mb-6">
         <button className="text-gray-400 hover:text-gray-600 transition-colors"><ListMusic size={22} /></button>
         
         <div className="flex items-center space-x-6">
            <button className="p-4 bg-white rounded-full shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] text-gray-600 transition-all">
               <SkipBack size={24} fill="currentColor" />
            </button>
            <button className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(17,24,39,0.3)] hover:scale-105 active:scale-95 transition-all">
               <Play size={32} fill="white" className="ml-1" />
            </button>
            <button className="p-4 bg-white rounded-full shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff] active:shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff] text-gray-600 transition-all">
               <SkipForward size={24} fill="currentColor" />
            </button>
         </div>

         <button className="text-gray-400 hover:text-gray-600 transition-colors"><Volume2 size={22} /></button>
      </div>
    </div>
  );
};

export default PlayerView;