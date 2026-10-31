import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<Props> = ({
  isOpen,
  title,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#221A33] border border-rose-500/30 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Xác nhận xóa bài tâm sự</h3>
            <p className="text-xs text-rose-400/90 font-medium">Hành động này không thể hoàn tác</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-2 leading-relaxed">
          Bạn có chắc chắn muốn xóa bài viết{' '}
          <span className="font-semibold text-amber-300">
            "{title || 'Tâm sự không tiêu đề'}"
          </span>{' '}
          khỏi nhật ký của mình?
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Toàn bộ nội dung tâm sự và dữ liệu phân tích cảm xúc liên quan sẽ được xóa vĩnh viễn khỏi tài khoản của bạn.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-rose-900/30 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
