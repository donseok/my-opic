// AI 피드백 API 라우터 (M3에서 Gemini 연동 구현)
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// POST /api/v1/feedback/evaluate — AI 피드백 요청 (Gemini 프록시)
router.post('/evaluate', async (req, res, next) => {
  try {
    const { session_id, answers, target_level } = req.body;

    if (!session_id || !answers || !target_level) {
      return res.status(400).json({
        error: true,
        code: 'MISSING_PARAMS',
        message: '필수 파라미터가 누락되었습니다 (session_id, answers, target_level)'
      });
    }

    // Gemini API 서비스 호출
    const { evaluateAnswers } = require('../services/gemini');
    const feedback = await evaluateAnswers(answers, target_level);

    // DB에 피드백 저장
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT OR REPLACE INTO ai_feedbacks
       (session_id, predicted_level, grammar_score, fluency_score, vocabulary_score, pronunciation_score, content_organization_score, strengths, improvements, raw_response, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      session_id,
      feedback.predicted_level,
      feedback.grammar_score,
      feedback.fluency_score,
      feedback.vocabulary_score,
      feedback.pronunciation_score || 0,
      feedback.content_organization_score || 0,
      JSON.stringify(feedback.strengths),
      JSON.stringify(feedback.improvements),
      JSON.stringify(feedback),
      now
    );

    // 스킬 평가 기록 저장
    try {
      db.prepare(
        `INSERT INTO skill_assessments
         (session_id, grammar_score, vocabulary_score, fluency_score, pronunciation_score, content_organization_score, assessed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        session_id,
        feedback.grammar_score,
        feedback.vocabulary_score,
        feedback.fluency_score,
        feedback.pronunciation_score || 0,
        feedback.content_organization_score || 0,
        now
      );
    } catch (e) {
      // 스킬 평가 저장 실패 무시
    }

    res.json(feedback);
  } catch (err) {
    // Gemini API 에러 분류
    if (err.status === 429) {
      return res.status(429).json({
        error: true,
        code: 'RATE_LIMIT',
        message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
      });
    }
    if (err.status === 400) {
      return res.status(400).json({
        error: true,
        code: 'BAD_REQUEST',
        message: '잘못된 요청입니다.'
      });
    }
    next(err);
  }
});

// GET /api/v1/feedback/:sessionId — 피드백 결과 조회
router.get('/:sessionId', (req, res, next) => {
  try {
    const db = getDatabase();
    const { sessionId } = req.params;

    const feedback = db.prepare('SELECT * FROM ai_feedbacks WHERE session_id = ?').get(sessionId);

    if (!feedback) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '해당 세션의 피드백을 찾을 수 없습니다'
      });
    }

    // JSON 문자열 파싱
    feedback.strengths = JSON.parse(feedback.strengths || '[]');
    feedback.improvements = JSON.parse(feedback.improvements || '[]');

    res.json(feedback);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
