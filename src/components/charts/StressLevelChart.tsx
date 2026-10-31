import React, { useState } from 'react';
import { DiaryEntry } from '../../types';
import { formatShortDate, getStressDescription } from '../../utils/emotionTheme';

interface Props {
  entries: DiaryEntry[];
}

export const StressLevelChart: React.FC<Props> = ({ entries }) => {
  const [hoveredEntry, setHoveredEntry] = useState<DiaryEntry | null>(null);

  const analyzedEntries = entries
    .filter((e) => e.status === 'done' && e.stress_level !== null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (analyzedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
        <span className="text-3xl mb-2">⚡</span>
        <p className="text-sm">Chưa có dữ liệu mức độ căng thẳng.</p>
      </div>
    );
  }

  // Calculate average stress
  const avgStress = Math.round(
    analyzedEntries.reduce((acc, curr) => acc + (curr.stress_level ?? 0), 0) / analyzedEntries.length
  );

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Mức căng thẳng trung bình:</span>
          <span
            className="font-bold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(242, 153, 74, 0.15)',
              color: getStressDescription(avgStress).color,
              border: '1px solid rgba(242, 153, 74, 0.3)',
            }}
          >
            {avgStress}/100 ({getStressDescription(avgStress).text})
          </span>
        </div>
        <span className="italic text-slate-500">Thang đo 0 - 100</span>
      </div>

      {/* Bar Chart Container */}
      <div className="h-44 w-full flex items-end gap-1.5 sm:gap-2 pt-6 px-1 border-b border-[#3F325E]/50">
        {analyzedEntries.map((e) => {
          const stress = e.stress_level ?? 0;
          const heightPercent = Math.max(8, stress);
          const isHovered = hoveredEntry?.id === e.id;

          let barColor = '#6EE7B7'; // relaxing
          if (stress > 25 && stress <= 50) barColor = '#FDE047'; // mild
          if (stress > 50 && stress <= 75) barColor = '#FB923C'; // moderate
          if (stress > 75) barColor = '#F87171'; // high

          return (
            <div
              key={e.id}
              className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              onMouseEnter={() => setHoveredEntry(e)}
              onMouseLeave={() => setHoveredEntry(null)}
            >
              {/* Bar */}
              <div
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: barColor,
                  boxShadow: isHovered ? `0 0 12px ${barColor}` : undefined,
                }}
                className={`w-full rounded-t-md transition-all duration-200 ${
                  isHovered ? 'brightness-125 scale-y-105' : 'opacity-85'
                }`}
              />

              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 z-30 pointer-events-none bg-[#2A203F] border border-[#F2994A]/40 rounded-lg p-2 text-xs shadow-2xl whitespace-nowrap -translate-x-1/2 left-1/2 backdrop-blur-md">
                  <div className="font-semibold text-slate-100 max-w-[160px] truncate">
                    {e.title || 'Tâm sự không tiêu đề'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {formatShortDate(e.createdAt)} • Căng thẳng: <span className="font-bold text-amber-300">{stress}/100</span>
                  </div>
                  <div className="text-[10px] text-amber-400">{getStressDescription(stress).text}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Axis Date ticks */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
        <span>{formatShortDate(analyzedEntries[0].createdAt)}</span>
        {analyzedEntries.length > 2 && (
          <span>
            {formatShortDate(
              analyzedEntries[Math.floor(analyzedEntries.length / 2)].createdAt
            )}
          </span>
        )}
        <span>{formatShortDate(analyzedEntries[analyzedEntries.length - 1].createdAt)}</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#6EE7B7]" /> Thư giãn (0-25)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#FDE047]" /> Nhẹ nhàng (26-50)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#FB923C]" /> Áp lực vừa (51-75)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-[#F87171]" /> Căng thẳng cao (76-100)
        </span>
      </div>
    </div>
  );
};
