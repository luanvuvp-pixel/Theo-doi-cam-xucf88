import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Sparkles,
  PenLine,
  TrendingUp,
  Heart,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { DiaryEntry, User } from '../types';
import { EmotionDistributionChart } from '../components/charts/EmotionDistributionChart';
import { SentimentTrendChart } from '../components/charts/SentimentTrendChart';
import {
  EMOTIONS_CONFIG,
  formatVietnameseDate,
  getSentimentDescription,
  getStatusBadge,
  normalizeSentimentTo10,
} from '../utils/emotionTheme';

interface Props {
  user: User;
  entries: DiaryEntry[];
  onNavigateToWrite: () => void;
  onSelectEntry: (entry: DiaryEntry) => void;
}

export const DashboardPage: React.FC<Props> = ({
  user,
  entries,
  onNavigateToWrite,
  onSelectEntry,
}) => {
  const totalEntries = entries.length;
  const analyzedEntries = entries.filter((e) => e.status === 'done');
  const totalAnalyzed = analyzedEntries.length;

  // Most frequent emotion
  let mostFrequentEmotion = 'Chưa có';
  let mostFrequentEmotionMeta = null;
  if (totalAnalyzed > 0) {
    const counts: Record<string, number> = {};
    analyzedEntries.forEach((e) => {
      if (e.emotion) {
        counts[e.emotion] = (counts[e.emotion] || 0) + 1;
      }
    });

    let maxCount = 0;
    Object.keys(counts).forEach((emo) => {
      if (counts[emo] > maxCount) {
        maxCount = counts[emo];
        mostFrequentEmotion = emo;
      }
    });

    if (mostFrequentEmotion && (EMOTIONS_CONFIG as Record<string, any>)[mostFrequentEmotion]) {
      mostFrequentEmotionMeta = (EMOTIONS_CONFIG as Record<string, any>)[mostFrequentEmotion];
    }
  }

  // Average sentiment score
  let avgSentiment = 0;
  let avgSentimentText = 'Chưa có dữ liệu';
  let avgSentimentColor = '#94A3B8';
  if (totalAnalyzed > 0) {
    const sum = analyzedEntries.reduce(
      (acc, curr) => acc + normalizeSentimentTo10(curr.sentiment_score),
      0
    );
    avgSentiment = Math.round((sum / totalAnalyzed) * 10) / 10;
    const desc = getSentimentDescription(avgSentiment);
    avgSentimentText = `${avgSentiment}/10 (${desc.text})`;
    avgSentimentColor = desc.color;
  }

  const recentEntries = entries.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#221A33] via-[#2A203F] to-[#1E172F] p-6 sm:p-8 border border-[#B794F4]/20 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181224]/80 border border-[#F2994A]/30 text-xs text-[#F2C94C]">
            <Sparkles className="w-3.5 h-3.5 text-[#F2994A]" />
            <span>Không gian riêng tư và an toàn</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-100">
            Chào bạn, <span className="text-[#F2994A]">{user.name}</span> 🍂
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
            “Một nơi để bạn viết ra những điều đang chất chứa trong lòng”
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToWrite}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] font-bold text-xs sm:text-sm hover:brightness-110 transition flex items-center gap-2 shadow-lg glow-amber cursor-pointer"
            >
              <PenLine className="w-4 h-4" />
              <span>Viết tâm sự mới</span>
            </button>
            <p className="text-xs text-slate-400 italic">
              AI phân tích sắc thái cảm xúc trung lập, không phán xét.
            </p>
          </div>
        </div>

        {/* Ambient background orbs */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-[#F2994A]/10 to-[#B794F4]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* If NEW ACCOUNT has ZERO entries: Clean Beautiful Empty State */}
      {totalEntries === 0 ? (
        <div className="rounded-3xl bg-[#221A33] border border-[#B794F4]/20 p-8 sm:p-12 text-center space-y-5 max-w-2xl mx-auto shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#2A203F] border border-[#F2994A]/30 flex items-center justify-center text-3xl shadow-inner">
            📖
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-serif-heading text-slate-100">
              Chưa có bài viết nào trong nhật ký
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              Không gian này thuộc về riêng bạn. Hãy viết ra những suy nghĩ, lo lắng hay niềm vui của ngày hôm nay để bắt đầu hành trình thấu hiểu cảm xúc của chính mình.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToWrite}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] font-bold text-sm hover:brightness-110 transition inline-flex items-center gap-2 shadow-lg glow-amber cursor-pointer"
            >
              <PenLine className="w-4 h-4" />
              <span>Bắt đầu viết bài đầu tiên</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/5 text-left text-xs text-slate-400">
            <div className="p-3 bg-[#181224]/50 rounded-xl">
              <span className="text-[#F2994A] font-semibold block mb-1">1. Tự do viết</span>
              Viết không giới hạn mọi suy nghĩ và cảm xúc thật của bạn.
            </div>
            <div className="p-3 bg-[#181224]/50 rounded-xl">
              <span className="text-[#F2C94C] font-semibold block mb-1">2. Phân tích AI</span>
              Gemini trích xuất khách quan sắc thái và mức độ căng thẳng.
            </div>
            <div className="p-3 bg-[#181224]/50 rounded-xl">
              <span className="text-[#B794F4] font-semibold block mb-1">3. Theo dõi xu hướng</span>
              Biểu đồ trực quan giúp bạn quan sát sức khỏe tinh thần dài hạn.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Tổng bài */}
            <div className="p-5 rounded-2xl bg-[#221A33] border border-[#B794F4]/15 shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Tổng số bài tâm sự</p>
                <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{totalEntries}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Đã lưu trữ an toàn</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#2A203F] border border-white/5 flex items-center justify-center text-slate-300">
                <BookOpen className="w-5 h-5 text-[#B794F4]" />
              </div>
            </div>

            {/* Card 2: Đã phân tích */}
            <div className="p-5 rounded-2xl bg-[#221A33] border border-[#B794F4]/15 shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Số bài đã phân tích</p>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{totalAnalyzed}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {totalEntries > 0 ? `${Math.round((totalAnalyzed / totalEntries) * 100)}% hoàn tất` : '0%'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#2A203F] border border-white/5 flex items-center justify-center text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            {/* Card 3: Cảm xúc nhiều nhất */}
            <div className="p-5 rounded-2xl bg-[#221A33] border border-[#B794F4]/15 shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Cảm xúc xuất hiện nhiều nhất</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {mostFrequentEmotionMeta ? (
                    <>
                      <span className="text-lg">{mostFrequentEmotionMeta.icon}</span>
                      <span className="text-lg font-bold text-slate-100 capitalize">
                        {mostFrequentEmotionMeta.nameVi}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400 italic">Chưa xác định</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Sắc thái nổi trội</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#2A203F] border border-white/5 flex items-center justify-center text-slate-300">
                <Heart className="w-5 h-5 text-[#F2994A]" />
              </div>
            </div>

            {/* Card 4: Điểm cảm xúc trung bình */}
            <div className="p-5 rounded-2xl bg-[#221A33] border border-[#B794F4]/15 shadow-md flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Điểm cảm xúc trung bình</p>
                <p className="text-lg font-bold font-mono mt-1" style={{ color: avgSentimentColor }}>
                  {avgSentimentText}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Thang điểm 1 - 10</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#2A203F] border border-white/5 flex items-center justify-center text-slate-300">
                <TrendingUp className="w-5 h-5 text-[#F2C94C]" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Emotion distribution */}
            <div className="p-6 rounded-3xl bg-[#221A33] border border-[#B794F4]/15 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-serif-heading">
                    Phân bố cảm xúc
                  </h3>
                  <p className="text-xs text-slate-400">Tỷ lệ các sắc thái trong các bài đã phân tích</p>
                </div>
              </div>
              <EmotionDistributionChart entries={entries} />
            </div>

            {/* Chart 2: Sentiment trendline */}
            <div className="p-6 rounded-3xl bg-[#221A33] border border-[#B794F4]/15 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-serif-heading">
                    Xu hướng cảm xúc theo thời gian
                  </h3>
                  <p className="text-xs text-slate-400">Biến động điểm tích cực / tiêu cực qua từng bài viết</p>
                </div>
              </div>
              <SentimentTrendChart entries={entries} />
            </div>
          </div>

          {/* Recent Entries */}
          <div className="p-6 rounded-3xl bg-[#221A33] border border-[#B794F4]/15 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 font-serif-heading">
                  Tâm sự gần đây
                </h3>
                <p className="text-xs text-slate-400">Các bài viết mới nhất trong không gian của bạn</p>
              </div>
              <button
                type="button"
                onClick={onNavigateToWrite}
                className="text-xs font-semibold text-[#F2994A] hover:text-[#F2C94C] flex items-center gap-1 transition"
              >
                <span>Viết thêm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {recentEntries.map((entry) => {
                const statusBadge = getStatusBadge(entry.status);
                const emotionMeta = entry.emotion ? EMOTIONS_CONFIG[entry.emotion] : null;

                return (
                  <div
                    key={entry.id}
                    onClick={() => onSelectEntry(entry)}
                    className="py-3.5 px-3 -mx-3 rounded-xl hover:bg-white/5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-1 overflow-hidden pr-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge.className}`}>
                          {statusBadge.text}
                        </span>
                        {emotionMeta && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{
                              backgroundColor: emotionMeta.bgColor,
                              color: emotionMeta.color,
                            }}
                          >
                            <span>{emotionMeta.icon}</span>
                            <span>{emotionMeta.nameVi}</span>
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatVietnameseDate(entry.createdAt)}</span>
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-200 group-hover:text-[#F2C94C] transition truncate">
                        {entry.title || 'Tâm sự không tiêu đề'}
                      </h4>

                      <p className="text-xs text-slate-400 line-clamp-1">
                        {entry.summary || entry.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      {entry.stress_level !== null && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Căng thẳng</span>
                          <span className="text-xs font-bold font-mono text-amber-300">
                            {entry.stress_level}/100
                          </span>
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 group-hover:translate-x-1 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
