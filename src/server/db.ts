import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

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

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  status: AnalysisStatus;
  emotion: EmotionType | null;
  sentiment_score: number | null; // 1 to 10
  stress_level: number | null; // 1 to 10
  topic: TopicType | null;
  summary: string | null;
  analyzedAt: string | null;
  errorMessage: string | null;
  fileName?: string | null;
  textFileContent?: string | null;
  fileType?: string | null;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface DatabaseSchema {
  users: User[];
  entries: DiaryEntry[];
  sessions: Session[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'emotion_care_db.json');

function ensureDbDirectory() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function readDb(): DatabaseSchema {
  ensureDbDirectory();
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: [],
      entries: [],
      sessions: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file, recovering with empty schema:', err);
    return { users: [], entries: [], sessions: [] };
  }
}

function writeDb(data: DatabaseSchema): void {
  ensureDbDirectory();
  const tempFile = `${DB_FILE}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

// Password hashing helpers with scrypt
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const db = {
  // Users
  getUserByEmail(email: string): User | undefined {
    const data = readDb();
    return data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  },

  getUserById(id: string): User | undefined {
    const data = readDb();
    return data.users.find((u) => u.id === id);
  },

  getOrCreateUser(id: string, name: string, email: string): User {
    const data = readDb();
    let user = data.users.find(
      (u) => u.id === id || (email && u.email.toLowerCase() === email.trim().toLowerCase())
    );
    if (!user) {
      user = {
        id,
        name: name || 'Người dùng',
        email: email || `${id}@emotioncare.local`,
        passwordHash: '',
        salt: '',
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      writeDb(data);
    }
    return user;
  },

  createUser(name: string, email: string, password: string): User {
    const data = readDb();
    const existing = data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      throw new Error('Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.');
    }

    const { hash, salt } = hashPassword(password);
    const user: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };

    data.users.push(user);
    writeDb(data);
    return user;
  },

  // Sessions
  createSession(userId: string): string {
    const data = readDb();
    const token = generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    // Clean expired sessions
    data.sessions = data.sessions.filter((s) => new Date(s.expiresAt) > now);

    data.sessions.push({
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt,
    });

    writeDb(data);
    return token;
  },

  getUserByToken(token: string): User | null {
    if (!token) return null;
    const data = readDb();
    const session = data.sessions.find((s) => s.token === token);
    if (!session) return null;

    if (new Date(session.expiresAt) <= new Date()) {
      return null;
    }

    return data.users.find((u) => u.id === session.userId) || null;
  },

  deleteSession(token: string): void {
    const data = readDb();
    data.sessions = data.sessions.filter((s) => s.token !== token);
    writeDb(data);
  },

  // Diary Entries
  getEntriesByUserId(userId: string, query?: string, status?: string): DiaryEntry[] {
    const data = readDb();
    let userEntries = data.entries.filter((e) => e.userId === userId);

    if (status && status !== 'all') {
      userEntries = userEntries.filter((e) => e.status === status);
    }

    if (query && query.trim() !== '') {
      const q = query.trim().toLowerCase();
      userEntries = userEntries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          (e.summary && e.summary.toLowerCase().includes(q)) ||
          (e.emotion && e.emotion.toLowerCase().includes(q)) ||
          (e.topic && e.topic.toLowerCase().includes(q))
      );
    }

    // Sort by createdAt descending (newest first)
    return userEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getEntryById(id: string, userId: string): DiaryEntry | undefined {
    const data = readDb();
    return data.entries.find((e) => e.id === id && e.userId === userId);
  },

  createEntry(
    userId: string,
    title: string,
    content: string,
    extra?: {
      id?: string;
      fileName?: string;
      textFileContent?: string;
      fileType?: string;
    }
  ): DiaryEntry {
    const data = readDb();
    const entry: DiaryEntry = {
      id: extra?.id || crypto.randomUUID(),
      userId,
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      emotion: null,
      sentiment_score: null,
      stress_level: null,
      topic: null,
      summary: null,
      analyzedAt: null,
      errorMessage: null,
      fileName: extra?.fileName || null,
      textFileContent: extra?.textFileContent || null,
      fileType: extra?.fileType || 'text/plain',
    };

    data.entries.push(entry);
    writeDb(data);
    return entry;
  },

  updateEntryAnalysis(
    id: string,
    userId: string,
    update: {
      status: AnalysisStatus;
      emotion?: EmotionType | null;
      sentiment_score?: number | null;
      stress_level?: number | null;
      topic?: TopicType | null;
      summary?: string | null;
      errorMessage?: string | null;
      fileName?: string | null;
      textFileContent?: string | null;
    }
  ): DiaryEntry | null {
    const data = readDb();
    const index = data.entries.findIndex((e) => e.id === id && e.userId === userId);
    if (index === -1) return null;

    const current = data.entries[index];
    const analyzedAt = update.status === 'done' ? new Date().toISOString() : current.analyzedAt;

    data.entries[index] = {
      ...current,
      status: update.status,
      emotion: update.emotion !== undefined ? update.emotion : current.emotion,
      sentiment_score: update.sentiment_score !== undefined ? update.sentiment_score : current.sentiment_score,
      stress_level: update.stress_level !== undefined ? update.stress_level : current.stress_level,
      topic: update.topic !== undefined ? update.topic : current.topic,
      summary: update.summary !== undefined ? update.summary : current.summary,
      errorMessage: update.errorMessage !== undefined ? update.errorMessage : null,
      fileName: update.fileName !== undefined ? update.fileName : current.fileName,
      textFileContent: update.textFileContent !== undefined ? update.textFileContent : current.textFileContent,
      analyzedAt,
    };

    writeDb(data);
    return data.entries[index];
  },

  deleteEntry(id: string, userId: string): boolean {
    const data = readDb();
    const initialLen = data.entries.length;
    data.entries = data.entries.filter((e) => !(e.id === id && e.userId === userId));
    if (data.entries.length !== initialLen) {
      writeDb(data);
      return true;
    }
    return false;
  },
};
