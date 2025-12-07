import React, { useState } from 'react';
import { CATEGORIES } from '../constants';
import { Compass, BookOpen, Coffee, Briefcase, Feather, Zap } from 'lucide-react';

// Map icons to categories for visual appeal (since constants.ts is generic)
const ICONS: Record<string, any> = {
  '1': BookOpen,
  '2': Compass,
  '3': Briefcase,
  '4': Coffee,
  '5': Feather,
  '6': Zap,
};

const CategoryTabs: React.FC = () => {
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);

  return (
    <div className="px-6 py-2">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Categories</h3>
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.slice(0, 3).map((cat) => {
          const isActive = cat.id === activeId;
          const Icon = ICONS[cat.id] || Compass;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveId(cat.id)}
              className={`
                flex flex-col items-center justify-center p-4 rounded-[24px] transition-all duration-300
                ${isActive 
                  ? 'bg-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)] ring-2 ring-gray-100 scale-[1.02]' 
                  : 'bg-white shadow-[0_4px_10px_-4px_rgba(0,0,0,0.02)] hover:bg-gray-50'
                }
              `}
            >
              <div className={`p-2.5 rounded-full mb-2 ${isActive ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-400'}`}>
                 <Icon size={20} />
              </div>
              <span className={`text-xs font-semibold ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryTabs;