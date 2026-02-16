// OPIc 레벨 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// GET /api/v1/levels — 전체 레벨 목록 조회
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const levels = db.prepare('SELECT * FROM levels ORDER BY order_index').all();
    res.json(levels);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
