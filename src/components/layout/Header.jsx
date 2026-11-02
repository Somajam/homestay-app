import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Shield, User, Clock, Bell, LogOut } from 'lucide-react';

export const Header = ({ setMobileOpen }) => {
  const { currentRole, currentUser = {}, logout } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Mobile menu toggle & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Mobile / Header Logo Badge */}
        <div className="flex items-center gap-2.5">
          <img
            src="/somajam_logo.png"
            alt="Somajam Holidays Logo"
            className="h-8 w-auto object-contain bg-slate-950/60 p-1 rounded-lg border border-slate-800"
          />
          <span className="font-bold text-xs text-slate-200 hidden xs:inline lg:hidden">
            Somajam Holidays
          </span>
        </div>

        {/* Live Clock Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-emerald-400 font-semibold">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Right section: Admin Badge & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Profile Badge */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ${
              currentRole === 'caretaker'
                ? 'bg-gradient-to-br from-amber-600 to-orange-500 ring-amber-500/30'
                : 'bg-gradient-to-br from-emerald-600 to-teal-500 ring-emerald-500/30'
            }`}
          >
            {currentUser.name
              ? currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
              : currentRole === 'caretaker'
              ? 'PC'
              : 'SA'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-tight">
              {currentUser.name || (currentRole === 'caretaker' ? 'Property Caretaker' : 'Somajam Admin')}
            </p>
            <p
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                currentRole === 'caretaker' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {currentRole === 'caretaker' ? 'Caretaker Access' : 'Admin Access'}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold transition-all shadow-sm group"
          title="Sign out of Admin Portal"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden xs:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
