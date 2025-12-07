import React from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { HERO_BOOKS } from '../constants';

const SearchView: React.FC = () => {
  return (
    <div className="pt-8 px-6 min-h-full">
      {/* Sticky Header & Search Input */}
      <div className="sticky top-0 z-40 bg-[#F5F6F8]/95 backdrop-blur-xl -mx-6 px-6 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Search</h1>
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search books, authors..." 
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white border-none shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,1)] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-200 p-1 rounded-full text-gray-500">
             <X size={12} />
          </button>
        </div>
      </div>

      {/* Hot Tags */}
      <div className="mb-8 mt-2">
        <div className="flex items-center space-x-2 mb-4">
           <TrendingUp size={16} className="text-orange-500" />
           <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Trending</h2>
        </div>
        <div className="flex flex-wrap gap-3">
           {['Sci-Fi', 'Meditation', 'History', 'Self-growth', 'Mystery', 'Finance'].map(tag => (
              <button key={tag} className="px-4 py-2 bg-white rounded-xl shadow-sm text-sm font-medium text-gray-600 hover:text-orange-500 hover:shadow-md transition-all">
                {tag}
              </button>
           ))}
        </div>
      </div>

      {/* Results List */}
      <div>
         <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Top Results</h2>
         <div className="space-y-4">
            {HERO_BOOKS.map(book => (
              <div key={book.id} className="flex items-start p-4 bg-white rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
                 <img src={book.coverUrl} className="w-16 h-20 rounded-lg object-cover shadow-sm" alt={book.title} />
                 <div className="ml-4 flex-1">
                    <h3 className="text-gray-800 font-bold">{book.title}</h3>
                    <p className="text-gray-400 text-xs mt-1">{book.author}</p>
                    <div className="mt-2 flex space-x-2">
                       <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500">Audiobook</span>
                       <span className="px-2 py-0.5 bg-orange-50 rounded text-[10px] text-orange-500">Best Seller</span>
                    </div>
                 </div>
              </div>
            ))}
            {/* Add more items to demonstrate scrolling */}
            {HERO_BOOKS.map(book => (
              <div key={`dup-${book.id}`} className="flex items-start p-4 bg-white rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
                 <img src={book.coverUrl} className="w-16 h-20 rounded-lg object-cover shadow-sm" alt={book.title} />
                 <div className="ml-4 flex-1">
                    <h3 className="text-gray-800 font-bold">{book.title}</h3>
                    <p className="text-gray-400 text-xs mt-1">{book.author}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default SearchView;