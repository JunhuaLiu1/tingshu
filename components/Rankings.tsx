import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { RANKING_BOOKS } from '../constants';

const Rankings: React.FC = () => {
  return (
    <div className="px-6 pb-24">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800">Trending</h2>
        <span className="text-xs text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded-lg">See All</span>
      </div>

      <div className="flex flex-col space-y-3">
        {RANKING_BOOKS.slice(0, 4).map((book) => (
          <div key={book.id} className="flex items-center p-3 bg-white rounded-[20px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] border border-gray-50">
            <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex-1 min-w-0 ml-4">
               <h3 className="text-gray-800 text-sm font-bold truncate">{book.title}</h3>
               <p className="text-gray-400 text-xs mt-0.5 truncate">{book.author}</p>
            </div>

            <div className="flex items-center space-x-3">
               <span className="text-xs font-bold text-gray-300">#{book.rank}</span>
               <button className="p-1.5 text-gray-300 hover:text-gray-600 transition-colors">
                 <MoreHorizontal size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rankings;