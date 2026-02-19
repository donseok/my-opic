// 주제별 단어장 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// GET /api/v1/vocabulary — 주제별 단어/표현 목록
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const { topic_id } = req.query;

    let sql = `SELECT tv.*, st.name as topic_name
               FROM topic_vocabulary tv
               JOIN survey_topics st ON tv.topic_id = st.id`;
    const params = [];

    if (topic_id) {
      sql += ' WHERE tv.topic_id = ?';
      params.push(topic_id);
    }

    sql += ' ORDER BY tv.topic_id, tv.id';
    const items = db.prepare(sql).all(...params);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/vocabulary/random — 랜덤 단어 카드
router.get('/random', (req, res, next) => {
  try {
    const db = getDatabase();
    const { topic_id, count } = req.query;
    const limit = Math.min(parseInt(count) || 10, 50);

    let sql = `SELECT tv.*, st.name as topic_name
               FROM topic_vocabulary tv
               JOIN survey_topics st ON tv.topic_id = st.id`;
    const params = [];

    if (topic_id) {
      sql += ' WHERE tv.topic_id = ?';
      params.push(topic_id);
    }

    sql += ' ORDER BY RANDOM() LIMIT ?';
    params.push(limit);

    const items = db.prepare(sql).all(...params);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/vocabulary/topics — 단어가 있는 주제 목록 + 개수
router.get('/topics', (req, res, next) => {
  try {
    const db = getDatabase();
    const topics = db.prepare(`
      SELECT st.id, st.name, st.icon, COUNT(tv.id) as word_count
      FROM survey_topics st
      JOIN topic_vocabulary tv ON st.id = tv.topic_id
      GROUP BY st.id
      ORDER BY st.id
    `).all();
    res.json(topics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
