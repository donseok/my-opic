// OPIc Master Express 서버 진입점
require('dotenv').config();

const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { getDatabase, closeDatabase } = require('./db/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 미들웨어 — 모바일 앱에서 API 접근 허용
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['*'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 미들웨어 설정 — 대용량 오디오 데이터를 위해 10MB 제한
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// API 요청 제한 (분당 100회)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, code: 'RATE_LIMIT', message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }
});
app.use('/api/', apiLimiter);

// 정적 파일 서빙 (public/ 디렉토리)
app.use(express.static(path.join(__dirname, '..', 'public')));

// 데이터베이스 초기화
const db = getDatabase();

// API 라우터 마운트 (/api/v1)
const topicsRouter = require('./routes/topics');
const levelsRouter = require('./routes/levels');
const settingsRouter = require('./routes/settings');
const questionsRouter = require('./routes/questions');
const examRouter = require('./routes/exam');
const feedbackRouter = require('./routes/feedback');
const dashboardRouter = require('./routes/dashboard');
const voiceRouter = require('./routes/voice');
const scriptsRouter = require('./routes/scripts');
const studyPlanRouter = require('./routes/studyPlan');
const srsRouter = require('./routes/srs');
const studySessionsRouter = require('./routes/studySessions');
const attendanceRouter = require('./routes/attendance');
const sentencePracticeRouter = require('./routes/sentencePractice');
const vocabularyRouter = require('./routes/vocabulary');

app.use('/api/v1/topics', topicsRouter);
app.use('/api/v1/levels', levelsRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/questions', questionsRouter);
app.use('/api/v1/exam', examRouter);
app.use('/api/v1/feedback', feedbackRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/voice', voiceRouter);
app.use('/api/v1/scripts', scriptsRouter);
app.use('/api/v1/study-plan', studyPlanRouter);
app.use('/api/v1/srs', srsRouter);
app.use('/api/v1/study-sessions', studySessionsRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/sentence-practice', sentencePracticeRouter);
app.use('/api/v1/vocabulary', vocabularyRouter);

// SPA 폴백 — 모든 비-API 요청을 index.html로
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`[서버] OPIc Master 실행 중: http://localhost:${PORT}`);

  // Gemini API 키 설정 확인
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
    console.warn('[경고] GEMINI_API_KEY가 설정되지 않았습니다. AI 피드백 기능이 작동하지 않습니다.');
  }
});

// 프로세스 종료 시 DB 연결 정리
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});
