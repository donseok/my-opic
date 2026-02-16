// OPIc Master Express 서버 진입점
require('dotenv').config();

const express = require('express');
const path = require('path');
const { getDatabase, closeDatabase } = require('./db/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

app.use('/api/v1/topics', topicsRouter);
app.use('/api/v1/levels', levelsRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/questions', questionsRouter);
app.use('/api/v1/exam', examRouter);
app.use('/api/v1/feedback', feedbackRouter);
app.use('/api/v1/dashboard', dashboardRouter);

// SPA 폴백 — 모든 비-API 요청을 index.html로
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 에러 핸들러
app.use(errorHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`[서버] OPIc Master 실행 중: http://localhost:${PORT}`);
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
