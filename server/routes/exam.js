// 모의시험 API 라우터 (M2에서 구현)
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// POST /api/v1/exam/start — 모의시험 5문제 구성
router.post('/start', (req, res, next) => {
  try {
    const db = getDatabase();
    const { topic_ids } = req.body;

    if (!Array.isArray(topic_ids) || topic_ids.length === 0) {
      return res.status(400).json({
        error: true,
        code: 'NO_TOPICS',
        message: '선택된 주제가 없습니다'
      });
    }

    // 사용자 설정에서 목표 레벨 조회
    const settings = db.prepare('SELECT target_level FROM user_settings WHERE id = 1').get();
    const targetLevel = settings?.target_level || 'IM1';

    // 목표 레벨의 최소 단어 수 조회
    const levelInfo = db.prepare('SELECT min_words FROM levels WHERE code = ?').get(targetLevel);
    const targetWords = levelInfo?.min_words || 60;

    // 서베이/콤보 질문 4개 랜덤 선택
    const placeholders = topic_ids.map(() => '?').join(',');
    const surveyQuestions = db.prepare(
      `SELECT q.*, st.name as topic_name FROM questions q
       JOIN survey_topics st ON q.topic_id = st.id
       WHERE q.topic_id IN (${placeholders}) AND q.type IN ('survey', 'combo')
       ORDER BY RANDOM() LIMIT 4`
    ).all(...topic_ids);

    // 롤플레이 질문 1개 랜덤 선택
    const roleplayQuestions = db.prepare(
      `SELECT q.*, st.name as topic_name FROM questions q
       JOIN survey_topics st ON q.topic_id = st.id
       WHERE q.topic_id IN (${placeholders}) AND q.type = 'roleplay'
       ORDER BY RANDOM() LIMIT 1`
    ).all(...topic_ids);

    // 5문제 구성 (서베이 4 + 롤플레이 1)
    const questions = [...surveyQuestions, ...roleplayQuestions].map(q => ({
      id: q.id,
      question_text: q.question_text,
      type: q.type,
      topic_name: q.topic_name,
      time_limit: q.type === 'roleplay' ? 120 : 90
    }));

    if (questions.length < 5) {
      return res.status(400).json({
        error: true,
        code: 'INSUFFICIENT_QUESTIONS',
        message: `선택한 주제에 문제가 부족합니다 (${questions.length}/5). 주제를 추가로 선택해주세요.`
      });
    }

    res.json({
      questions,
      total_questions: questions.length,
      target_level: targetLevel,
      target_words: targetWords
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/exam/sessions — 시험 결과 저장
router.post('/sessions', (req, res, next) => {
  try {
    const db = getDatabase();
    const { target_level, started_at, answers } = req.body;

    const completedAt = new Date().toISOString();
    const startedAt = started_at || completedAt;
    let totalWords = 0;

    // 각 답변의 텍스트 길이 제한 (10,000자)
    const MAX_ANSWER_LENGTH = 10000;
    if (Array.isArray(answers)) {
      for (const a of answers) {
        if (a.answer_text && a.answer_text.length > MAX_ANSWER_LENGTH) {
          return res.status(400).json({
            error: true,
            code: 'VALIDATION_ERROR',
            message: `답변 텍스트가 최대 길이(${MAX_ANSWER_LENGTH}자)를 초과했습니다`
          });
        }
        totalWords += (a.word_count || 0);
      }
    }

    // 트랜잭션으로 세션 + 답변 저장
    const saveSession = db.transaction(() => {
      const sessionResult = db.prepare(
        'INSERT INTO exam_sessions (started_at, completed_at, target_level, total_words) VALUES (?, ?, ?, ?)'
      ).run(startedAt, completedAt, target_level || 'IM1', totalWords);

      const sessionId = sessionResult.lastInsertRowid;

      if (Array.isArray(answers)) {
        const stmt = db.prepare(
          'INSERT INTO exam_answers (session_id, question_id, answer_text, word_count, time_spent, order_index) VALUES (?, ?, ?, ?, ?, ?)'
        );
        answers.forEach((a, idx) => {
          stmt.run(sessionId, a.question_id, a.answer_text || '', a.word_count || 0, a.time_spent || 0, idx + 1);
        });
      }

      return sessionId;
    });

    const sessionId = saveSession();
    res.json({ success: true, session_id: sessionId, message: '시험 결과가 저장되었습니다' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/exam/sessions — 시험 이력 목록 (최근 10개)
router.get('/sessions', (req, res, next) => {
  try {
    const db = getDatabase();
    const sessions = db.prepare(
      `SELECT es.*, af.predicted_level, af.grammar_score, af.fluency_score, af.vocabulary_score
       FROM exam_sessions es
       LEFT JOIN ai_feedbacks af ON es.id = af.session_id
       ORDER BY es.started_at DESC LIMIT 10`
    ).all();
    res.json(sessions);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/exam/sessions/:id — 시험 상세 조회
router.get('/sessions/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const session = db.prepare('SELECT * FROM exam_sessions WHERE id = ?').get(id);
    if (!session) {
      return res.status(404).json({ error: true, code: 'NOT_FOUND', message: '시험 세션을 찾을 수 없습니다' });
    }

    const answers = db.prepare(
      `SELECT ea.*, q.question_text, q.type FROM exam_answers ea
       JOIN questions q ON ea.question_id = q.id
       WHERE ea.session_id = ? ORDER BY ea.order_index`
    ).all(id);

    res.json({ ...session, answers });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
