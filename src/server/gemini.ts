import { GoogleGenAI, Type } from '@google/genai';
import { EmotionType, TopicType } from './db.js';

export interface EmotionAnalysisResult {
  emotion: EmotionType;
  sentiment_score: number;
  stress_level: number;
  topic: TopicType;
  summary: string;
}

const VALID_EMOTIONS: EmotionType[] = [
  'vui vẻ',
  'bình yên',
  'buồn bã',
  'lo lắng',
  'tức giận',
  'thất vọng',
  'cô đơn',
  'căng thẳng',
  'khác',
];

const VALID_TOPICS: TopicType[] = [
  'học tập',
  'công việc',
  'gia đình',
  'quan hệ',
  'tài chính',
  'sức khỏe',
  'khác',
];

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong biến môi trường.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
}

export async function analyzeEmotion(content: string, title?: string): Promise<EmotionAnalysisResult> {
  const ai = getGeminiClient();

  const promptText = `Nội dung tâm sự cần phân tích:${title ? `\nTiêu đề: ${title}` : ''}\nNội dung: ${content}`;

  const systemInstruction = `Bạn là hệ thống phân tích dữ liệu tâm lý học khách quan cho ứng dụng nhật ký cá nhân "Emotion Care".
Nhiệm vụ của bạn là đọc nội dung tâm sự của người dùng và trích xuất chính xác 5 chỉ số dưới dạng JSON.

CÁC NGUYÊN TẮC BẮT BUỘC:
1. Tính khách quan: AI chỉ đóng vai trò phân tích dữ liệu cảm xúc một cách khoa học và trung lập.
2. Tuyệt đối KHÔNG trả lời như chatbot (không xưng hô "tôi", "chúng tôi", "chào bạn", không đưa ra lời động viên hay hỏi han tương tác).
3. Tuyệt đối KHÔNG tự ý đưa ra lời khuyên tâm lý hay chỉ dẫn hành vi (ví dụ: không nói "bạn nên nghỉ ngơi", "hãy hít thở sâu").
4. Tuyệt đối KHÔNG đưa ra kết luận chẩn đoán bệnh lý y khoa hay tâm thần học nào.
5. Trường "emotion": Tên cảm xúc chính bằng tiếng Việt ngắn gọn (ví dụ: "Vui vẻ", "Bình yên", "Buồn bã", "Lo âu", "Tức giận", "Thất vọng", "Cô đơn", "Căng thẳng", "Khác").
6. Trường "sentiment_score": Số thực hoặc nguyên từ 1 đến 10 (1 là cực kỳ tiêu cực, 5-6 là cân bằng/trung tính, 10 là cực kỳ tích cực/lạc quan).
7. Trường "stress_level": Số nguyên từ 1 đến 10 (1 là hoàn toàn thư giãn, không căng thẳng; 5 là mức độ áp lực vừa phải; 10 là cực độ căng thẳng, quá tải).
8. Trường "topic": Chọn duy nhất 1 chủ đề chính từ: "học tập", "công việc", "gia đình", "quan hệ", "tài chính", "sức khỏe", "khác".
9. Trường "summary": 1 đến 2 câu ngắn gọn bằng tiếng Việt mô tả trung thực, trung lập nội dung cốt lõi của bài viết. Giữ giọng văn khách quan, trần thuật góc nhìn thứ ba, không phán xét.`;

  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;
  let responseText: string | undefined;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                emotion: {
                  type: Type.STRING,
                  description:
                    'Tên cảm xúc chính bằng tiếng Việt (ví dụ: Vui vẻ, Bình yên, Buồn bã, Lo âu, Tức giận, Thất vọng, Cô đơn, Căng thẳng, Khác)',
                },
                sentiment_score: {
                  type: Type.NUMBER,
                  description: 'Điểm sắc thái cảm xúc từ 1 (tiêu cực) đến 10 (tích cực)',
                },
                stress_level: {
                  type: Type.INTEGER,
                  description: 'Mức độ căng thẳng từ 1 (thư giãn) đến 10 (cực độ căng thẳng)',
                },
                topic: {
                  type: Type.STRING,
                  description:
                    'Một trong các giá trị: học tập, công việc, gia đình, quan hệ, tài chính, sức khỏe, khác',
                },
                summary: {
                  type: Type.STRING,
                  description: 'Tóm tắt khách quan 1-2 câu tiếng Việt trung lập, không khuyên bảo hay chẩn đoán',
                },
              },
              required: ['emotion', 'sentiment_score', 'stress_level', 'topic', 'summary'],
            },
          },
        });

        if (response.text && response.text.trim()) {
          responseText = response.text.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini attempt ${attempt} with model ${model} failed:`, err.message || err);
        // Short backoff before retry
        await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      }
    }
    if (responseText) break;
  }

  if (!responseText) {
    throw new Error(
      lastError?.message || 'Gemini API không thể hoàn tất phân tích lúc này. Vui lòng thử lại.'
    );
  }

  const rawJson = responseText;
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    throw new Error('Không thể đọc cấu trúc dữ liệu JSON từ phản hồi của Gemini.');
  }

  // Strict normalization & validation
  const rawEmotion = (parsed.emotion || '').trim();
  const lowerEmotion = rawEmotion.toLowerCase();
  let emotion: EmotionType = 'khác';
  if (VALID_EMOTIONS.includes(lowerEmotion as EmotionType)) {
    emotion = lowerEmotion as EmotionType;
  } else if (rawEmotion) {
    // If emotion is a valid variant like 'lo âu' -> 'lo lắng', or capitalized
    if (lowerEmotion.includes('vui') || lowerEmotion.includes('hạnh phúc')) emotion = 'vui vẻ';
    else if (lowerEmotion.includes('bình yên') || lowerEmotion.includes('thư thái')) emotion = 'bình yên';
    else if (lowerEmotion.includes('buồn')) emotion = 'buồn bã';
    else if (lowerEmotion.includes('lo')) emotion = 'lo lắng';
    else if (lowerEmotion.includes('giận')) emotion = 'tức giận';
    else if (lowerEmotion.includes('thất vọng')) emotion = 'thất vọng';
    else if (lowerEmotion.includes('cô đơn')) emotion = 'cô đơn';
    else if (lowerEmotion.includes('căng thẳng') || lowerEmotion.includes('áp lực')) emotion = 'căng thẳng';
    else emotion = 'khác';
  }

  const normalizedTopic = (parsed.topic || '').toLowerCase().trim();
  const topic: TopicType = VALID_TOPICS.includes(normalizedTopic as TopicType)
    ? (normalizedTopic as TopicType)
    : 'khác';

  // Sentiment score on 1-10 scale
  let sentiment_score = Number(parsed.sentiment_score);
  if (isNaN(sentiment_score)) sentiment_score = 5.5;
  if (sentiment_score < 0) {
    // Map legacy -1..1 to 1..10
    sentiment_score = ((sentiment_score + 1) / 2) * 9 + 1;
  }
  sentiment_score = Math.max(1, Math.min(10, Math.round(sentiment_score * 10) / 10));

  // Stress level on 1-10 scale
  let stress_level = Number(parsed.stress_level);
  if (isNaN(stress_level)) stress_level = 5;
  if (stress_level > 10) {
    // Map legacy 0..100 to 1..10
    stress_level = Math.round(stress_level / 10);
  }
  stress_level = Math.max(1, Math.min(10, Math.round(stress_level)));

  const summary =
    typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
      ? parsed.summary.trim()
      : 'Bản ghi nhận lại cảm xúc và suy nghĩ cá nhân của tác giả.';

  return {
    emotion,
    sentiment_score,
    stress_level,
    topic,
    summary,
  };
}
