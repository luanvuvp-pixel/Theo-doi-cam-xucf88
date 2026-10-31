export type EmotionType =
  | 'vui vẻ'
  | 'bình yên'
  | 'buồn bã'
  | 'lo lắng'
  | 'tức giận'
  | 'thất vọng'
  | 'cô đơn'
  | 'căng thẳng'
  | 'khác';

export type TopicType =
  | 'học tập'
  | 'công việc'
  | 'gia đình'
  | 'quan hệ'
  | 'tài chính'
  | 'sức khỏe'
  | 'khác';

export type AnalysisStatus = 'pending' | 'done' | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  status: AnalysisStatus;
  emotion: EmotionType | null;
  sentiment_score: number | null; // 1.0 to 10.0 (1: Tiêu cực, 5-6: Cân bằng, 10: Tích cực)
  stress_level: number | null; // 1 to 10 (1: Thư giãn, 10: Cực độ căng thẳng)
  topic: TopicType | null;
  summary: string | null;
  analyzedAt: string | null;
  errorMessage: string | null;
  fileName?: string | null;
  textFileContent?: string | null;
  fileType?: string | null;
}

export type NavTab = 'dashboard' | 'write' | 'journal' | 'analytics' | 'account';

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export function generateTextFileContent(
  entry: {
    title?: string;
    content: string;
    createdAt?: string;
    status?: string;
    emotion?: string | null;
    sentiment_score?: number | null;
    stress_level?: number | null;
    topic?: string | null;
    summary?: string | null;
    analyzedAt?: string | null;
  },
  authorName = 'Người dùng',
  authorEmail = ''
): string {
  const dateStr = entry.createdAt
    ? new Date(entry.createdAt).toLocaleString('vi-VN')
    : new Date().toLocaleString('vi-VN');
  const titleStr = entry.title && entry.title.trim() ? entry.title.trim() : 'Tâm sự không tiêu đề';

  let text = `================================================================================
NHẬT KÝ CẢM XÚC – EMOTION CARE
Tác giả: ${authorName}${authorEmail ? ` (${authorEmail})` : ''}
Thời gian tạo: ${dateStr}
Tiêu đề: ${titleStr}
================================================================================

[NỘI DUNG TÂM SỰ]
${entry.content}

--------------------------------------------------------------------------------
[THÔNG TIN PHÂN TÍCH CẢM XÚC - GEMINI AI]
Trạng thái: ${
    entry.status === 'done'
      ? 'Đã phân tích hoàn tất'
      : entry.status === 'failed'
      ? 'Lỗi phân tích'
      : 'Chưa phân tích (Pending)'
  }
`;

  if (entry.status === 'done') {
    text += `Sắc thái cảm xúc: ${entry.emotion || 'Chưa xác định'}
Điểm cảm xúc (Sentiment Score): ${
      entry.sentiment_score !== null && entry.sentiment_score !== undefined
        ? entry.sentiment_score
        : 'N/A'
    }/10 (Thang điểm từ 1: Rất tiêu cực đến 10: Rất tích cực)
Mức độ căng thẳng (Stress Level): ${
      entry.stress_level !== null && entry.stress_level !== undefined
        ? entry.stress_level
        : 'N/A'
    }/10 (Thang điểm từ 1: Thư giãn đến 10: Căng thẳng cao)
Chủ đề liên quan: ${entry.topic || 'Khác'}
Thời gian phân tích: ${
      entry.analyzedAt ? new Date(entry.analyzedAt).toLocaleString('vi-VN') : 'N/A'
    }

[TÓM TẮT TRUNG LẬP TỪ AI]
${entry.summary || 'Chưa có tóm tắt'}
`;
  }

  text += `--------------------------------------------------------------------------------
* Ghi chú: Dữ liệu được lưu trữ trực tiếp trên Firebase Cloud dưới định dạng file text.
Phân tích được thực hiện tự động và khách quan bởi Gemini AI, chỉ phản ánh nội dung
người dùng đã viết, không phải chẩn đoán y tế hay lời khuyên tâm lý.
================================================================================`;

  return text;
}

export function generateTextFileName(title?: string, createdAt?: string): string {
  const date = createdAt ? new Date(createdAt) : new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const cleanTitle = (title || 'tam-su')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
  return `${cleanTitle}-${yyyy}${mm}${dd}.txt`;
}

export function downloadDiaryTextFile(
  entry: DiaryEntry,
  authorName = 'Người dùng',
  authorEmail = ''
): void {
  const content =
    entry.textFileContent || generateTextFileContent(entry, authorName, authorEmail);
  const fileName = entry.fileName || generateTextFileName(entry.title, entry.createdAt);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
