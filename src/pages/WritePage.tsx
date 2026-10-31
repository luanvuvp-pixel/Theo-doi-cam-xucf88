import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  Feather,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  Check,
  FileText,
  Download,
  CloudCheck,
  CloudUpload,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { api } from '../utils/api';
import {
  DiaryEntry,
  User,
  generateTextFileContent,
  generateTextFileName,
  downloadDiaryTextFile,
} from '../types';
import { firestoreService, auth, firebaseConfig } from '../services/firebase';

interface Props {
  user?: User | null;
  onEntryCreated: (entry: DiaryEntry) => void;
  onNavigateToJournal: () => void;
}

export const WritePage: React.FC<Props> = ({ user, onEntryCreated, onNavigateToJournal }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSavingPending, setIsSavingPending] = useState(false);
  const [isSavingWithAI, setIsSavingWithAI] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [lastSavedEntry, setLastSavedEntry] = useState<DiaryEntry | null>(null);
  const [isVerifyingCloud, setIsVerifyingCloud] = useState(false);
  const [cloudVerificationData, setCloudVerificationData] = useState<{
    verified: boolean;
    path: string;
    fieldsCount?: number;
    databaseId?: string;
    projectId?: string;
  } | null>(null);

  const prompts = [
    'Hôm nay điều gì làm bạn bận tâm hoặc lo lắng nhất?',
    'Có khoảnh khắc nào trong ngày giúp bạn cảm thấy nhẹ nhõm hơn?',
    'Bạn đang cảm thấy áp lực từ công việc, học tập hay các mối quan hệ?',
    'Điều gì bạn chưa thể nói ra với ai và muốn giải tỏa tại đây?',
  ];

  const handleSaveOnly = async () => {
    if (!content.trim()) {
      setErrorMessage('Vui lòng viết đôi dòng tâm sự trước khi lưu.');
      return;
    }

    if (!auth.currentUser) {
      setErrorMessage(
        'Bạn cần đăng nhập tài khoản Firebase để lưu và đẩy trực tiếp file text lên cơ sở dữ liệu Firebase Firestore.'
      );
      return;
    }

    setErrorMessage(null);
    setCloudVerificationData(null);
    setIsSavingPending(true);

    const effectiveUserId = auth.currentUser.uid;
    const entryId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const authorName = auth.currentUser.displayName || user?.name || 'Người dùng';
    const authorEmail = auth.currentUser.email || user?.email || '';
    const fileName = generateTextFileName(title.trim(), createdAt);

    const baseEntry: DiaryEntry = {
      id: entryId,
      userId: effectiveUserId,
      title: title.trim(),
      content: content.trim(),
      createdAt,
      status: 'pending',
      emotion: null,
      sentiment_score: null,
      stress_level: null,
      topic: null,
      summary: null,
      analyzedAt: null,
      errorMessage: null,
      fileName,
      fileType: 'text/plain',
    };

    const textFileContent = generateTextFileContent(baseEntry, authorName, authorEmail);
    baseEntry.textFileContent = textFileContent;

    try {
      // 1. Mandatory Core: Save file text directly to Firebase Firestore
      await firestoreService.addEntry(effectiveUserId, baseEntry);

      // 2. Also mirror to local API for comprehensive offline analytics
      try {
        await api.entries.create({
          id: entryId,
          title: title.trim(),
          content: content.trim(),
          analyzeImmediately: false,
          fileName,
          textFileContent,
          fileType: 'text/plain',
        });
      } catch (localErr) {
        console.warn('Local database mirror note:', localErr);
      }

      setLastSavedEntry(baseEntry);
      setSuccessNotice(
        `Đã lưu và đẩy file text thành công lên Firebase Firestore: ${fileName}`
      );
      setTitle('');
      setContent('');
      onEntryCreated(baseEntry);
    } catch (err: any) {
      console.error('Lỗi khi lưu lên Firebase Firestore:', err);
      setErrorMessage(
        `Không thể lưu lên Firebase: ${
          err.message || 'Lỗi kết nối Firestore. Vui lòng kiểm tra lại quyền truy cập.'
        }`
      );
    } finally {
      setIsSavingPending(false);
    }
  };

  const handleSaveAndAnalyze = async () => {
    if (!content.trim()) {
      setErrorMessage('Vui lòng viết đôi dòng tâm sự trước khi phân tích.');
      return;
    }

    if (!auth.currentUser) {
      setErrorMessage(
        'Bạn cần đăng nhập tài khoản Firebase để lưu và đẩy trực tiếp file text lên cơ sở dữ liệu Firebase Firestore.'
      );
      return;
    }

    setErrorMessage(null);
    setCloudVerificationData(null);
    setIsSavingWithAI(true);

    const effectiveUserId = auth.currentUser.uid;
    const entryId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const authorName = auth.currentUser.displayName || user?.name || 'Người dùng';
    const authorEmail = auth.currentUser.email || user?.email || '';

    // Step 1: Request Gemini AI emotion analysis
    let analysisResult: any = null;
    let analysisError: string | null = null;
    try {
      const res = await api.entries.analyzeEmotionText(content.trim(), title.trim());
      analysisResult = res.result;
    } catch (aiErr: any) {
      console.warn('Lỗi phân tích AI:', aiErr);
      analysisError = aiErr.message || 'Dịch vụ AI đang bận hoặc quá tải.';
    }

    const isSuccess = Boolean(analysisResult && analysisResult.emotion);
    const status = isSuccess ? 'done' : 'failed';
    const analyzedAt = isSuccess ? new Date().toISOString() : null;

    const baseEntry: DiaryEntry = {
      id: entryId,
      userId: effectiveUserId,
      title: title.trim(),
      content: content.trim(),
      createdAt,
      status,
      emotion: analysisResult?.emotion || null,
      sentiment_score: analysisResult?.sentiment_score ?? null,
      stress_level: analysisResult?.stress_level ?? null,
      topic: analysisResult?.topic || null,
      summary: analysisResult?.summary || null,
      analyzedAt,
      errorMessage: analysisError,
      fileType: 'text/plain',
    };

    const fileName = generateTextFileName(title.trim(), createdAt);
    const textFileContent = generateTextFileContent(baseEntry, authorName, authorEmail);
    baseEntry.fileName = fileName;
    baseEntry.textFileContent = textFileContent;

    try {
      // 2. Mandatory Core: Save text file directly to Firebase Firestore
      await firestoreService.addEntry(effectiveUserId, baseEntry);

      // 3. Mirror to server database
      try {
        await api.entries.create({
          id: entryId,
          title: title.trim(),
          content: content.trim(),
          analyzeImmediately: false,
          fileName,
          textFileContent,
          fileType: 'text/plain',
        });
      } catch (srvErr) {
        console.warn('Local database mirror note:', srvErr);
      }

      setLastSavedEntry(baseEntry);
      if (isSuccess) {
        setSuccessNotice(
          `Đã đẩy file text lên Firebase Firestore (${fileName}) và phân tích cảm xúc thành công!`
        );
      } else {
        setSuccessNotice(
          `Đã đẩy file text an toàn lên Firebase (${fileName}). Bạn có thể thử phân tích lại bất cứ lúc nào trong Nhật ký.`
        );
      }
      setTitle('');
      setContent('');
      onEntryCreated(baseEntry);
    } catch (err: any) {
      console.error('Lỗi khi lưu lên Firebase Firestore:', err);
      setErrorMessage(
        `Không thể lưu lên Firebase: ${
          err.message || 'Lỗi quyền ghi Firebase Firestore. Vui lòng thử lại.'
        }`
      );
    } finally {
      setIsSavingWithAI(false);
    }
  };

  const handleVerifyOnCloud = async () => {
    if (!lastSavedEntry || !auth.currentUser) return;
    setIsVerifyingCloud(true);
    try {
      const result = await firestoreService.verifyEntryOnFirebase(
        auth.currentUser.uid,
        lastSavedEntry.id
      );
      if (result.exists) {
        setCloudVerificationData({
          verified: true,
          path: result.path,
          fieldsCount: result.data ? Object.keys(result.data).length : 0,
          databaseId: result.databaseId,
          projectId: result.projectId,
        });
      } else {
        setCloudVerificationData({
          verified: false,
          path: result.path,
          databaseId: result.databaseId,
          projectId: result.projectId,
        });
      }
    } catch (err: any) {
      console.error('Lỗi kiểm tra cloud:', err);
      setErrorMessage(`Kiểm tra Firestore thất bại: ${err.message || err}`);
    } finally {
      setIsVerifyingCloud(false);
    }
  };

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F2994A]">
          <Feather className="w-3.5 h-3.5" />
          <span>Ghi chép cảm xúc & Đẩy file text trực tiếp lên Firebase Cloud</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-100">
          Viết ra những điều chất chứa trong lòng
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Không gian riêng tư, bảo mật. Toàn bộ nội dung và phân tích cảm xúc được lưu dưới dạng file text trên Firebase Firestore.
        </p>
      </div>

      {/* Firebase Status Badge */}
      <div className="p-3 px-4 rounded-2xl bg-[#221A33]/90 border border-[#F2994A]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">
            Điểm lưu trữ: Firebase Firestore
          </span>
          <span className="font-mono text-[#F2C94C] bg-[#181224] px-2 py-0.5 rounded border border-white/5">
            {firebaseConfig.projectId}
          </span>
        </div>
        <div className="text-slate-400 font-mono text-[11px] truncate">
          users/{auth.currentUser?.uid ? `${auth.currentUser.uid.substring(0, 10)}...` : 'chưa_đăng_nhập'}/entries
        </div>
      </div>

      {/* Prompts Inspiration Pills */}
      <div className="p-4 rounded-2xl bg-[#221A33]/80 border border-white/5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F2C94C]">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Gợi ý mở đầu:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (!content) setContent(`${p}\n\n`);
                else setContent((prev) => `${prev}\n\n${p}\n`);
              }}
              className="text-xs px-3 py-1.5 rounded-xl bg-[#2A203F] hover:bg-[#352950] text-slate-300 hover:text-white border border-white/5 hover:border-[#F2994A]/30 transition text-left cursor-pointer"
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Thông báo lỗi:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Success & Firebase Confirmation Card */}
      {successNotice && lastSavedEntry && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C2620] to-[#181A2F] border border-emerald-500/40 shadow-xl space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={onNavigateToJournal}
              className="text-xs text-[#F2C94C] hover:text-[#F2994A] font-semibold underline cursor-pointer shrink-0"
            >
              Xem danh sách Nhật ký &rarr;
            </button>
          </div>

          {/* Details of the stored text file */}
          <div className="bg-[#12181F]/90 p-3.5 rounded-xl border border-emerald-500/20 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F2994A]" />
                <span className="font-mono text-slate-200 font-bold">
                  {lastSavedEntry.fileName}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  text/plain (Firebase Firestore)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Kích thước: {lastSavedEntry.textFileContent?.length || 0} ký tự
              </span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono break-all bg-black/40 p-2 rounded-lg border border-white/5">
              Đường dẫn Firestore: users/{lastSavedEntry.userId}/entries/{lastSavedEntry.id}
            </div>

            {/* Cloud Verification Output */}
            {cloudVerificationData && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                  <span>Xác nhận: Document đã tồn tại trên Firestore Cloud!</span>
                </div>
                <div className="text-slate-300">
                  • Dự án: <span className="font-mono">{cloudVerificationData.projectId}</span>
                </div>
                <div className="text-slate-300">
                  • Database: <span className="font-mono">{cloudVerificationData.databaseId}</span>
                </div>
                <div className="text-slate-300">
                  • Số trường dữ liệu: {cloudVerificationData.fieldsCount} (bao gồm textFileContent, content, status)
                </div>
              </div>
            )}
          </div>

          {/* Action buttons on saved entry */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleVerifyOnCloud}
              disabled={isVerifyingCloud}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isVerifyingCloud ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F2C94C]" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5 text-[#F2C94C]" />
              )}
              <span>Kiểm tra trên Firebase Cloud</span>
            </button>

            <button
              type="button"
              onClick={() =>
                downloadDiaryTextFile(
                  lastSavedEntry,
                  auth.currentUser?.displayName || user?.name || 'Người dùng',
                  auth.currentUser?.email || user?.email || ''
                )
              }
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file .txt về máy</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSuccessNotice(null);
                setLastSavedEntry(null);
                setCloudVerificationData(null);
              }}
              className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 transition ml-auto cursor-pointer"
            >
              Đóng thông báo
            </button>
          </div>
        </div>
      )}

      {/* Main Journal Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#221A33] border border-[#B794F4]/20 shadow-xl space-y-5">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Tiêu đề bài viết <span className="text-slate-500 font-normal">(không bắt buộc)</span>
          </label>
          <input
            type="text"
            placeholder="Đặt một tựa đề cho tâm trạng hôm nay..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#181224] border border-white/10 rounded-2xl px-4 py-3 text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2994A] transition font-serif-heading"
          />
        </div>

        {/* Content Multiline Area */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <label className="font-semibold text-slate-300">Nội dung tâm sự *</label>
            <span className="font-mono text-slate-500">
              {wordCount} từ • {charCount} ký tự
            </span>
          </div>
          <textarea
            rows={10}
            required
            placeholder="Hôm nay tâm trạng của bạn thế nào? Điều gì đang diễn ra trong suy nghĩ của bạn..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-[#181224] border border-white/10 rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2994A] transition leading-relaxed resize-y"
          />
        </div>

        {/* Privacy Notice Required by Prompt */}
        <div className="p-4 rounded-2xl bg-[#181224]/80 border border-[#B794F4]/15 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#B794F4] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed space-y-1">
            <p className="font-semibold text-slate-300">
              Chính sách minh bạch & bảo vệ riêng tư:
            </p>
            <p>
              Khi bạn chọn <span className="text-[#F2C94C] font-semibold">“Lưu và phân tích cảm xúc”</span>, nội dung bài viết sẽ được gửi tới dịch vụ Gemini AI để phân tích sắc thái cảm xúc, mức độ căng thẳng và chủ đề chính, sau đó lưu thành file text hoàn chỉnh trên Firebase.
            </p>
            <p className="italic text-slate-500">
              * AI chỉ đóng vai trò phân tích dữ liệu cảm xúc khách quan, trung lập; tuyệt đối không trả lời như chatbot, không tự ý đưa ra lời khuyên tâm lý hay chẩn đoán bệnh lý y khoa. Nếu bạn chỉ muốn lưu trữ riêng tư, hãy chọn <span className="text-slate-300 font-semibold">“Lưu tâm sự”</span>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-3.5">
          {/* Button 1: Save Only (Pending) */}
          <button
            type="button"
            onClick={handleSaveOnly}
            disabled={isSavingPending || isSavingWithAI || !content.trim()}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/15 bg-[#2A203F] hover:bg-[#352950] text-slate-200 text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            {isSavingPending ? (
              <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 text-slate-300" />
            )}
            <span>Lưu tâm sự lên Firebase (Chưa phân tích)</span>
          </button>

          {/* Button 2: Save and Analyze with AI */}
          <button
            type="button"
            onClick={handleSaveAndAnalyze}
            disabled={isSavingPending || isSavingWithAI || !content.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] text-xs sm:text-sm font-bold hover:brightness-110 transition flex items-center justify-center gap-2 shadow-lg glow-amber cursor-pointer disabled:opacity-40"
          >
            {isSavingWithAI ? (
              <>
                <div className="w-4 h-4 border-2 border-[#181224] border-t-transparent rounded-full animate-spin" />
                <span>Đang phân tích & đẩy lên Firebase...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Lưu & Phân tích cảm xúc lên Firebase</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
