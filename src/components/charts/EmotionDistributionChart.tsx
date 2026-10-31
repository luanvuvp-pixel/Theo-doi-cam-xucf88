import React, { useState } from 'react';
import { DiaryEntry, EmotionType } from '../../types';
import { EMOTIONS_CONFIG } from '../../utils/emotionTheme';

interface Props {
  entries: DiaryEntry[];
}

export const EmotionDistributionChart: React.FC<Props> = ({ entries }) => {
  const [hoveredEmotion, setHoveredEmotion] = useState<EmotionType | null>(null);

  // Count emotions
  const counts: Record<EmotionType, number> = {
    'vui vẻ': 0,
    'bình yên': 0,
    'buồn bã': 0,
    'lo lắng': 0,
    'tức giận': 0,
    'thất vọng': 0,
    'cô đơn': 0,
    'căng thẳng': 0,
    'khác': 0,
  };

  let totalAnalyzed = 0;
  entries.forEach((e) => {
    if (e.status === 'done' && e.emotion && counts[e.emotion] !== undefined) {
      counts[e.emotion]++;
      totalAnalyzed++;
    }
  });

  const sortedEmotions = (Object.keys(counts) as EmotionType[])
    .map((emotion) => ({
      emotion,
      count: counts[emotion],
      pct: totalAnalyzed > 0 ? (counts[emotion] / totalAnalyzed) * 100 : 0,
      meta: EMOTIONS_CONFIG[emotion],
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  if (totalAnalyzed === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-sm">Chưa có bài viết nào được phân tích cảm xúc.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar Ribbon */}
      <div className="h-4 w-full bg-[#181224] rounded-full overflow-hidden flex border border-[#3F325E]/50 p-0.5">
        {sortedEmotions.map((item) => (
          <div
            key={item.emotion}
            style={{
              width: `${item.pct}%`,
              backgroundColor: item.meta.color,
            }}
            className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 relative group cursor-pointer"
            onMouseEnter={() => setHoveredEmotion(item.emotion)}
            onMouseLeave={() => setHoveredEmotion(null)}
          />
        ))}
      </div>

      {/* List breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
        {sortedEmotions.map((item) => {
          const isHovered = hoveredEmotion === item.emotion;
          return (
            <div
              key={item.emotion}
              onMouseEnter={() => setHoveredEmotion(item.emotion)}
              onMouseLeave={() => setHoveredEmotion(null)}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isHovered
                  ? 'bg-[#352950] border-[#F2994A]/40 translate-x-1'
                  : 'bg-[#1E172F]/70 border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{item.meta.icon}</span>
                <span className="text-sm font-medium text-slate-200">{item.meta.nameVi}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">
                  {item.count} bài
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: item.meta.bgColor,
                    color: item.meta.color,
                    border: `1px solid ${item.meta.borderColor}`,
                  }}
                >
                  {Math.round(item.pct)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
