import React, { useState } from 'react';
import { DiaryEntry } from '../../types';
import { formatShortDate, getSentimentDescription } from '../../utils/emotionTheme';

interface Props {
  entries: DiaryEntry[];
}

export const SentimentTrendChart: React.FC<Props> = ({ entries }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    entry: DiaryEntry;
    x: number;
    y: number;
  } | null>(null);

  // Filter only done entries and sort chronologically ascending
  const analyzedEntries = entries
    .filter((e) => e.status === 'done' && e.sentiment_score !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (analyzedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
        <span className="text-3xl mb-2">📈</span>
        <p className="text-sm">Chưa có dữ liệu xu hướng điểm cảm xúc.</p>
      </div>
    );
  }

  // Chart dimensions
  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 45 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Convert sentiment score (-1 to 1) to Y coordinate
  // -1 maps to bottom (graphHeight), +1 maps to top (0), 0 maps to middle
  const getY = (score: number) => {
    const clamped = Math.max(-1, Math.min(1, score));
    const normalized = (clamped + 1) / 2; // 0 to 1
    return padding.top + graphHeight * (1 - normalized);
  };

  const zeroY = getY(0);

  // Convert index to X coordinate
  const getX = (index: number) => {
    if (analyzedEntries.length === 1) {
      return padding.left + graphWidth / 2;
    }
    return padding.left + (index / (analyzedEntries.length - 1)) * graphWidth;
  };

  // Generate SVG path points
  const points = analyzedEntries.map((e, i) => ({
    x: getX(i),
    y: getY(e.sentiment_score ?? 0),
    entry: e,
  }));

  const pathData =
    points.length === 1
      ? ''
      : points.reduce((acc, p, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Tích cực (+1.0)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> Cân bằng (0.0)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Tiêu cực (-1.0)
          </span>
        </div>
        <span className="italic text-slate-500">{analyzedEntries.length} điểm ghi nhận</span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[400px] overflow-visible"
        >
          {/* Subtle horizontal grid lines */}
          <line
            x1={padding.left}
            y1={getY(1)}
            x2={width - padding.right}
            y2={getY(1)}
            stroke="#6EE7B7"
            strokeDasharray="4 4"
            strokeOpacity="0.25"
          />
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#94A3B8"
            strokeDasharray="4 4"
            strokeOpacity="0.4"
          />
          <line
            x1={padding.left}
            y1={getY(-1)}
            x2={width - padding.right}
            y2={getY(-1)}
            stroke="#F87171"
            strokeDasharray="4 4"
            strokeOpacity="0.25"
          />

          {/* Y Axis labels */}
          <text x={padding.left - 8} y={getY(1) + 4} textAnchor="end" className="text-[10px] fill-emerald-400 font-mono">
            +1.0
          </text>
          <text x={padding.left - 8} y={zeroY + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
            0.0
          </text>
          <text x={padding.left - 8} y={getY(-1) + 4} textAnchor="end" className="text-[10px] fill-rose-400 font-mono">
            -1.0
          </text>

          {/* Area glow under path */}
          {pathData && (
            <path
              d={`${pathData} L ${points[points.length - 1].x} ${zeroY} L ${points[0].x} ${zeroY} Z`}
              fill="url(#sentimentGradient)"
              opacity="0.3"
            />
          )}

          {/* Connecting line */}
          {pathData && (
            <path
              d={pathData}
              fill="none"
              stroke="#F2C94C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {points.map((p, i) => {
            const score = p.entry.sentiment_score ?? 0;
            const dotColor = score > 0.1 ? '#6EE7B7' : score < -0.1 ? '#F87171' : '#F2C94C';
            return (
              <g key={p.entry.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.entry.id === p.entry.id ? 6 : 4}
                  fill={dotColor}
                  stroke="#181224"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-150 hover:r-6"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Date label for some points */}
                {(points.length <= 8 || i % Math.ceil(points.length / 8) === 0 || i === points.length - 1) && (
                  <text
                    x={p.x}
                    y={height - padding.bottom + 18}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {formatShortDate(p.entry.createdAt)}
                  </text>
                )}
              </g>
            );
          })}

          <defs>
            <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#F2C94C" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#F87171" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating tooltip */}
      {hoveredPoint && (
        <div
          className="absolute z-20 pointer-events-none bg-[#2A203F] border border-[#F2994A]/40 rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-md -translate-x-1/2 -translate-y-full -mt-2"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
          }}
        >
          <div className="font-semibold text-slate-100 max-w-[200px] truncate">
            {hoveredPoint.entry.title || 'Tâm sự không tiêu đề'}
          </div>
          <div className="text-[11px] text-slate-400">
            {formatShortDate(hoveredPoint.entry.createdAt)} • Điểm:{' '}
            <span
              className="font-bold"
              style={{
                color: getSentimentDescription(hoveredPoint.entry.sentiment_score ?? 0).color,
              }}
            >
              {(hoveredPoint.entry.sentiment_score ?? 0) > 0 ? '+' : ''}
              {hoveredPoint.entry.sentiment_score?.toFixed(2)}
            </span>
          </div>
          <div className="text-[11px] text-[#F2C94C]">
            {getSentimentDescription(hoveredPoint.entry.sentiment_score ?? 0).text}
          </div>
        </div>
      )}
    </div>
  );
};
