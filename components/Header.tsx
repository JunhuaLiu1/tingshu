import React from 'react';
import { ChevronLeft, Search, Bell } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 pt-14 pb-4 bg-[#F5F6F8]/80 backdrop-blur-md">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Hi, Jennifer
        </h1>
        <p className="text-xs text-gray-400 font-medium tracking-wide mt-0.5">
          Ready for a new story?
        </p>
      </div>

      <div className="flex items-center space-x-3">
         <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
           <img src="https://picsum.photos/100/100?random=user" alt="User" className="w-full h-full object-cover" />
         </div>
      </div>
    </header>
  );
};

export default Header;