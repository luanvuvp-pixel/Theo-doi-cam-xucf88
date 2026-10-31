import { EmotionType, TopicType, AnalysisStatus } from '../types';

export interface EmotionMeta {
  label: EmotionType;
  nameVi: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  badgeClass: string;
}

export const EMOTIONS_CONFIG: Record<EmotionType, EmotionMeta> = {
  'vui vẻ': {
    label: 'vui vẻ',
    nameVi: 'Vui vẻ',
    color: '#F2C94C',
    bgColor: 'rgba(242, 201, 76, 0.15)',
    borderColor: 'rgba(242, 201, 76, 0.4)',
    icon: '✨',
    badgeClass: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  },
  'bình yên': {
    label: 'bình yên',
    nameVi: 'Bình yên',
    color: '#6EE7B7',
    bgColor: 'rgba(110, 231, 183, 0.15)',
    borderColor: 'rgba(110, 231, 183, 0.4)',
    icon: '🍃',
    badgeClass: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  },
  'buồn bã': {
    label: 'buồn bã',
    nameVi: 'Buồn bã',
    color: '#60A5FA',
    bgColor: 'rgba(96, 165, 250, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
    icon: '🌧️',
    badgeClass: 'bg-blue-400/15 text-blue-300 border-blue-400/30',
  },
  'lo lắng': {
    label: 'lo lắng',
    nameVi: 'Lo lắng',
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    icon: '🍂',
    badgeClass: 'bg-orange-400/15 text-orange-300 border-orange-400/30',
  },
  'tức giận': {
    label: 'tức giận',
    nameVi: 'Tức giận',
    color: '#F87171',
    bgColor: 'rgba(248, 113, 113, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
    icon: '🔥',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  'thất vọng': {
    label: 'thất vọng',
    nameVi: 'Thất vọng',
    color: '#C084FC',
    bgColor: 'rgba(192, 132, 252, 0.15)',
    borderColor: 'rgba(192, 132, 252, 0.4)',
    icon: '🥀',
    badgeClass: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
  },
  'cô đơn': {
    label: 'cô đơn',
    nameVi: 'Cô đơn',
    color: '#818CF8',
    bgColor: 'rgba(129, 140, 248, 0.15)',
    borderColor: 'rgba(129, 140, 248, 0.4)',
    icon: '🌙',
    badgeClass: 'bg-indigo-400/15 text-indigo-300 border-indigo-400/30',
  },
  'căng thẳng': {
    label: 'căng thẳng',
    nameVi: 'Căng thẳng',
    color: '#FB923C',
    bgColor: 'rgba(251, 146, 60, 0.15)',
    borderColor: 'rgba(251, 146, 60, 0.4)',
    icon: '⚡',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  'khác': {
    label: 'khác',
    nameVi: 'Khác',
    color: '#B794F4',
    bgColor: 'rgba(183, 148, 244, 0.15)',
    borderColor: 'rgba(183, 148, 244, 0.4)',
    icon: '🔮',
    badgeClass: 'bg-fuchsia-400/15 text-fuchsia-300 border-fuchsia-400/30',
  },
};

export interface TopicMeta {
  label: TopicType;
  nameVi: string;
  iconName: string;
  color: string;
}

export const TOPICS_CONFIG: Record<TopicType, TopicMeta> = {
  'học tập': { label: 'học tập', nameVi: 'Học tập', iconName: 'GraduationCap', color: '#60A5FA' },
  'công việc': { label: 'công việc', nameVi: 'Công việc', iconName: 'Briefcase', color: '#F2994A' },
  'gia đình': { label: 'gia đình', nameVi: 'Gia đình', iconName: 'Home', color: '#F472B6' },
  'quan hệ': { label: 'quan hệ', nameVi: 'Mối quan hệ', iconName: 'HeartHandshake', color: '#A78BFA' },
  'tài chính': { label: 'tài chính', nameVi: 'Tài chính', iconName: 'Coins', color: '#34D399' },
  'sức khỏe': { label: 'sức khỏe', nameVi: 'Sức khỏe', iconName: 'Activity', color: '#38BDF8' },
  'khác': { label: 'khác', nameVi: 'Khác', iconName: 'Sparkles', color: '#B794F4' },
};

export function getStatusBadge(status: AnalysisStatus) {
  switch (status) {
    case 'done':
      return {
        text: 'Đã phân tích',
        className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
      };
    case 'failed':
      return {
        text: 'Lỗi phân tích',
        className: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      };
    case 'pending':
    default:
      return {
        text: 'Chưa phân tích',
        className: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      };
  }
}

export function formatVietnameseDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

export function formatShortDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  } catch {
    return isoDate;
  }
}

export function normalizeSentimentTo10(score: number | null | undefined): number {
  if (score === null || score === undefined || isNaN(score)) return 5.5;
  if (score >= -1 && score <= 1) {
    // Map legacy -1..1 to 1..10
    const val = ((score + 1) / 2) * 9 + 1;
    return Math.round(val * 10) / 10;
  }
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

export function normalizeStressTo10(level: number | null | undefined): number {
  if (level === null || level === undefined || isNaN(level)) return 5;
  if (level > 10) {
    // Map legacy 0..100 to 1..10
    return Math.max(1, Math.min(10, Math.round(level / 10)));
  }
  return Math.max(1, Math.min(10, Math.round(level)));
}

export function getSentimentDescription(rawScore: number): { text: string; color: string } {
  // Normalize to 1-10
  const score = normalizeSentimentTo10(rawScore);
  if (score >= 8.5) return { text: 'Rất tích cực', color: '#34D399' };
  if (score >= 7.0) return { text: 'Tích cực', color: '#6EE7B7' };
  if (score >= 4.5) return { text: 'Cân bằng / Trung tính', color: '#CBD5E1' };
  if (score >= 3.0) return { text: 'Tiêu cực nhẹ', color: '#FDBA74' };
  return { text: 'Rất tiêu cực', color: '#F87171' };
}

export function getStressDescription(rawLevel: number): { text: string; color: string } {
  const level = normalizeStressTo10(rawLevel);
  if (level <= 3) return { text: 'Thư giãn / Ổn định', color: '#34D399' };
  if (level <= 5) return { text: 'Áp lực nhẹ', color: '#FDE047' };
  if (level <= 7) return { text: 'Căng thẳng vừa', color: '#FB923C' };
  return { text: 'Căng thẳng cao', color: '#F87171' };
}
