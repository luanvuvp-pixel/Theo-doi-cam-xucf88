import React from 'react';
import { DiaryEntry, TopicType } from '../../types';
import { TOPICS_CONFIG } from '../../utils/emotionTheme';

interface Props {
  entries: DiaryEntry[];
}

export const TopicFrequencyChart: React.FC<Props> = ({ entries }) => {
  const counts: Record<TopicType, number> = {
    'học tập': 0,
    'công việc': 0,
    'gia đình': 0,
    'quan hệ': 0,
    'tài chính': 0,
    'sức khỏe': 0,
    'khác': 0,
  };

  let totalAnalyzed = 0;
  entries.forEach((e) => {
    if (e.status === 'done' && e.topic && counts[e.topic] !== undefined) {
      counts[e.topic]++;
      totalAnalyzed++;
    }
  });

  const sortedTopics = (Object.keys(counts) as TopicType[])
    .map((topic) => ({
      topic,
      count: counts[topic],
      pct: totalAnalyzed > 0 ? (counts[topic] / totalAnalyzed) * 100 : 0,
      meta: TOPICS_CONFIG[topic],
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  if (totalAnalyzed === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
        <span className="text-3xl mb-2">🏷️</span>
        <p className="text-sm">Chưa có dữ liệu chủ đề được phân tích.</p>
      </div>
    );
  }

  const maxCount = Math.max(...sortedTopics.map((t) => t.count), 1);

  return (
    <div className="space-y-3">
      {sortedTopics.map((item) => {
        const barWidth = Math.max(6, (item.count / maxCount) * 100);
        return (
          <div key={item.topic} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200 capitalize">{item.meta.nameVi}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">{item.count} bài</span>
                <span className="text-slate-500 font-mono">({Math.round(item.pct)}%)</span>
              </div>
            </div>
            <div className="h-3 w-full bg-[#181224] rounded-full overflow-hidden p-0.5 border border-white/5">
              <div
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: item.meta.color,
                }}
                className="h-full rounded-full transition-all duration-500 shadow-sm"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
