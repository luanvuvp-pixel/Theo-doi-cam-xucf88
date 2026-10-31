import React from 'react';
import {
  LayoutDashboard,
  PenLine,
  BookOpen,
  BarChart3,
  User,
  LogOut,
  Moon,
  Sparkles,
  X,
} from 'lucide-react';
import { NavTab, User as UserType } from '../types';

interface Props {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserType | null;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  entryCount?: number;
}

export const Sidebar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  user,
  onLogout,
  isMobileOpen,
  onCloseMobile,
  entryCount = 0,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'write',
      label: 'Viết tâm sự',
      icon: <PenLine className="w-5 h-5" />,
    },
    {
      id: 'journal',
      label: 'Nhật ký của tôi',
      icon: <BookOpen className="w-5 h-5" />,
      badge: entryCount > 0 ? entryCount : undefined,
    },
    {
      id: 'analytics',
      label: 'Thống kê cảm xúc',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      id: 'account',
      label: 'Tài khoản',
      icon: <User className="w-5 h-5" />,
    },
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#1E172F] border-r border-[#B794F4]/15 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F2994A] to-[#B794F4] p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-[#181224] rounded-[10px] flex items-center justify-center text-lg">
                🌙
              </div>
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100 font-serif-heading tracking-wide">
                Emotion Care
              </h1>
              <p className="text-[11px] text-[#F2C94C] flex items-center gap-1">
                <span>Không gian cảm xúc</span>
                <Sparkles className="w-3 h-3 text-[#F2994A]" />
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#F2994A]/20 to-[#B794F4]/10 text-[#F2C94C] border border-[#F2994A]/30 shadow-md font-semibold'
                    : 'text-slate-300 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-[#F2994A]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-[#F2994A] text-[#181224] font-bold'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Ambient Warm Note */}
        <div className="p-4 mx-3 mb-4 rounded-2xl bg-[#2A203F]/60 border border-[#B794F4]/15 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 text-[#F2C94C] font-semibold text-[11px]">
            <Moon className="w-3.5 h-3.5" />
            <span>Góc tĩnh lặng</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Viết ra những điều đang chất chứa trong lòng để nhẹ vơi tâm trí.
          </p>
        </div>

        {/* User Profile Bar */}
        {user && (
          <div className="p-4 border-t border-white/5 bg-[#181224]/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#B794F4] to-[#F2994A] flex items-center justify-center text-xs font-bold text-[#181224] shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-slate-200 truncate">{user.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Đăng xuất"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
