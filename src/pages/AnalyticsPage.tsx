import React, { useState } from 'react';
import {
  BarChart3,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Activity,
  Heart,
  Tag,
  Radio,
} from 'lucide-react';
import { DiaryEntry, TimeRange } from '../types';
import { EmotionTrendLineChart } from '../components/charts/EmotionTrendLineChart';
import { EmotionDistributionChart } from '../components/charts/EmotionDistributionChart';
import { TopicFrequencyChart } from '../components/charts/TopicFrequencyChart';
import {
  EMOTIONS_CONFIG,
  TOPICS_CONFIG,
  getSentimentDescription,
  getStressDescription,
  normalizeSentimentTo10,
  normalizeStressTo10,
} from '../utils/emotionTheme';
import { firebaseConfig } from '../services/firebase';

interface Props {
  entries: DiaryEntry[];
  onNavigateToWrite: () => void;
}

export const AnalyticsPage: React.FC<Props> = ({ entries, onNavigateToWrite }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Filter only 'done' entries
  const doneEntries = entries.filter((e) => e.status === 'done');

  // Apply time range filter based on entry.createdAt
  const now = new Date().getTime();
  const filteredDoneEntries = doneEntries.filter((entry) => {
    if (timeRange === 'all') return true;
    const entryTime = new Date(entry.createdAt).getTime();
    const diffDays = (now - entryTime) / (1000 * 60 * 60 * 24);

    if (timeRange === '7d') return diffDays <= 7;
    if (timeRange === '30d') return diffDays <= 30;
    if (timeRange === '90d') return diffDays <= 90;
    return true;
  });

  // Calculate summary metrics on 1-10 scale
  const totalInPeriod = filteredDoneEntries.length;

  let avgSentiment = 0;
  let avgStress = 0;
  let topTopic: string | null = null;
  let topEmotion: string | null = null;

  if (totalInPeriod > 0) {
    const sentimentSum = filteredDoneEntries.reduce(
      (acc, curr) => acc + normalizeSentimentTo10(curr.sentiment_score),
      0
    );
    avgSentiment = Math.round((sentimentSum / totalInPeriod) * 10) / 10;

    const stressSum = filteredDoneEntries.reduce(
      (acc, curr) => acc + normalizeStressTo10(curr.stress_level),
      0
    );
    avgStress = Math.round((stressSum / totalInPeriod) * 10) / 10;

    // Topic counts
    const topicCounts: Record<string, number> = {};
    const emotionCounts: Record<string, number> = {};
    filteredDoneEntries.forEach((e) => {
      if (e.topic) topicCounts[e.topic] = (topicCounts[e.topic] || 0) + 1;
      if (e.emotion) emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });

    let maxTCount = 0;
    Object.keys(topicCounts).forEach((t) => {
      if (topicCounts[t] > maxTCount) {
        maxTCount = topicCounts[t];
        topTopic = t;
      }
    });

    let maxECount = 0;
    Object.keys(emotionCounts).forEach((em) => {
      if (emotionCounts[em] > maxECount) {
        maxECount = emotionCounts[em];
        topEmotion = em;
      }
    });
  }

  const sentimentMeta = getSentimentDescription(avgSentiment);
  const stressMeta = getStressDescription(avgStress);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F2C94C] mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Phân tích dữ liệu cảm xúc tự động bằng Gemini AI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-100">
            Thống kê cảm xúc
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Biểu đồ đường Recharts thể hiện biến thiên của Điểm tích cực và Mức độ căng thẳng theo thời gian thực từ Firestore
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center bg-[#221A33] p-1 rounded-xl border border-white/10 self-start sm:self-auto shadow-md">
          <button
            type="button"
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              timeRange === '7d'
                ? 'bg-[#2A203F] text-[#F2C94C] font-semibold border border-white/10 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            7 ngày gần nhất
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              timeRange === '30d'
                ? 'bg-[#2A203F] text-[#F2C94C] font-semibold border border-white/10 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            30 ngày gần nhất
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              timeRange === '90d'
                ? 'bg-[#2A203F] text-[#F2C94C] font-semibold border border-white/10 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            90 ngày gần nhất
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition cursor-pointer ${
              timeRange === 'all'
                ? 'bg-[#2A203F] text-[#F2C94C] font-semibold border border-white/10 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Toàn bộ thời gian
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {totalInPeriod > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#221A33] border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              Bài đã phân tích (Firestore)
            </span>
            <span className="text-2xl font-bold font-mono text-slate-100">{totalInPeriod} bài</span>
            <span className="text-[10px] text-slate-400 font-mono block truncate">
              {firebaseConfig.projectId}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#221A33] border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              Điểm tích cực trung bình
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-2xl font-bold font-mono"
                style={{ color: sentimentMeta.color }}
              >
                {avgSentiment}
              </span>
              <span className="text-xs text-slate-400">/10</span>
            </div>
            <span className="text-[11px] font-semibold block" style={{ color: sentimentMeta.color }}>
              {sentimentMeta.text}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#221A33] border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-rose-400" />
              Căng thẳng trung bình
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-2xl font-bold font-mono"
                style={{ color: stressMeta.color }}
              >
                {avgStress}
              </span>
              <span className="text-xs text-slate-400">/10</span>
            </div>
            <span className="text-[11px] font-semibold block" style={{ color: stressMeta.color }}>
              {stressMeta.text}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#221A33] border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium flex items-center gap-1.5">
              <Heart className="w-3 h-3 text-[#F2994A]" />
              Cảm xúc phổ biến nhất
            </span>
            <span className="text-base font-bold text-slate-200 capitalize truncate block">
              {topEmotion && (EMOTIONS_CONFIG as Record<string, any>)[topEmotion]
                ? `${(EMOTIONS_CONFIG as Record<string, any>)[topEmotion].icon} ${(EMOTIONS_CONFIG as Record<string, any>)[topEmotion].nameVi}`
                : 'Đa dạng'}
            </span>
            <span className="text-[11px] text-slate-400 truncate block">
              Chủ đề: {topTopic ? ((TOPICS_CONFIG as Record<string, any>)[topTopic]?.nameVi || topTopic) : 'Đa dạng'}
            </span>
          </div>
        </div>
      )}

      {/* When no analyzed entries exist for the selected timeframe */}
      {totalInPeriod === 0 ? (
        <div className="p-12 rounded-3xl bg-[#221A33] border border-[#B794F4]/20 text-center space-y-4 max-w-lg mx-auto shadow-xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#2A203F] border border-white/5 flex items-center justify-center text-2xl">
            📊
          </div>
          <h3 className="text-lg font-bold text-slate-100 font-serif-heading">
            Chưa có dữ liệu phân tích trong khoảng thời gian này
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hệ thống chỉ thống kê các bài viết đã được Gemini AI phân tích cảm xúc thành công và lưu trên Firestore. Hãy viết tâm sự mới hoặc mở lại các bài viết cũ trong nhật ký để bấm phân tích.
          </p>
          <button
            type="button"
            onClick={onNavigateToWrite}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] text-xs font-bold hover:brightness-110 transition cursor-pointer"
          >
            Viết và phân tích tâm sự
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* PRIMARY FEATURED RECHARTS LINE CHART */}
          <div className="p-6 sm:p-7 rounded-3xl bg-[#221A33] border border-[#B794F4]/25 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F2C94C]">
                  <TrendingUp className="w-4 h-4" />
                  <span>Biểu đồ đường Recharts (Line Chart)</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-100 font-serif-heading">
                  Sự biến thiên của sentiment_score và stress_level theo thời gian thực
                </h3>
              </div>
              <div className="text-xs text-slate-400 bg-[#181224] px-3 py-1.5 rounded-xl border border-white/5 self-start sm:self-auto font-mono">
                Thang điểm 1 - 10
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Biểu đồ trực quan hóa dữ liệu được phân tích bởi Gemini API và cập nhật theo thời gian thực từ Firestore. Rê chuột hoặc chạm vào từng điểm trên đường biểu đồ để xem chi tiết từng bài viết.
            </p>

            {/* Recharts Line Chart Component */}
            <EmotionTrendLineChart entries={filteredDoneEntries} />
          </div>

          {/* Secondary Breakdown Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart: Emotion distribution */}
            <div className="p-6 rounded-3xl bg-[#221A33] border border-[#B794F4]/15 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#F2994A]" />
                <h3 className="text-base font-bold text-slate-100 font-serif-heading">
                  Phân bố số lượng từng loại cảm xúc
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Thống kê tần suất xuất hiện của các cung bậc cảm xúc trong khoảng thời gian đã chọn
              </p>
              <EmotionDistributionChart entries={filteredDoneEntries} />
            </div>

            {/* Chart: Topics frequency */}
            <div className="p-6 rounded-3xl bg-[#221A33] border border-[#B794F4]/15 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#B794F4]" />
                <h3 className="text-base font-bold text-slate-100 font-serif-heading">
                  Các chủ đề thường gặp
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Lĩnh vực đời sống gắn liền với các suy nghĩ và cảm xúc bạn đã ghi lại
              </p>
              <TopicFrequencyChart entries={filteredDoneEntries} />
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer Footnote */}
      <div className="p-4 rounded-2xl bg-[#181224]/80 border border-[#B794F4]/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#B794F4] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-200">
            Lưu ý quan trọng về tính chất số liệu:
          </p>
          <p>
            Kết quả phân tích chỉ phản ánh nội dung bạn đã viết trong nhật ký nhằm hỗ trợ tự theo dõi xu hướng tinh thần cá nhân, <span className="text-[#F2C94C] font-semibold">tuyệt đối không phải là đánh giá lâm sàng hay chẩn đoán tâm thần học/y khoa</span>.
          </p>
          <p className="italic text-slate-500">
            Nếu bạn đang trải qua những bất ổn nghiêm trọng kéo dài, hãy tìm kiếm sự hỗ trợ chuyên môn từ các bác sĩ tâm lý hoặc chuyên gia sức khỏe y tế.
          </p>
        </div>
      </div>
    </div>
  );
};
