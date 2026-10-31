import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { DiaryEntry } from '../../types';
import {
  EMOTIONS_CONFIG,
  formatShortDate,
  formatVietnameseDate,
  getSentimentDescription,
  getStressDescription,
  normalizeSentimentTo10,
  normalizeStressTo10,
} from '../../utils/emotionTheme';
import { Activity, Heart, Info, Sparkles, TrendingUp } from 'lucide-react';

interface Props {
  entries: DiaryEntry[];
}

export const EmotionTrendLineChart: React.FC<Props> = ({ entries }) => {
  const [viewMode, setViewMode] = useState<'both' | 'sentiment' | 'stress'>('both');

  // Filter only 'done' entries and sort chronologically ascending
  const chartData = entries
    .filter((e) => e.status === 'done' && (e.sentiment_score !== null || e.stress_level !== null))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((e, index) => {
      const sentimentScore = normalizeSentimentTo10(e.sentiment_score);
      const stressLevel = normalizeStressTo10(e.stress_level);
      const emotionMeta = e.emotion ? EMOTIONS_CONFIG[e.emotion] : null;

      return {
        id: e.id,
        index: index + 1,
        title: e.title?.trim() || 'Tâm sự không tiêu đề',
        createdAt: e.createdAt,
        shortDate: formatShortDate(e.createdAt),
        fullDate: formatVietnameseDate(e.createdAt),
        sentiment_score: sentimentScore,
        stress_level: stressLevel,
        emotion: e.emotion || 'khác',
        emotionLabel: emotionMeta?.nameVi || e.emotion || 'Khác',
        emotionIcon: emotionMeta?.icon || '✨',
        emotionColor: emotionMeta?.color || '#B794F4',
        summary: e.summary || 'Chưa có tóm tắt.',
        topic: e.topic || 'khác',
      };
    });

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-[#1C162A]/60 border border-white/5 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#2A203F] border border-white/5 flex items-center justify-center text-2xl">
          📈
        </div>
        <h4 className="text-sm font-semibold text-slate-200">
          Chưa có dữ liệu phân tích cảm xúc từ Gemini
        </h4>
        <p className="text-xs text-slate-400 max-w-sm">
          Biểu đồ đường Recharts sẽ tự động vẽ sự biến thiên của Điểm tích cực và Mức độ căng thẳng (thang điểm 1-10) ngay khi bạn lưu và phân tích bài viết đầu tiên.
        </p>
      </div>
    );
  }

  // Calculate current/latest status
  const latestEntry = chartData[chartData.length - 1];
  const sentimentDesc = getSentimentDescription(latestEntry.sentiment_score);
  const stressDesc = getStressDescription(latestEntry.stress_level);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const sentDesc = getSentimentDescription(data.sentiment_score);
      const strDesc = getStressDescription(data.stress_level);

      return (
        <div className="p-3.5 rounded-2xl bg-[#1F1730]/95 backdrop-blur-md border border-[#F2994A]/35 shadow-2xl text-xs space-y-2.5 max-w-[280px]">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <span className="font-mono text-[11px] text-[#F2C94C] font-semibold">
              {data.fullDate}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1"
              style={{
                backgroundColor: `${data.emotionColor}20`,
                color: data.emotionColor,
                border: `1px solid ${data.emotionColor}40`,
              }}
            >
              <span>{data.emotionIcon}</span>
              <span>{data.emotionLabel}</span>
            </span>
          </div>

          <div className="font-semibold text-slate-100 text-sm truncate font-serif-heading">
            {data.title}
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Điểm tích cực:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {data.sentiment_score}/10{' '}
                <span className="font-normal text-[10px] text-slate-400">
                  ({sentDesc.text})
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
                <span>Mức độ căng thẳng:</span>
              </span>
              <span className="font-mono font-bold text-rose-400">
                {data.stress_level}/10{' '}
                <span className="font-normal text-[10px] text-slate-400">
                  ({strDesc.text})
                </span>
              </span>
            </div>
          </div>

          {data.summary && (
            <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 italic leading-relaxed line-clamp-3">
              "{data.summary}"
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Chart Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1C162A]/80 p-3 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#251D38] p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                viewMode === 'both'
                  ? 'bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cả hai chỉ số
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sentiment')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'sentiment'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>Điểm tích cực</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('stress')}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'stress'
                  ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#F43F5E]" />
              <span>Mức căng thẳng</span>
            </button>
          </div>
        </div>

        {/* Real-time Firestore sync status */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-emerald-300">Firebase Firestore Real-time</span>
          <span className="text-slate-500">• {chartData.length} điểm dữ liệu</span>
        </div>
      </div>

      {/* Highlights Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#10B981]/10 to-transparent border border-[#10B981]/25 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Điểm tích cực gần nhất (sentiment_score)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-300">
                {latestEntry.sentiment_score}
                <span className="text-xs text-slate-400 font-normal">/10</span>
              </span>
              <span className="text-xs font-semibold" style={{ color: sentimentDesc.color }}>
                {sentimentDesc.text}
              </span>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-400/15 text-emerald-300 font-mono border border-emerald-400/20">
            {latestEntry.shortDate}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F43F5E]/10 to-transparent border border-[#F43F5E]/25 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              Mức độ căng thẳng gần nhất (stress_level)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-rose-300">
                {latestEntry.stress_level}
                <span className="text-xs text-slate-400 font-normal">/10</span>
              </span>
              <span className="text-xs font-semibold" style={{ color: stressDesc.color }}>
                {stressDesc.text}
              </span>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-400/15 text-rose-300 font-mono border border-rose-400/20">
            {latestEntry.shortDate}
          </span>
        </div>
      </div>

      {/* Main Recharts Line Chart */}
      <div className="w-full h-80 sm:h-96 pt-3 pr-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 15, right: 15, left: -10, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#382E54"
              strokeOpacity={0.6}
              vertical={false}
            />

            <XAxis
              dataKey="shortDate"
              stroke="#718096"
              tick={{ fill: '#A0AEC0', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#4A5568' }}
              axisLine={{ stroke: '#4A5568' }}
            />

            <YAxis
              domain={[1, 10]}
              ticks={[1, 3, 5, 7, 9, 10]}
              stroke="#718096"
              tick={{ fill: '#A0AEC0', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#4A5568' }}
              axisLine={{ stroke: '#4A5568' }}
              label={{
                value: 'Thang điểm (1 - 10)',
                angle: -90,
                position: 'insideLeft',
                offset: 20,
                style: { fill: '#718096', fontSize: 10 },
              }}
            />

            {/* Baseline for balance at 5.5 */}
            <ReferenceLine
              y={5.5}
              stroke="#F2C94C"
              strokeDasharray="4 4"
              strokeOpacity={0.35}
              label={{
                value: 'Ngưỡng trung tính (5.5)',
                position: 'right',
                fill: '#F2C94C',
                fontSize: 10,
                opacity: 0.6,
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '16px' }}
              formatter={(value) => {
                if (value === 'sentiment_score') {
                  return (
                    <span className="text-xs font-semibold text-emerald-300">
                      Điểm tích cực (sentiment_score)
                    </span>
                  );
                }
                if (value === 'stress_level') {
                  return (
                    <span className="text-xs font-semibold text-rose-300">
                      Mức căng thẳng (stress_level)
                    </span>
                  );
                }
                return value;
              }}
            />

            {/* Line 1: sentiment_score (Emerald) */}
            {(viewMode === 'both' || viewMode === 'sentiment') && (
              <Line
                type="monotone"
                dataKey="sentiment_score"
                name="sentiment_score"
                stroke="#10B981"
                strokeWidth={3}
                dot={{
                  r: 4.5,
                  fill: '#10B981',
                  stroke: '#181224',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 7,
                  fill: '#34D399',
                  stroke: '#FFFFFF',
                  strokeWidth: 2.5,
                }}
              />
            )}

            {/* Line 2: stress_level (Rose) */}
            {(viewMode === 'both' || viewMode === 'stress') && (
              <Line
                type="monotone"
                dataKey="stress_level"
                name="stress_level"
                stroke="#F43F5E"
                strokeWidth={3}
                strokeDasharray={viewMode === 'both' ? '6 4' : undefined}
                dot={{
                  r: 4.5,
                  fill: '#F43F5E',
                  stroke: '#181224',
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 7,
                  fill: '#FB7185',
                  stroke: '#FFFFFF',
                  strokeWidth: 2.5,
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Scale guide footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-slate-400 border-t border-white/5">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span>Điểm tích cực: 1 (Cực kỳ tiêu cực) &rarr; 10 (Cực kỳ tích cực)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
            <span>Mức căng thẳng: 1 (Thư giãn) &rarr; 10 (Căng thẳng cao)</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 italic">
          <Info className="w-3.5 h-3.5" />
          <span>Biểu đồ tự động cập nhật từ Firestore khi có bài viết mới</span>
        </div>
      </div>
    </div>
  );
};
