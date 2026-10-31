import { DiaryEntry, User } from '../types';
import { auth } from '../services/firebase';

const TOKEN_KEY = 'emotion_care_token';

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Also attach Firebase authentication headers when Firebase user is logged in
  if (auth.currentUser) {
    headers.set('x-user-id', auth.currentUser.uid);
    if (auth.currentUser.email) {
      headers.set('x-user-email', auth.currentUser.email);
    }
    if (auth.currentUser.displayName) {
      headers.set('x-user-name', encodeURIComponent(auth.currentUser.displayName));
    }
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (data && typeof data === 'object' && (data.error || data.message)) ||
      `Yêu cầu thất bại với mã lỗi ${response.status}`;
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  auth: {
    async register(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
      const res = await apiFetch<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      tokenStorage.set(res.token);
      return res;
    },

    async login(email: string, password: string): Promise<{ token: string; user: User }> {
      const res = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      tokenStorage.set(res.token);
      return res;
    },

    async getMe(): Promise<{ user: User }> {
      return apiFetch<{ user: User }>('/api/auth/me');
    },

    async logout(): Promise<void> {
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
      } finally {
        tokenStorage.clear();
      }
    },
  },

  entries: {
    async getAll(params?: { q?: string; status?: string }): Promise<{ entries: DiaryEntry[] }> {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set('q', params.q);
      if (params?.status) searchParams.set('status', params.status);
      const queryStr = searchParams.toString();
      return apiFetch<{ entries: DiaryEntry[] }>(`/api/entries${queryStr ? `?${queryStr}` : ''}`);
    },

    async getById(id: string): Promise<{ entry: DiaryEntry }> {
      return apiFetch<{ entry: DiaryEntry }>(`/api/entries/${id}`);
    },

    async create(payload: {
      id?: string;
      title?: string;
      content: string;
      analyzeImmediately?: boolean;
      fileName?: string;
      textFileContent?: string;
      fileType?: string;
    }): Promise<{ entry: DiaryEntry }> {
      return apiFetch<{ entry: DiaryEntry }>('/api/entries', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async analyze(id: string): Promise<{ message: string; entry: DiaryEntry }> {
      return apiFetch<{ message: string; entry: DiaryEntry }>(`/api/entries/${id}/analyze`, {
        method: 'POST',
      });
    },

    async analyzeEmotionText(content: string, title?: string): Promise<{ result: any }> {
      return apiFetch<{ result: any }>('/api/gemini/analyze-text', {
        method: 'POST',
        body: JSON.stringify({ content, title }),
      });
    },

    async delete(id: string): Promise<{ message: string }> {
      return apiFetch<{ message: string }>(`/api/entries/${id}`, {
        method: 'DELETE',
      });
    },

    getExportJsonUrl(): string {
      return '/api/export/json';
    },
  },

  system: {
    async getStatus(): Promise<{ geminiConfigured: boolean; status: string; timestamp: string }> {
      return apiFetch<{ geminiConfigured: boolean; status: string; timestamp: string }>('/api/system/status');
    },
  },
};
