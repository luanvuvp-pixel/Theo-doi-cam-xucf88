import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, User, verifyPassword } from './src/server/db.js';
import { analyzeEmotion, isGeminiConfigured } from './src/server/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Body parsing with reasonable limits
app.use(express.json({ limit: '2mb' }));

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

// Authentication middleware
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // 1. Check for Firebase user headers (allows seamless Firebase Auth)
  const firebaseUserId = (req.headers['x-user-id'] as string) || '';
  if (firebaseUserId.trim()) {
    const nameHeader = (req.headers['x-user-name'] as string) || '';
    let name = 'Người dùng';
    try {
      name = decodeURIComponent(nameHeader) || 'Người dùng';
    } catch {
      name = nameHeader || 'Người dùng';
    }
    const email = (req.headers['x-user-email'] as string) || '';
    const user = db.getOrCreateUser(firebaseUserId.trim(), name, email);
    req.user = user;
    next();
    return;
  }

  // 2. Check for standard Bearer session token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const user = db.getUserByToken(token);
    if (user) {
      req.user = user;
      req.token = token;
      next();
      return;
    }
  }

  res.status(401).json({ error: 'Yêu cầu đăng nhập để thực hiện hành động này.' });
}

// ================= API ROUTES =================

// 1. Auth routes
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Họ và tên hiển thị phải có ít nhất 2 ký tự.' });
      return;
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Email không đúng định dạng.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      return;
    }

    const user = db.createUser(name, email, password);
    const token = db.createSession(user.id);

    res.status(201).json({
      message: 'Tạo tài khoản thành công.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Không thể tạo tài khoản.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Vui lòng nhập đầy đủ email và mật khẩu.' });
      return;
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
      return;
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
      return;
    }

    const token = db.createSession(user.id);
    res.json({
      message: 'Đăng nhập thành công.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Đã xảy ra lỗi khi đăng nhập.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.token) {
    db.deleteSession(req.token);
  }
  res.json({ message: 'Đã đăng xuất an toàn.' });
});

// 2. System Status & Direct Gemini Analysis
app.get('/api/system/status', (_req: Request, res: Response) => {
  res.json({
    geminiConfigured: isGeminiConfigured(),
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/gemini/analyze-text', async (req: Request, res: Response) => {
  try {
    const { content, title } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Nội dung tâm sự không được để trống.' });
      return;
    }

    const result = await analyzeEmotion(content, title);
    res.json({ result });
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Lỗi khi phân tích bằng Gemini AI.' });
  }
});

// 3. Entries Routes
app.get('/api/entries', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const entries = db.getEntriesByUserId(req.user!.id, query, status);
  res.json({ entries });
});

app.post('/api/entries', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      id,
      title = '',
      content,
      analyzeImmediately = false,
      fileName,
      textFileContent,
      fileType = 'text/plain',
    } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Nội dung tâm sự không được để trống.' });
      return;
    }

    const user = req.user!;
    // Create base entry with pending status and text file properties
    let entry = db.createEntry(user.id, title, content, {
      id,
      fileName,
      textFileContent,
      fileType,
    });

    // If requested to analyze immediately
    if (analyzeImmediately) {
      try {
        const result = await analyzeEmotion(entry.content, entry.title);
        const updated = db.updateEntryAnalysis(entry.id, user.id, {
          status: 'done',
          emotion: result.emotion,
          sentiment_score: result.sentiment_score,
          stress_level: result.stress_level,
          topic: result.topic,
          summary: result.summary,
        });
        if (updated) entry = updated;
      } catch (analysisErr: any) {
        console.error('Lỗi khi phân tích cảm xúc:', analysisErr.message || analysisErr);
        const failedEntry = db.updateEntryAnalysis(entry.id, user.id, {
          status: 'failed',
          errorMessage: analysisErr.message || 'Không thể kết nối đến dịch vụ AI. Vui lòng thử lại sau.',
        });
        if (failedEntry) entry = failedEntry;
      }
    }

    res.status(201).json({ entry });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi khi lưu bài tâm sự.' });
  }
});

app.get('/api/entries/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const entry = db.getEntryById(req.params.id, req.user!.id);
  if (!entry) {
    res.status(404).json({ error: 'Không tìm thấy bài tâm sự hoặc bạn không có quyền truy cập.' });
    return;
  }
  res.json({ entry });
});

app.post('/api/entries/:id/analyze', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const entry = db.getEntryById(req.params.id, req.user!.id);
    if (!entry) {
      res.status(404).json({ error: 'Không tìm thấy bài tâm sự.' });
      return;
    }

    try {
      const result = await analyzeEmotion(entry.content, entry.title);
      const updated = db.updateEntryAnalysis(entry.id, req.user!.id, {
        status: 'done',
        emotion: result.emotion,
        sentiment_score: result.sentiment_score,
        stress_level: result.stress_level,
        topic: result.topic,
        summary: result.summary,
        errorMessage: null,
      });

      res.json({
        message: 'Phân tích cảm xúc thành công.',
        entry: updated,
      });
    } catch (analysisErr: any) {
      const failedEntry = db.updateEntryAnalysis(entry.id, req.user!.id, {
        status: 'failed',
        errorMessage: analysisErr.message || 'Lỗi khi phân tích bằng Gemini AI. Vui lòng bấm thử lại.',
      });

      res.status(502).json({
        error: analysisErr.message || 'Lỗi khi gọi Gemini AI.',
        entry: failedEntry,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Đã xảy ra lỗi máy chủ.' });
  }
});

app.delete('/api/entries/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteEntry(req.params.id, req.user!.id);
  if (!deleted) {
    res.status(404).json({ error: 'Không tìm thấy bài tâm sự cần xóa hoặc bạn không có quyền.' });
    return;
  }
  res.json({ message: 'Đã xóa bài tâm sự an toàn.' });
});

// 4. Export personal data
app.get('/api/export/json', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const entries = db.getEntriesByUserId(req.user!.id);
  const user = req.user!;

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
    totalEntries: entries.length,
    entries,
  };

  res.setHeader('Content-Disposition', `attachment; filename=emotion-care-backup-${Date.now()}.json`);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(exportPayload, null, 2));
});

// ================= FRONTEND / VITE INTEGRATION =================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Emotion Care server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
