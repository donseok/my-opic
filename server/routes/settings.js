// 사용자 설정 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// GET /api/v1/settings — 사용자 설정 조회
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const settings = db.prepare('SELECT * FROM user_settings WHERE id = 1').get();
    res.json(settings || { current_level: null, target_level: null });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/settings — 사용자 설정 저장
router.put('/', (req, res, next) => {
  try {
    const { current_level, target_level } = req.body;
    const db = getDatabase();

    // 레벨 유효성 검사
    const validLevels = db.prepare('SELECT code, order_index FROM levels').all();
    const levelMap = {};
    validLevels.forEach(l => { levelMap[l.code] = l.order_index; });

    if (current_level && !(current_level in levelMap)) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_LEVEL',
        message: '유효하지 않은 현재 레벨입니다'
      });
    }

    if (target_level && !(target_level in levelMap)) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_LEVEL',
        message: '유효하지 않은 목표 레벨입니다'
      });
    }

    // 목표 레벨이 현재 레벨보다 낮은지 검사
    if (current_level && target_level && levelMap[target_level] < levelMap[current_level]) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_TARGET',
        message: '목표 레벨은 현재 레벨 이상이어야 합니다'
      });
    }

    const now = new Date().toISOString();
    db.prepare(
      'UPDATE user_settings SET current_level = ?, target_level = ?, updated_at = ? WHERE id = 1'
    ).run(current_level || null, target_level || null, now);

    res.json({ success: true, message: '레벨 설정이 저장되었습니다' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
