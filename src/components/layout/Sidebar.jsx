import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BedDouble,
  Wallet,
  BarChart3,
  Home,
  ShieldCheck,
  UserCog,
  X,
} from 'lucide-react';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { currentRole } = useApp();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      desc: "Today's Check-ins & Stats",
    },
    {
      name: 'Guests',
      path: '/guests',
      icon: Users,
      desc: 'Directory & Document Archives',
    },
    {
      name: 'Bookings',
      path: '/bookings',
      icon: CalendarCheck,
      desc: 'Check-In/Out Hub',
    },
    {
      name: 'Rooms',
      path: '/rooms',
      icon: BedDouble,
      desc: 'Live Status & Inventory',
    },
    {
      name: 'Expense Tracker',
      path: '/expenses',
      icon: Wallet,
      desc: 'Directors & Shared Ledger',
    },
    {
      name: 'Reports & Settings',
      path: '/reports-settings',
      icon: BarChart3,
      desc: 'Occupancy & Staff Controls',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shadow-md">
              <img
                src="/somajam_logo.png"
                alt="Somajam Holidays Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100 leading-tight">
                Somajam Holidays
              </h1>
              <p className="text-[11px] text-emerald-400 font-semibold">Parunthumpara • 5 1BHKs</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Current Active Role Badge */}
        <div className="px-6 py-3 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck
              className={`w-4 h-4 ${
                currentRole === 'caretaker' ? 'text-amber-400' : 'text-emerald-400'
              }`}
            />
            <span className="text-slate-300 font-semibold">Access Level:</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              currentRole === 'caretaker'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {currentRole}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold leading-snug">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-slate-500 group-hover:text-slate-400">
                    {item.desc}
                  </span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 m-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Somajam Holidays</p>
          <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
            somajamholidays.com
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            Parunthumpara, Idukki, Kerala
          </p>
        </div>
      </aside>
    </>
  );
};
