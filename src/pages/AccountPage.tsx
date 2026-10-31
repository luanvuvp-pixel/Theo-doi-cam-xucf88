import React, { useEffect, useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Key,
  ShieldCheck,
  Download,
  LogOut,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  Flame,
  ExternalLink,
  CloudUpload,
  RefreshCw,
} from 'lucide-react';
import { DiaryEntry, User } from '../types';
import { api } from '../utils/api';
import { formatVietnameseDate } from '../utils/emotionTheme';
import { firebaseConfig, firestoreService } from '../services/firebase';

interface Props {
  user: User;
  entries: DiaryEntry[];
  onLogout: () => void;
}

export const AccountPage: React.FC<Props> = ({ user, entries, onLogout }) => {
  const [geminiStatus, setGeminiStatus] = useState<{
    geminiConfigured: boolean;
    status: string;
    timestamp: string;
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSyncToFirebase = async () => {
    setIsSyncingFirebase(true);
    setSyncFeedback(null);
    try {
      await firestoreService.saveUserProfile(user);
      const res = await firestoreService.syncAllEntriesToFirestore(user.id, entries);
      setSyncFeedback({
        type: 'success',
        text: `Đã đẩy thành công hồ sơ và ${res.syncedCount} bài tâm sự dạng file text (.txt) lên Firebase Firestore tại: ${res.path}`,
      });
    } catch (err: any) {
      console.error('Lỗi khi đẩy lên Firebase:', err);
      setSyncFeedback({
        type: 'error',
        text: err.message || 'Không thể đồng bộ lên Firebase. Vui lòng thử lại.',
      });
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  useEffect(() => {
    api.system
      .getStatus()
      .then((res) => {
        setGeminiStatus(res);
      })
      .catch((err) => {
        console.error('Lỗi kiểm tra trạng thái API:', err);
      })
      .finally(() => {
        setLoadingStatus(false);
      });
  }, []);

  const totalWords = entries.reduce(
    (acc, curr) => acc + (curr.content ? curr.content.trim().split(/\s+/).length : 0),
    0
  );

  const totalChars = entries.reduce(
    (acc, curr) => acc + (curr.content ? curr.content.length : 0),
    0
  );

  const handleDownloadBackup = () => {
    const downloadUrl = api.entries.getExportJsonUrl();
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `emotion-care-backup-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading text-slate-100">
          Tài khoản & Thiết lập
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Quản lý thông tin cá nhân, quyền bảo mật và kết nối hệ thống
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#221A33] border border-[#B794F4]/20 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F2994A] to-[#B794F4] p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#181224] rounded-2xl flex items-center justify-center text-2xl font-bold text-[#F2C94C]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100 font-serif-heading">
                {user.name}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>

        {/* Detailed User Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-[#181224]/70 border border-white/5 flex items-start gap-3">
            <UserIcon className="w-4 h-4 text-[#F2994A] shrink-0 mt-0.5" />
            <div className="space-y-0.5 overflow-hidden">
              <span className="text-[11px] text-slate-400 block">Tên hiển thị</span>
              <span className="text-sm font-semibold text-slate-200">{user.name}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#181224]/70 border border-white/5 flex items-start gap-3">
            <Mail className="w-4 h-4 text-[#F2C94C] shrink-0 mt-0.5" />
            <div className="space-y-0.5 overflow-hidden">
              <span className="text-[11px] text-slate-400 block">Địa chỉ Email</span>
              <span className="text-sm font-semibold text-slate-200 truncate block">
                {user.email}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#181224]/70 border border-white/5 flex items-start gap-3">
            <Key className="w-4 h-4 text-[#B794F4] shrink-0 mt-0.5" />
            <div className="space-y-0.5 overflow-hidden">
              <span className="text-[11px] text-slate-400 block">Mã định danh (User ID)</span>
              <span className="text-xs font-mono text-slate-300 truncate block" title={user.id}>
                {user.id}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#181224]/70 border border-white/5 flex items-start gap-3">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 overflow-hidden">
              <span className="text-[11px] text-slate-400 block">Thời gian tạo tài khoản</span>
              <span className="text-xs text-slate-200">
                {formatVietnameseDate(user.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI Status Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#221A33] border border-[#B794F4]/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F2C94C]" />
            <h3 className="text-lg font-bold text-slate-100 font-serif-heading">
              Trạng thái kết nối Gemini AI
            </h3>
          </div>
          {loadingStatus ? (
            <div className="w-4 h-4 border-2 border-[#F2C94C] border-t-transparent rounded-full animate-spin" />
          ) : geminiStatus?.geminiConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã kết nối và sẵn sàng</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Chờ khóa API</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Emotion Care sử dụng mô hình <strong className="text-slate-100 font-mono">gemini-3.8-flash</strong> với cấu hình hệ thống chuyên biệt để phân tích sắc thái cảm xúc khách quan và trích xuất dữ liệu JSON chuẩn mực.
        </p>

        <div className="p-4 rounded-2xl bg-[#181224] border border-white/5 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Mô hình phân tích:</span>
            <span className="text-slate-200 font-mono">gemini-3.8-flash</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Phương thức gọi:</span>
            <span className="text-slate-200">Server-Side Proxy (Bảo mật tuyệt đối)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Định dạng trả về:</span>
            <span className="text-slate-200 font-mono">application/json (Structured Schema)</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Quy tắc AI:</span>
            <span className="text-amber-300 font-medium">Trung lập • Không tư vấn • Không chẩn đoán</span>
          </div>
        </div>
      </div>

      {/* Firebase Console & Cloud Database Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#221A33] border border-[#F2994A]/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#F2994A]" />
            <h3 className="text-lg font-bold text-slate-100 font-serif-heading">
              Cơ sở dữ liệu Firebase Console
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã kết nối Firestore Cloud</span>
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Dữ liệu nhật ký và hồ sơ người dùng của bạn được liên kết trực tiếp với dự án <strong className="text-[#F2C94C] font-mono">{firebaseConfig.projectId}</strong> trên Firebase Console với cơ chế bảo mật và phân quyền nghiêm ngặt.
        </p>

        <div className="p-4 rounded-2xl bg-[#181224] border border-white/5 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:justify-between text-slate-400 gap-1">
            <span>Dự án Firebase (Project ID):</span>
            <span className="text-slate-200 font-mono font-medium">{firebaseConfig.projectId}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between text-slate-400 gap-1">
            <span>Cơ sở dữ liệu (Firestore Database ID):</span>
            <span className="text-slate-200 font-mono font-medium break-all">{firebaseConfig.firestoreDatabaseId}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between text-slate-400 gap-1">
            <span>Auth Domain:</span>
            <span className="text-slate-200 font-mono font-medium">{firebaseConfig.authDomain}</span>
          </div>
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{syncFeedback.text}</span>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/5 pt-4">
          <button
            type="button"
            onClick={handleSyncToFirebase}
            disabled={isSyncingFirebase}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#2A203F] hover:bg-[#352950] border border-[#F2994A]/40 text-[#F2C94C] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSyncingFirebase ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang đẩy dữ liệu lên Firebase...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 text-[#F2994A]" />
                <span>Đẩy toàn bộ dữ liệu ({entries.length} bài) lên Firebase Console</span>
              </>
            )}
          </button>

          <a
            href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] text-xs font-bold hover:brightness-110 transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <span>Mở Firebase Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Storage and Data Export Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#221A33] border border-[#B794F4]/20 shadow-xl space-y-5">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-[#B794F4]" />
          <h3 className="text-lg font-bold text-slate-100 font-serif-heading">
            Dữ liệu cá nhân & Sao lưu
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#181224]/70 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Tổng số bài viết</span>
            <span className="text-base font-bold font-mono text-slate-100">{entries.length} bài</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#181224]/70 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Tổng lượng chữ đã viết</span>
            <span className="text-base font-bold font-mono text-slate-100">{totalWords.toLocaleString()} từ</span>
          </div>
          <div className="p-3.5 rounded-xl bg-[#181224]/70 border border-white/5">
            <span className="text-slate-400 block mb-0.5">Dung lượng ký tự</span>
            <span className="text-base font-bold font-mono text-slate-100">{totalChars.toLocaleString()} ký tự</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#181224]/80 border border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <FileText className="w-4 h-4 text-[#F2994A]" />
              <span>Tải về bản sao lưu toàn bộ nhật ký (JSON)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Xuất toàn bộ bài viết, các mốc thời gian và toàn bộ kết quả phân tích cảm xúc để lưu trữ cá nhân độc lập.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={entries.length === 0}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#2A203F] hover:bg-[#352950] border border-[#F2994A]/30 text-[#F2C94C] text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 whitespace-nowrap shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file JSON</span>
          </button>
        </div>
      </div>

      {/* Security Architecture Statement */}
      <div className="p-4 rounded-2xl bg-[#181224]/70 border border-[#B794F4]/15 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1 leading-relaxed">
          <p className="font-semibold text-slate-200">Tiêu chuẩn bảo mật nghiêm ngặt:</p>
          <p>
            Mật khẩu của bạn được băm an toàn bằng thuật toán mã hóa hiện đại kèm salt độc lập. Cơ sở dữ liệu cô lập dữ liệu theo từng ID người dùng, tuyệt đối không có việc một người dùng xem được bài viết của người khác. Hệ thống không ghi nội dung nhật ký hay mật khẩu vào log máy chủ.
          </p>
        </div>
      </div>
    </div>
  );
};
