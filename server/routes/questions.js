// 질문/문제은행 API 라우터 (M2에서 구현)
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// GET /api/v1/questions — 주제별 질문 목록 조회
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const { topic_id, type } = req.query;

    let sql = 'SELECT q.*, st.name as topic_name FROM questions q JOIN survey_topics st ON q.topic_id = st.id WHERE 1=1';
    const params = [];

    if (topic_id) {
      sql += ' AND q.topic_id = ?';
      params.push(topic_id);
    }
    if (type) {
      sql += ' AND q.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY q.topic_id, q.id';
    const questions = db.prepare(sql).all(...params);
    res.json(questions);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/questions/:id/guide — 질문별 답변 가이드 조회
router.get('/:id/guide', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { level_code } = req.query;

    let sql = 'SELECT * FROM answer_guides WHERE question_id = ?';
    const params = [id];

    if (level_code) {
      sql += ' AND level_code = ?';
      params.push(level_code);
    }

    const guides = db.prepare(sql).all(...params);
    res.json(guides);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
