import React, { useState } from 'react';
import { Sparkles, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../utils/api';
import { User as UserType } from '../types';
import { firebaseAuth, firestoreService } from '../services/firebase';

interface Props {
  isOpen: boolean;
  onSuccess: (user: UserType) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await firebaseAuth.loginWithGoogle();
      const fbUser = result.user;
      const userObj: UserType = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Người dùng',
        email: fbUser.email || '',
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore users collection
      await firestoreService.saveUserProfile(userObj);

      // Save to local token/session
      onSuccess(userObj);
    } catch (err: any) {
      setError(err.message || 'Không thể đăng nhập bằng tài khoản Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let fbUser: any;
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Vui lòng nhập tên hiển thị.');
        }
        try {
          const cred = await firebaseAuth.registerWithEmail(name.trim(), email.trim(), password);
          fbUser = cred.user;
        } catch (firebaseErr: any) {
          if (firebaseErr.code === 'auth/email-already-in-use') {
            const cred = await firebaseAuth.loginWithEmail(email.trim(), password);
            fbUser = cred.user;
          } else {
            throw firebaseErr;
          }
        }
      } else {
        try {
          const cred = await firebaseAuth.loginWithEmail(email.trim(), password);
          fbUser = cred.user;
        } catch (loginErr: any) {
          if (
            loginErr.code === 'auth/user-not-found' ||
            loginErr.code === 'auth/invalid-credential'
          ) {
            try {
              const defaultName = email.split('@')[0];
              const cred = await firebaseAuth.registerWithEmail(defaultName, email.trim(), password);
              fbUser = cred.user;
            } catch {
              throw loginErr;
            }
          } else {
            throw loginErr;
          }
        }
      }

      const userObj: UserType = {
        id: fbUser.uid,
        name: fbUser.displayName || name.trim() || email.split('@')[0],
        email: fbUser.email || email.trim(),
        createdAt: new Date().toISOString(),
      };

      // Save user profile directly to Firestore Console
      await firestoreService.saveUserProfile(userObj);

      // Also ensure backend session exists
      try {
        await api.auth.login(email.trim(), password);
      } catch {
        try {
          await api.auth.register(userObj.name, email.trim(), password);
        } catch {}
      }

      onSuccess(userObj);
    } catch (err: any) {
      console.error('Lỗi xác thực:', err);
      let msg = err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Mật khẩu hoặc email không chính xác.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Mật khẩu phải có ít nhất 6 ký tự.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Định dạng email không hợp lệ.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick demo sign-in for seamless experience
  const handleQuickDemo = async () => {
    setError(null);
    setIsLoading(true);
    const demoEmail = 'ban_doc@emotioncare.vn';
    const demoPass = 'emotioncare123';
    try {
      let fbUser: any;
      try {
        const cred = await firebaseAuth.loginWithEmail(demoEmail, demoPass);
        fbUser = cred.user;
      } catch {
        const cred = await firebaseAuth.registerWithEmail('Người bạn đồng hành', demoEmail, demoPass);
        fbUser = cred.user;
      }

      const userObj: UserType = {
        id: fbUser.uid,
        name: 'Người bạn đồng hành',
        email: demoEmail,
        createdAt: new Date().toISOString(),
      };

      await firestoreService.saveUserProfile(userObj);

      try {
        await api.auth.login(demoEmail, demoPass);
      } catch {
        try {
          await api.auth.register(userObj.name, demoEmail, demoPass);
        } catch {}
      }

      onSuccess(userObj);
    } catch (err: any) {
      console.error('Lỗi đăng nhập tài khoản mẫu:', err);
      setError(err.message || 'Không thể đăng nhập tài khoản trải nghiệm.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#120D1D]/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#221A33] border border-[#B794F4]/25 rounded-3xl p-6 sm:p-8 shadow-2xl relative glow-lavender">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-[#F2994A] to-[#B794F4] p-0.5 shadow-lg glow-amber">
            <div className="w-full h-full bg-[#181224] rounded-2xl flex items-center justify-center text-2xl">
              🌙
            </div>
          </div>
          <h2 className="text-2xl font-bold font-serif-heading text-slate-100 tracking-wide">
            Emotion Care
          </h2>
          <p className="text-xs text-slate-300">
            Không gian riêng tư viết và theo dõi cảm xúc cá nhân
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#181224] p-1 rounded-xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              !isRegister
                ? 'bg-[#2A203F] text-[#F2C94C] shadow-md border border-white/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              isRegister
                ? 'bg-[#2A203F] text-[#F2994A] shadow-md border border-white/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tạo tài khoản mới
          </button>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full mb-4 py-2.5 px-4 rounded-xl bg-white text-slate-800 font-semibold text-xs hover:bg-slate-100 transition flex items-center justify-center gap-2.5 shadow-md cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Đăng nhập nhanh bằng tài khoản Google</span>
        </button>

        <div className="relative flex py-2 items-center mb-3">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-medium">
            hoặc qua Email
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tên hiển thị của bạn
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Anh, Minh Thư..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#181224] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2994A] transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#181224] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2994A] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Mật khẩu {isRegister && <span className="text-slate-500">(tối thiểu 6 ký tự)</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#181224] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F2994A] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#F2994A] to-[#F2C94C] text-[#181224] font-bold text-sm hover:brightness-110 transition flex items-center justify-center gap-2 shadow-lg glow-amber cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-[#181224] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Tạo tài khoản' : 'Đăng nhập ngay'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Track */}
        <div className="mt-5 pt-4 border-t border-white/5 text-center space-y-2">
          <p className="text-[11px] text-slate-400">Muốn dùng thử nhanh không cần đăng ký?</p>
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F2C94C]" />
            <span>Trải nghiệm nhanh với tài khoản mẫu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
