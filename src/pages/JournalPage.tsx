import React, { useState } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  Trash2,
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  Plus,
  Download,
} from 'lucide-react';
import { DiaryEntry, downloadDiaryTextFile } from '../types';
import {
  EMOTIONS_CONFIG,
  TOPICS_CONFIG,
  formatVietnameseDate,
  getSentimentDescription,
  getStatusBadge,
  getStressDescription,
  normalizeSentimentTo10,
  normalizeStressTo10,
} from '../utils/emotionTheme';
import { EmotionTrendLineChart } from '../components/charts/EmotionTrendLineChart';
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  entries: DiaryEntry[];
  onSelectEntry: (entry: DiaryEntry) => void;
  onAnalyzeEntry: (id: string) => void;
  onDeleteRequest: (entry: DiaryEntry) => void;
  onNavigateToWrite: () => void;
  analyzingId?: string | null;
}

export const JournalPage: React.FC<Props> = ({
  entries,
  onSelectEntry,
  onAnalyzeEntry,
  onDeleteRequest,
  onNavigateToWrite,
  analyzingId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'done' | 'pending' | 'failed'>('all');
  const [showTrendChart, setShowTrendChart] = useState(false);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    // Status filter
    if (statusFilter !== 'all' && entry.status !== statusFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = entry.title?.toLowerCase().includes(q);
      const matchContent = entry.content.toLowerCase().includes(q);
      const matchSummary = entry.summary?.toLowerCase().includes(q);
      const matchEmotion = entry.emotion?.toLowerCase().includes(q);
      const matchTopic = entry.topic?.toLowerCase().includes(q);

      if (!matchTitle && !matchContent && !matchSummary && !matchEmotion && !matchTopic) {
        return false;
      }
    }

    return true;
  });

  const analyzedCount = entries.filter((e) => e.status === 'done').length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-100">
            Nhật ký của tôi
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Lịch sử lưu giữ tâm sự và dòng chảy cảm xúc của bạn
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {analyzedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowTrendChart(!showTrendChart)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                showTrendChart
                  ? 'bg-[#2A203F] text-[#F2C94C] border-[#F2994A]/40 shadow-sm'
                  : 'bg-[#221A33] text-slate-300 border-white/10 hover:border-white/20'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#F2C94C]" />
              <span>{showTrendChart ? 'Ẩn biểu đồ Recharts' : 'Biểu đồ Recharts'}</span>
              {showTrendChart ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToWrite}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] text-xs font-bold hover:brightness-110 transition flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Viết bài mới</span>
          </button>
        </div>
      </div>

      {/* Optional Collapsible Recharts Line Chart inline */}
      {showTrendChart && analyzedCount > 0 && (
        <div className="p-6 rounded-3xl bg-[#221A33] border border-[#F2994A]/30 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#F2C94C]" />
              <h3 className="text-base font-bold text-slate-100 font-serif-heading">
                Biến thiên sentiment_score và stress_level (Thang 1-10)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Thời gian thực từ Firestore
            </span>
          </div>
          <EmotionTrendLineChart entries={entries} />
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Tìm theo từ khóa, cảm xúc, chủ đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#221A33] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2994A] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-200"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 pl-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Lọc:</span>
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#2A203F] text-[#F2C94C] border border-[#F2994A]/40'
                : 'bg-[#221A33] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            Tất cả ({entries.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('done')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
              statusFilter === 'done'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-[#221A33] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            Đã phân tích ({entries.filter((e) => e.status === 'done').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-[#221A33] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            Chưa phân tích ({entries.filter((e) => e.status === 'pending').length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('failed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 cursor-pointer ${
              statusFilter === 'failed'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-[#221A33] text-slate-400 hover:text-slate-200 border border-white/5'
            }`}
          >
            Lỗi ({entries.filter((e) => e.status === 'failed').length})
          </button>
        </div>
      </div>

      {/* Entries List or Empty State */}
      {entries.length === 0 ? (
        <div className="rounded-3xl bg-[#221A33] border border-[#B794F4]/20 p-12 text-center space-y-4 max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-[#F2994A] mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-slate-200 font-serif-heading">
            Chưa có bài tâm sự nào
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Bạn chưa lưu bài viết nào. Hãy dành vài phút viết ra những cảm xúc hiện tại của bạn nhé!
          </p>
          <button
            type="button"
            onClick={onNavigateToWrite}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] text-xs font-bold hover:brightness-110 transition cursor-pointer"
          >
            Viết bài đầu tiên
          </button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-3xl bg-[#221A33] border border-white/5 p-12 text-center space-y-3">
          <p className="text-sm text-slate-300">Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-xs text-[#F2994A] hover:underline cursor-pointer"
          >
            Xóa tìm kiếm và đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const statusBadge = getStatusBadge(entry.status);
            const emotionMeta = entry.emotion ? EMOTIONS_CONFIG[entry.emotion] : null;
            const topicMeta = entry.topic ? TOPICS_CONFIG[entry.topic] : null;
            const isAnalyzingThis = analyzingId === entry.id;

            return (
              <div
                key={entry.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#221A33] border border-[#B794F4]/15 hover:border-[#B794F4]/35 shadow-md transition-all duration-200 space-y-4 group"
              >
                {/* Card Top: Badges & Date */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadge.className}`}>
                      {statusBadge.text}
                    </span>

                    {emotionMeta && (
                      <span
                        className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
                        style={{
                          backgroundColor: emotionMeta.bgColor,
                          color: emotionMeta.color,
                          border: `1px solid ${emotionMeta.borderColor}`,
                        }}
                      >
                        <span>{emotionMeta.icon}</span>
                        <span>{emotionMeta.nameVi}</span>
                      </span>
                    )}

                    {topicMeta && (
                      <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                        {topicMeta.nameVi}
                      </span>
                    )}

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span>☁️</span>
                      <span>{entry.fileName || 'tam-su.txt'}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-[#F2994A]" />
                    <span>{formatVietnameseDate(entry.createdAt)}</span>
                  </div>
                </div>

                {/* Title & Preview Body */}
                <div
                  onClick={() => onSelectEntry(entry)}
                  className="cursor-pointer space-y-1.5"
                >
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 font-serif-heading group-hover:text-[#F2C94C] transition">
                    {entry.title || 'Tâm sự không tiêu đề'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                    {entry.content}
                  </p>
                </div>

                {/* Done State: AI summary box */}
                {entry.status === 'done' && entry.summary && (
                  <div className="p-3 rounded-xl bg-[#181224]/70 border border-white/5 text-xs text-slate-300 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#F2C94C] shrink-0 mt-0.5" />
                    <p className="italic line-clamp-1">"{entry.summary}"</p>
                  </div>
                )}

                {/* Card Bottom: Scores & Action Buttons */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Scores */}
                  <div className="flex items-center gap-4 text-slate-400">
                    {entry.sentiment_score !== null && (
                      <div>
                        <span>Sắc thái: </span>
                        <span
                          className="font-bold"
                          style={{
                            color: getSentimentDescription(entry.sentiment_score).color,
                          }}
                        >
                          {normalizeSentimentTo10(entry.sentiment_score)}/10
                        </span>
                      </div>
                    )}

                    {entry.stress_level !== null && (
                      <div>
                        <span>Căng thẳng: </span>
                        <span
                          className="font-bold"
                          style={{
                            color: getStressDescription(entry.stress_level).color,
                          }}
                        >
                          {normalizeStressTo10(entry.stress_level)}/10
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {entry.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onAnalyzeEntry(entry.id)}
                        disabled={isAnalyzingThis}
                        className="px-3 py-1.5 rounded-lg bg-[#F2994A]/20 hover:bg-[#F2994A]/30 text-[#F2C94C] border border-[#F2994A]/40 font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isAnalyzingThis ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang phân tích...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Phân tích cảm xúc</span>
                          </>
                        )}
                      </button>
                    )}

                    {entry.status === 'failed' && (
                      <button
                        type="button"
                        onClick={() => onAnalyzeEntry(entry.id)}
                        disabled={isAnalyzingThis}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isAnalyzingThis ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang thử lại...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Thử lại</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => downloadDiaryTextFile(entry)}
                      title="Tải file text (.txt)"
                      className="p-1.5 text-slate-400 hover:text-[#F2C94C] hover:bg-[#F2994A]/10 rounded-lg transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectEntry(entry)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 font-medium transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteRequest(entry)}
                      title="Xóa bài viết"
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
