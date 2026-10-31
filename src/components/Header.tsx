import React from 'react';
import { Menu, PenLine, Sparkles, Moon } from 'lucide-react';
import { NavTab } from '../types';

interface Props {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onNavigateToWrite: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Tổng quan cảm xúc',
    subtitle: 'Theo dõi sắc thái tinh thần và dòng suy nghĩ cá nhân',
  },
  write: {
    title: 'Viết tâm sự',
    subtitle: 'Góc tĩnh lặng để giãi bày những điều chất chứa',
  },
  journal: {
    title: 'Nhật ký của tôi',
    subtitle: 'Kho lưu trữ những trang viết và phân tích của bạn',
  },
  analytics: {
    title: 'Thống kê cảm xúc',
    subtitle: 'Biểu đồ trực quan quan sát xu hướng cảm xúc theo thời gian',
  },
  account: {
    title: 'Tài khoản & Thiết lập',
    subtitle: 'Hồ sơ người dùng và an toàn bảo mật dữ liệu',
  },
};

export const Header: React.FC<Props> = ({
  currentTab,
  onOpenMobileMenu,
  onNavigateToWrite,
}) => {
  const info = TAB_TITLES[currentTab];

  return (
    <header className="sticky top-0 z-30 bg-[#181224]/85 backdrop-blur-md border-b border-[#B794F4]/15 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold font-serif-heading text-slate-100 flex items-center gap-2">
            <span>{info.title}</span>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#F2994A]" />
          </h2>
          <p className="text-xs text-slate-400 hidden sm:block font-light">
            {info.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#221A33] border border-white/5 text-[11px] text-[#F2C94C]">
          <Moon className="w-3 h-3 text-[#F2994A]" />
          <span>Cozy Night Theme</span>
        </div>

        {currentTab !== 'write' && (
          <button
            type="button"
            onClick={onNavigateToWrite}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] text-xs font-bold hover:brightness-110 transition flex items-center gap-1.5 shadow-md glow-amber cursor-pointer"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Viết tâm sự</span>
          </button>
        )}
      </div>
    </header>
  );
};
