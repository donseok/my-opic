// 서베이 주제 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// GET /api/v1/topics — 전체 주제 목록 조회
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const topics = db.prepare('SELECT * FROM survey_topics ORDER BY id').all();
    res.json(topics);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/topics/selection — 주제 선택 상태 저장
router.put('/selection', (req, res, next) => {
  try {
    const { selected_ids } = req.body;

    // 유효성 검사: 3~5개 선택
    if (!Array.isArray(selected_ids) || selected_ids.length < 3 || selected_ids.length > 5) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_SELECTION',
        message: '주제는 3~5개를 선택해야 합니다'
      });
    }

    const db = getDatabase();

    // 트랜잭션으로 선택 상태 업데이트
    const updateSelection = db.transaction((ids) => {
      // 전체 해제
      db.prepare('UPDATE survey_topics SET is_selected = 0').run();
      // 선택된 주제 활성화
      const stmt = db.prepare('UPDATE survey_topics SET is_selected = 1 WHERE id = ?');
      for (const id of ids) {
        stmt.run(id);
      }
    });

    updateSelection(selected_ids);

    res.json({ success: true, message: '주제 선택이 저장되었습니다' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
