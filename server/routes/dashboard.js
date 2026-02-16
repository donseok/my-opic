// 대시보드 API 라우터 (M4에서 상세 구현)
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// GET /api/v1/dashboard/stats — 대시보드 통계 요약
router.get('/stats', (req, res, next) => {
  try {
    const db = getDatabase();

    // 총 시험 횟수
    const totalExams = db.prepare('SELECT COUNT(*) as count FROM exam_sessions').get().count;

    // 평균 점수
    const avgScores = db.prepare(
      `SELECT
        ROUND(AVG(grammar_score)) as avg_grammar,
        ROUND(AVG(fluency_score)) as avg_fluency,
        ROUND(AVG(vocabulary_score)) as avg_vocabulary
       FROM ai_feedbacks`
    ).get();

    // 최근 예상 등급
    const latestFeedback = db.prepare(
      'SELECT predicted_level FROM ai_feedbacks ORDER BY created_at DESC LIMIT 1'
    ).get();

    // 사용자 설정
    const settings = db.prepare('SELECT current_level, target_level FROM user_settings WHERE id = 1').get();

    res.json({
      total_exams: totalExams,
      avg_grammar: avgScores?.avg_grammar || 0,
      avg_fluency: avgScores?.avg_fluency || 0,
      avg_vocabulary: avgScores?.avg_vocabulary || 0,
      latest_level: latestFeedback?.predicted_level || null,
      current_level: settings?.current_level || null,
      target_level: settings?.target_level || null
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/trends — 점수 추이 데이터
router.get('/trends', (req, res, next) => {
  try {
    const db = getDatabase();

    const trends = db.prepare(
      `SELECT
        es.id as session_id,
        es.started_at,
        af.predicted_level,
        af.grammar_score,
        af.fluency_score,
        af.vocabulary_score
       FROM exam_sessions es
       JOIN ai_feedbacks af ON es.id = af.session_id
       ORDER BY es.started_at ASC`
    ).all();

    res.json(trends);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
