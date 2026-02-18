// 학습 시간 추적 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// POST /api/v1/study-sessions/start — 학습 세션 시작
router.post('/start', (req, res, next) => {
  try {
    const db = getDatabase();
    const { activity_type } = req.body;

    if (!activity_type) {
      return res.status(400).json({
        error: true,
        code: 'MISSING_PARAMS',
        message: '필수 파라미터가 누락되었습니다 (activity_type)'
      });
    }

    const validTypes = ['exam', 'script', 'srs', 'voice', 'question_review'];
    if (!validTypes.includes(activity_type)) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_TYPE',
        message: `유효하지 않은 활동 유형입니다. 허용: ${validTypes.join(', ')}`
      });
    }

    const now = new Date().toISOString();

    const result = db.prepare(
      'INSERT INTO study_sessions (activity_type, duration, started_at) VALUES (?, 0, ?)'
    ).run(activity_type, now);

    res.json({
      id: result.lastInsertRowid,
      started_at: now
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/study-sessions/:id/end — 학습 세션 종료
router.put('/:id/end', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const session = db.prepare('SELECT * FROM study_sessions WHERE id = ?').get(id);

    if (!session) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '학습 세션을 찾을 수 없습니다'
      });
    }

    if (session.ended_at) {
      return res.status(400).json({
        error: true,
        code: 'ALREADY_ENDED',
        message: '이미 종료된 세션입니다'
      });
    }

    const now = new Date();
    const startedAt = new Date(session.started_at);
    const durationSeconds = Math.round((now - startedAt) / 1000);
    const endedAt = now.toISOString();

    db.prepare(
      'UPDATE study_sessions SET ended_at = ?, duration = ? WHERE id = ?'
    ).run(endedAt, durationSeconds, id);

    const updated = db.prepare('SELECT * FROM study_sessions WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/study-sessions — 최근 학습 세션 목록 (최대 50개)
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();

    const sessions = db.prepare(
      'SELECT * FROM study_sessions ORDER BY started_at DESC LIMIT 50'
    ).all();

    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/study-sessions/summary — 활동 유형별 학습 시간 요약
router.get('/summary', (req, res, next) => {
  try {
    const db = getDatabase();

    const now = new Date();

    // 7일 전 날짜
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    // 30일 전 날짜
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    // 최근 7일 활동 유형별 합산
    const last7Days = db.prepare(
      `SELECT activity_type, SUM(duration) as total_seconds, COUNT(*) as session_count
       FROM study_sessions
       WHERE started_at >= ? AND duration > 0
       GROUP BY activity_type`
    ).all(sevenDaysAgoStr);

    // 최근 30일 활동 유형별 합산
    const last30Days = db.prepare(
      `SELECT activity_type, SUM(duration) as total_seconds, COUNT(*) as session_count
       FROM study_sessions
       WHERE started_at >= ? AND duration > 0
       GROUP BY activity_type`
    ).all(thirtyDaysAgoStr);

    // 전체 활동 유형별 합산
    const allTime = db.prepare(
      `SELECT activity_type, SUM(duration) as total_seconds, COUNT(*) as session_count
       FROM study_sessions
       WHERE duration > 0
       GROUP BY activity_type`
    ).all();

    res.json({
      last_7_days: last7Days,
      last_30_days: last30Days,
      all_time: allTime
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
