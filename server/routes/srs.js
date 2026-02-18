// SRS 간격반복 학습 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// GET /api/v1/srs/due — 오늘 복습 예정 항목 조회 (최대 20개)
router.get('/due', (req, res, next) => {
  try {
    const db = getDatabase();
    const today = getTodayDate();

    const items = db.prepare(
      `SELECT * FROM srs_items
       WHERE next_review_date <= ?
       ORDER BY next_review_date ASC, ease_factor ASC
       LIMIT 20`
    ).all(today);

    res.json(items);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/srs/review — 복습 결과 처리 (SM-2 알고리즘)
router.post('/review', (req, res, next) => {
  try {
    const db = getDatabase();
    const { item_id, quality } = req.body;

    if (item_id == null || quality == null) {
      return res.status(400).json({
        error: true,
        code: 'MISSING_PARAMS',
        message: '필수 파라미터가 누락되었습니다 (item_id, quality)'
      });
    }

    if (quality < 0 || quality > 5) {
      return res.status(400).json({
        error: true,
        code: 'INVALID_QUALITY',
        message: 'quality는 0~5 사이여야 합니다'
      });
    }

    const item = db.prepare('SELECT * FROM srs_items WHERE id = ?').get(item_id);

    if (!item) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: 'SRS 항목을 찾을 수 없습니다'
      });
    }

    let updatedItem;

    try {
      const srsService = require('../services/srsService');
      updatedItem = srsService.processReview(db, item, quality);
    } catch (serviceErr) {
      // 서비스 미구현 시 SM-2 기본 로직 적용
      updatedItem = processReviewDefault(db, item, quality);
    }

    res.json(updatedItem);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/srs/stats — SRS 통계
router.get('/stats', (req, res, next) => {
  try {
    const db = getDatabase();
    const today = getTodayDate();

    const totalItems = db.prepare('SELECT COUNT(*) as count FROM srs_items').get().count;

    const dueToday = db.prepare(
      'SELECT COUNT(*) as count FROM srs_items WHERE next_review_date <= ?'
    ).get(today).count;

    // mastered: interval >= 21일 (3주 이상 간격)
    const masteredCount = db.prepare(
      'SELECT COUNT(*) as count FROM srs_items WHERE interval >= 21'
    ).get().count;

    const avgEaseFactor = db.prepare(
      'SELECT ROUND(AVG(ease_factor), 2) as avg_ease FROM srs_items'
    ).get().avg_ease;

    res.json({
      total_items: totalItems,
      due_today: dueToday,
      mastered_count: masteredCount,
      avg_ease_factor: avgEaseFactor || 2.5
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/srs/seed — answer_guides의 key_phrases로부터 SRS 항목 자동 생성
router.post('/seed', (req, res, next) => {
  try {
    const db = getDatabase();
    const today = getTodayDate();
    const now = new Date().toISOString();

    // key_phrases가 있는 answer_guides 조회
    const guides = db.prepare(
      `SELECT ag.id, ag.question_id, ag.level_code, ag.key_phrases, q.question_text
       FROM answer_guides ag
       JOIN questions q ON ag.question_id = q.id
       WHERE ag.key_phrases IS NOT NULL AND ag.key_phrases != ''`
    ).all();

    let createdCount = 0;

    const seedItems = db.transaction(() => {
      const insertStmt = db.prepare(
        `INSERT INTO srs_items (item_type, front_text, back_text, source_id, ease_factor, interval, repetitions, next_review_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, 2.5, 0, 0, ?, ?, ?)`
      );

      // 기존 SRS 항목의 source_id 목록 (중복 방지)
      const existingSourceIds = new Set(
        db.prepare("SELECT source_id FROM srs_items WHERE item_type = 'phrase' AND source_id IS NOT NULL")
          .all()
          .map(r => r.source_id)
      );

      for (const guide of guides) {
        if (existingSourceIds.has(guide.id)) {
          continue;
        }

        let phrases;
        try {
          phrases = JSON.parse(guide.key_phrases);
        } catch {
          continue;
        }

        if (!Array.isArray(phrases)) continue;

        for (const phrase of phrases) {
          if (!phrase || typeof phrase !== 'string') continue;

          insertStmt.run(
            'phrase',
            phrase,
            `From: ${guide.question_text || 'Question ' + guide.question_id} (${guide.level_code})`,
            guide.id,
            today,
            now,
            now
          );
          createdCount++;
        }

        existingSourceIds.add(guide.id);
      }
    });

    seedItems();

    res.json({
      success: true,
      created_count: createdCount,
      message: `${createdCount}개의 SRS 항목이 생성되었습니다`
    });
  } catch (err) {
    next(err);
  }
});

/**
 * SM-2 알고리즘 기본 구현 (서비스 미구현 시 폴백)
 * @param {Object} db - 데이터베이스 인스턴스
 * @param {Object} item - SRS 항목
 * @param {number} quality - 응답 품질 (0~5)
 * @returns {Object} 갱신된 SRS 항목
 */
function processReviewDefault(db, item, quality) {
  const now = new Date().toISOString();
  const today = getTodayDate();

  let { ease_factor, interval, repetitions } = item;

  if (quality >= 3) {
    // 정답 처리
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
    repetitions += 1;
  } else {
    // 오답 처리: 처음부터 다시
    repetitions = 0;
    interval = 1;
  }

  // ease_factor 갱신 (SM-2 공식)
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  // 다음 복습 날짜 계산
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  const nextReviewDate = nextDate.toISOString().split('T')[0];

  // 항목 갱신
  db.prepare(
    `UPDATE srs_items SET ease_factor = ?, interval = ?, repetitions = ?, next_review_date = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    Math.round(ease_factor * 100) / 100,
    interval,
    repetitions,
    nextReviewDate,
    now,
    item.id
  );

  // 리뷰 기록 저장
  db.prepare(
    'INSERT INTO srs_reviews (item_id, quality, reviewed_at) VALUES (?, ?, ?)'
  ).run(item.id, quality, now);

  return db.prepare('SELECT * FROM srs_items WHERE id = ?').get(item.id);
}

module.exports = router;
