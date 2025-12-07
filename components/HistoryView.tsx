import React from 'react';
import { Clock, CheckCircle2, MoreVertical } from 'lucide-react';
import { EDITORS_PICKS, RANKING_BOOKS } from '../constants';

const HistoryView: React.FC = () => {
  // Combine lists for mock history
  const historyItems = [...EDITORS_PICKS, ...RANKING_BOOKS].slice(0, 6);

  return (
    <div className="pt-14 px-6 min-h-full">
       <div className="flex justify-between items-end mb-6 sticky top-0 bg-[#F5F6F8]/95 backdrop-blur-md -mx-6 px-6 py-4 z-40">
         <h1 className="text-2xl font-bold text-gray-800">History</h1>
         <button className="text-xs text-orange-500 font-bold bg-orange-50 px-3 py-1.5 rounded-lg">Clear All</button>
       </div>

       <div className="space-y-6">
          {/* Today Section */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Today</h3>
            <div className="space-y-3">
               {historyItems.slice(0, 2).map((book, idx) => (
                 <div key={idx} className="flex items-center p-3 bg-white rounded-2xl shadow-sm">
                    <img src={book.coverUrl} className="w-12 h-12 rounded-lg object-cover" alt="" />
                    <div className="ml-3 flex-1">
                       <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{book.title}</h4>
                       <div className="flex items-center mt-1 space-x-2">
                          <div className="h-1 w-16 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full bg-orange-400 w-3/4"></div>
                          </div>
                          <span className="text-[10px] text-gray-400">Left 12m</span>
                       </div>
                    </div>
                    <button className="p-2 text-gray-300"><MoreVertical size={16} /></button>
                 </div>
               ))}
            </div>
          </div>

          {/* Yesterday Section */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Yesterday</h3>
            <div className="space-y-3">
               {historyItems.slice(2, 6).map((book, idx) => (
                 <div key={idx} className="flex items-center p-3 bg-white/60 rounded-2xl border border-white">
                    <div className="relative">
                       <img src={book.coverUrl} className="w-12 h-12 rounded-lg object-cover grayscale opacity-80" alt="" />
                       <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                          <CheckCircle2 size={14} className="text-green-500 fill-green-100" />
                       </div>
                    </div>
                    <div className="ml-3 flex-1">
                       <h4 className="text-sm font-medium text-gray-600 line-clamp-1">{book.title}</h4>
                       <p className="text-[10px] text-gray-400 mt-0.5">Finished</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">14:30</span>
                 </div>
               ))}
               {/* Duplicate for scrolling proof */}
               {historyItems.slice(0, 3).map((book, idx) => (
                 <div key={`old-${idx}`} className="flex items-center p-3 bg-white/60 rounded-2xl border border-white">
                    <div className="relative">
                       <img src={book.coverUrl} className="w-12 h-12 rounded-lg object-cover grayscale opacity-80" alt="" />
                    </div>
                    <div className="ml-3 flex-1">
                       <h4 className="text-sm font-medium text-gray-600 line-clamp-1">{book.title}</h4>
                       <p className="text-[10px] text-gray-400 mt-0.5">Finished</p>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">Yesterday</span>
                 </div>
               ))}
            </div>
          </div>
       </div>
    </div>
  );
};

export default HistoryView;