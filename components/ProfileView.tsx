import React from 'react';
import { Settings, Bell, ChevronRight, Moon, Shield, HelpCircle, LogOut } from 'lucide-react';

const ProfileView: React.FC = () => {
  return (
    <div className="pt-14 px-6 min-h-full">
      {/* Header */}
      <div className="flex justify-end mb-4 space-x-2 sticky top-0 pt-4 pb-2 z-40">
         <button className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-gray-800 transition-colors"><Bell size={20} /></button>
         <button className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-gray-800 transition-colors"><Settings size={20} /></button>
      </div>

      {/* User Info */}
      <div className="flex flex-col items-center mb-8">
         <div className="w-28 h-28 rounded-full p-1 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] mb-4 relative">
            <img src="https://picsum.photos/200/200?random=user" className="w-full h-full rounded-full object-cover" alt="User" />
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-400 border-4 border-white rounded-full"></div>
         </div>
         <h1 className="text-2xl font-bold text-gray-800">Jennifer Doe</h1>
         <p className="text-sm text-gray-400 font-medium">Gold Member</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
         {[
            { label: 'Hours', val: '128', color: 'text-blue-500' },
            { label: 'Books', val: '42', color: 'text-orange-500' },
            { label: 'Streak', val: '12', color: 'text-purple-500' }
         ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex flex-col items-center shadow-sm">
               <span className={`text-xl font-black ${stat.color}`}>{stat.val}</span>
               <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">{stat.label}</span>
            </div>
         ))}
      </div>

      {/* Menu List */}
      <div className="space-y-4">
         {[
            { icon: Moon, label: 'Dark Mode', val: 'Off' },
            { icon: Shield, label: 'Privacy', val: '' },
            { icon: HelpCircle, label: 'Help & Support', val: '' },
            { icon: LogOut, label: 'Log Out', val: '', danger: true },
         ].map((item, i) => (
            <button key={i} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-colors">
               <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-xl ${item.danger ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600'}`}>
                     <item.icon size={18} />
                  </div>
                  <span className={`font-semibold ${item.danger ? 'text-red-500' : 'text-gray-700'}`}>{item.label}</span>
               </div>
               <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400 font-medium">{item.val}</span>
                  {!item.danger && <ChevronRight size={16} className="text-gray-300" />}
               </div>
            </button>
         ))}
      </div>
    </div>
  );
};

export default ProfileView;