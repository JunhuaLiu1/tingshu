import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { EDITORS_PICKS } from '../constants';

const EditorsPick: React.FC = () => {
  return (
    <div className="pt-6 pb-2">
      <div className="px-6 flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Popular Books</h2>
        <button className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-800 shadow-sm transition-colors">
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="overflow-x-auto no-scrollbar pl-6 pb-8">
        <div className="flex space-x-5 pr-6">
          {EDITORS_PICKS.map((book) => (
            <div key={book.id} className="group min-w-[150px] w-[150px] flex flex-col">
              <div className="relative aspect-[3/4] rounded-[24px] overflow-hidden mb-3 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] transition-transform duration-300 group-hover:-translate-y-1">
                <img 
                  src={book.coverUrl} 
                  alt={book.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                <button className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <Play size={12} fill="black" className="ml-0.5" />
                </button>
              </div>
              <h3 className="text-gray-800 text-sm font-bold line-clamp-1">{book.title}</h3>
              <p className="text-gray-400 text-xs mt-1 font-medium">{book.author}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EditorsPick;