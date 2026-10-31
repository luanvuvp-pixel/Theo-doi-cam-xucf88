import React, { useState } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Tag,
  AlertCircle,
  FileText,
  Download,
  Eye,
  EyeOff,
  CloudUpload,
  Check,
} from 'lucide-react';
import {
  DiaryEntry,
  downloadDiaryTextFile,
  generateTextFileContent,
  generateTextFileName,
} from '../types';
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
import { firestoreService, auth, firebaseConfig } from '../services/firebase';

interface Props {
  entry: DiaryEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (id: string) => void;
  onDeleteRequest: (entry: DiaryEntry) => void;
  isAnalyzing?: boolean;
}

export const EntryDetailModal: React.FC<Props> = ({
  entry,
  isOpen,
  onClose,
  onAnalyze,
  onDeleteRequest,
  isAnalyzing = false,
}) => {
  const [showRawText, setShowRawText] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    exists: boolean;
    path: string;
    databaseId?: string;
  } | null>(null);

  const handleVerifyCloud = async () => {
    if (!entry) return;
    setIsVerifying(true);
    try {
      const uid = entry.userId || auth.currentUser?.uid || '';
      const result = await firestoreService.verifyEntryOnFirebase(uid, entry.id);
      setVerifyResult({
        exists: result.exists,
        path: result.path,
        databaseId: result.databaseId,
      });
    } catch (err: any) {
      console.warn('Verify error:', err);
      setVerifyResult({
        exists: false,
        path: `users/${entry.userId}/entries/${entry.id}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen || !entry) return null;

  const fileName = entry.fileName || generateTextFileName(entry.title, entry.createdAt);
  const textContent = entry.textFileContent || generateTextFileContent(entry);
  const statusBadge = getStatusBadge(entry.status);
  const emotionMeta = entry.emotion ? EMOTIONS_CONFIG[entry.emotion] : null;
  const topicMeta = entry.topic ? TOPICS_CONFIG[entry.topic] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#221A33] border border-[#B794F4]/20 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/5 bg-[#2A203F]/60">
          <div className="space-y-1.5 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadge.className}`}>
                {statusBadge.text}
              </span>
              {emotionMeta && (
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"
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
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#B794F4]" />
                  <span>{topicMeta.nameVi}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-serif-heading">
              {entry.title || 'Tâm sự không tiêu đề'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-[#F2994A]" />
              <span>{formatVietnameseDate(entry.createdAt)}</span>
              {entry.analyzedAt && (
                <span className="text-slate-500 italic">
                  (Phân tích lúc {formatVietnameseDate(entry.analyzedAt)})
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Main Content */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Nội dung tâm sự
            </h4>
            <div className="bg-[#181224] p-4 sm:p-5 rounded-xl border border-white/5 text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
              {entry.content}
            </div>
          </div>

          {/* Analysis Section */}
          {entry.status === 'done' && (
            <div className="space-y-4 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#F2C94C]">
                <Sparkles className="w-4 h-4" />
                <span>Kết quả phân tích khách quan từ Gemini AI</span>
              </div>

              {/* Grid Metrics */}
              {(() => {
                const normSentiment = normalizeSentimentTo10(entry.sentiment_score);
                const normStress = normalizeStressTo10(entry.stress_level);
                const sentDesc = getSentimentDescription(normSentiment);
                const strDesc = getStressDescription(normStress);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Sentiment Card */}
                    <div className="bg-[#2A203F] p-4 rounded-xl border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Điểm cảm xúc tích cực (sentiment_score)</span>
                        <span
                          className="font-bold"
                          style={{
                            color: sentDesc.color,
                          }}
                        >
                          {sentDesc.text}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-slate-100">
                          {normSentiment}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">/ 10 (Thang 1-10)</span>
                      </div>
                      <div className="w-full h-2 bg-[#181224] rounded-full overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(5, normSentiment * 10)}%`,
                            backgroundColor: sentDesc.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stress Card */}
                    <div className="bg-[#2A203F] p-4 rounded-xl border border-white/5 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Mức độ căng thẳng (stress_level)</span>
                        <span
                          className="font-bold"
                          style={{
                            color: strDesc.color,
                          }}
                        >
                          {strDesc.text}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-slate-100">
                          {normStress}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">/ 10 (Thang 1-10)</span>
                      </div>
                      <div className="w-full h-2 bg-[#181224] rounded-full overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(5, normStress * 10)}%`,
                            backgroundColor: strDesc.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Summary Card */}
              {entry.summary && (
                <div className="bg-[#2A203F]/90 p-4 rounded-xl border border-[#B794F4]/20 space-y-1.5">
                  <div className="text-xs font-semibold text-[#B794F4] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Tóm tắt nội dung trung lập</span>
                  </div>
                  <p className="text-sm text-slate-300 italic leading-relaxed">
                    "{entry.summary}"
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-white/5">
                    * AI chỉ tóm lược trần thuật nội dung khách quan, không phán xét, không đưa ra lời khuyên tâm lý hay chẩn đoán bệnh lý y khoa.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pending state */}
          {entry.status === 'pending' && (
            <div className="bg-[#2A203F]/80 p-5 rounded-xl border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-sm font-semibold text-amber-300">Bài viết chưa được phân tích</h4>
                <p className="text-xs text-slate-400">
                  Bấm nút bên cạnh để Gemini AI phân tích sắc thái cảm xúc và mức độ căng thẳng của bài viết này.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAnalyze(entry.id)}
                disabled={isAnalyzing}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] font-bold text-xs hover:brightness-110 transition flex items-center gap-2 whitespace-nowrap shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Phân tích cảm xúc</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Failed state */}
          {entry.status === 'failed' && (
            <div className="bg-rose-950/30 p-5 rounded-xl border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm justify-center sm:justify-start">
                  <AlertCircle className="w-4 h-4" />
                  <span>Phân tích không thành công</span>
                </div>
                <p className="text-xs text-rose-300/80">
                  {entry.errorMessage || 'Lỗi kết nối dịch vụ Gemini AI. Bài viết của bạn vẫn được lưu nguyên vẹn.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onAnalyze(entry.id)}
                disabled={isAnalyzing}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center gap-2 whitespace-nowrap shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang thử lại...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Thử phân tích lại</span>
                  </>
                )}
              </button>
            </div>
          )}
          {/* Firebase Plain Text Storage Card */}
          <div className="bg-[#181224] p-4 sm:p-5 rounded-xl border border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F2994A]" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Lưu trữ trên Firebase: <span className="font-mono text-[#F2C94C]">{fileName}</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Định dạng file text (text/plain) kèm đầy đủ nội dung và phân tích cảm xúc
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVerifyCloud}
                  disabled={isVerifying}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/5 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F2C94C]" />
                  ) : (
                    <CloudUpload className="w-3.5 h-3.5 text-[#F2C94C]" />
                  )}
                  <span>Kiểm tra trên Firebase</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium border border-white/5 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {showRawText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showRawText ? 'Thu gọn' : 'Xem file text'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadDiaryTextFile(entry)}
                  className="px-3 py-1.5 rounded-lg bg-[#F2994A]/20 hover:bg-[#F2994A]/30 text-[#F2C94C] border border-[#F2994A]/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải .txt</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-black/40 p-2 rounded-lg border border-white/5 break-all">
              Đường dẫn Firestore: users/{entry.userId}/entries/{entry.id}
            </div>

            {verifyResult && (
              <div
                className={`p-2.5 rounded-lg text-[11px] border flex items-center gap-2 ${
                  verifyResult.exists
                    ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                }`}
              >
                {verifyResult.exists ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Xác nhận: Document tồn tại trực tiếp trên Firebase Cloud (Dự án: {firebaseConfig.projectId})
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Đang đồng bộ hoặc bài viết lưu cục bộ. Bạn có thể bấm Đẩy dữ liệu lên Firebase trong trang Tài khoản.
                    </span>
                  </>
                )}
              </div>
            )}

            {showRawText && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <pre className="p-3 bg-[#0F0B17] rounded-xl text-[11px] font-mono text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-48 border border-white/5 leading-relaxed selection:bg-[#F2994A]/30">
                  {textContent}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-white/5 bg-[#1E172F]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDeleteRequest(entry)}
              className="flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa bài này</span>
            </button>

            <button
              type="button"
              onClick={() => downloadDiaryTextFile(entry)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition cursor-pointer border border-white/5"
            >
              <Download className="w-3.5 h-3.5 text-[#F2994A]" />
              <span>Tải file text (.txt)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
