import React, { useState, useEffect } from 'react';
import { Play, Headphones, Clock } from 'lucide-react';
import { HERO_BOOKS } from '../constants';

const HeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_BOOKS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full px-6 py-4">
      {/* Container for the single active card with transition */}
      <div className="relative h-[220px] w-full">
        {HERO_BOOKS.map((book, index) => {
          const isActive = index === currentIndex;
          
          return (
            <div
              key={book.id}
              className={`absolute inset-0 transition-all duration-700 ease-out
                ${isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0'}
              `}
            >
              {/* Ticket Card */}
              <div className="relative w-full h-full rounded-[32px] overflow-hidden shadow-[0_20px_40px_-10px_rgba(249,115,22,0.15)] group">
                
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#FDE4D0] to-[#F2E5E5]"></div>
                
                {/* Decorative Circles (Ticket notches) */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#F5F6F8] rounded-full -translate-y-1/2 z-20"></div>
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#F5F6F8] rounded-full -translate-y-1/2 z-20"></div>
                
                {/* Dashed Line */}
                <div className="absolute top-1/2 left-4 right-4 h-px border-t-2 border-dashed border-gray-400/10 -translate-y-1/2 z-10"></div>

                {/* Content Layout */}
                <div className="relative z-20 h-full flex flex-col justify-between p-6">
                  
                  {/* Top Half: Book Info */}
                  <div className="flex justify-between items-start pb-4">
                    <div className="max-w-[65%]">
                       <span className="inline-block px-2 py-1 bg-white/40 backdrop-blur-sm rounded-lg text-[10px] font-bold text-gray-600 mb-2 uppercase tracking-wider">
                         Now Playing
                       </span>
                       <h2 className="text-xl font-bold text-gray-800 leading-tight line-clamp-2">
                         {book.title}
                       </h2>
                       <p className="text-gray-500 text-xs mt-1 font-medium">
                         {book.author}
                       </p>
                    </div>
                    {/* Tiny Cover Image */}
                    <div className="w-16 h-20 rounded-lg shadow-md overflow-hidden rotate-3 group-hover:rotate-6 transition-transform duration-500">
                        <img src={book.coverUrl} className="w-full h-full object-cover" alt="cover"/>
                    </div>
                  </div>

                  {/* Bottom Half: Controls/Stats */}
                  <div className="flex items-center justify-between pt-2">
                     <div className="flex space-x-4 text-gray-600">
                        <div className="flex items-center space-x-1">
                           <Headphones size={14} />
                           <span className="text-xs font-semibold">1.2k</span>
                        </div>
                        <div className="flex items-center space-x-1">
                           <Clock size={14} />
                           <span className="text-xs font-semibold">45m left</span>
                        </div>
                     </div>
                     
                     <button className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform">
                        <Play size={16} fill="white" className="ml-0.5" />
                     </button>
                  </div>
                  
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center space-x-2 mt-6">
        {HERO_BOOKS.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-gray-800' : 'w-2 bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;