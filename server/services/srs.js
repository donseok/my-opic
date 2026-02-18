// SRS (Spaced Repetition System) 서비스
// SM-2 알고리즘 기반 간격반복 학습

const { getDatabase } = require('../db/database');

/**
 * SM-2 알고리즘으로 복습 결과를 처리하고 다음 복습 일정을 계산
 * @param {import('better-sqlite3').Database} db - 데이터베이스 인스턴스
 * @param {number} itemId - SRS 항목 ID
 * @param {number} quality - 응답 품질 (0=기억 못 함, 5=완벽)
 * @returns {Object} 업데이트된 SRS 항목
 */
function processReview(db, itemId, quality) {
  // 입력 검증
  if (quality < 0 || quality > 5 || !Number.isInteger(quality)) {
    throw new Error('quality는 0~5 사이의 정수여야 합니다');
  }

  // 현재 항목 조회
  const item = db.prepare('SELECT * FROM srs_items WHERE id = ?').get(itemId);
  if (!item) {
    const err = new Error('SRS 항목을 찾을 수 없습니다');
    err.status = 404;
    throw err;
  }

  let { ease_factor, interval, repetitions } = item;
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // SM-2 알고리즘 적용
  if (quality >= 3) {
    // 성공적인 복습
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
    repetitions++;
  } else {
    // 실패 — 처음부터 다시
    interval = 1;
    repetitions = 0;
  }

  // ease_factor 업데이트 (최소 1.3)
  ease_factor = Math.max(
    1.3,
    ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // 소수점 둘째 자리까지 반올림
  ease_factor = Math.round(ease_factor * 100) / 100;

  // 다음 복습 날짜 계산
  const nextDate = new Date(today);
  nextDate.setDate(nextDate.getDate() + interval);
  const nextReviewDate = nextDate.toISOString().split('T')[0];

  // 트랜잭션으로 항목 업데이트 + 리뷰 기록 삽입
  const updateAndRecord = db.transaction(() => {
    // srs_items 업데이트
    db.prepare(`
      UPDATE srs_items
      SET ease_factor = ?, interval = ?, repetitions = ?,
          next_review_date = ?, updated_at = ?
      WHERE id = ?
    `).run(ease_factor, interval, repetitions, nextReviewDate, now, itemId);

    // srs_reviews 기록 삽입
    db.prepare(`
      INSERT INTO srs_reviews (item_id, quality, reviewed_at)
      VALUES (?, ?, ?)
    `).run(itemId, quality, now);
  });

  updateAndRecord();

  // 업데이트된 항목 반환
  return db.prepare('SELECT * FROM srs_items WHERE id = ?').get(itemId);
}

/**
 * answer_guides의 key_phrases에서 SRS 항목을 자동 생성
 * 이미 존재하는 항목은 건너뜀
 * @param {import('better-sqlite3').Database} db - 데이터베이스 인스턴스
 * @returns {number} 생성된 항목 수
 */
function seedFromGuides(db) {
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // 모든 답변 가이드 조회
  const guides = db.prepare(
    'SELECT id, level_code, key_phrases FROM answer_guides WHERE key_phrases IS NOT NULL'
  ).all();

  // 기존 SRS 항목의 (source_id, front_text) 조합 조회하여 중복 방지
  const existingItems = db.prepare(
    "SELECT source_id, front_text FROM srs_items WHERE item_type = 'phrase'"
  ).all();

  const existingSet = new Set(
    existingItems.map(item => `${item.source_id}::${item.front_text}`)
  );

  const insertItem = db.prepare(`
    INSERT INTO srs_items (item_type, front_text, back_text, source_id,
                           ease_factor, interval, repetitions,
                           next_review_date, created_at, updated_at)
    VALUES ('phrase', ?, ?, ?, 2.5, 0, 0, ?, ?, ?)
  `);

  let createdCount = 0;

  const insertAll = db.transaction(() => {
    for (const guide of guides) {
      let phrases;
      try {
        phrases = JSON.parse(guide.key_phrases);
      } catch (e) {
        // JSON 파싱 실패 시 건너뜀
        continue;
      }

      if (!Array.isArray(phrases)) {
        continue;
      }

      for (const phrase of phrases) {
        if (!phrase || typeof phrase !== 'string') {
          continue;
        }

        const key = `${guide.id}::${phrase}`;
        if (existingSet.has(key)) {
          continue;
        }

        const backText = `Key expression for ${guide.level_code} level`;
        insertItem.run(phrase, backText, guide.id, today, now, now);
        existingSet.add(key);
        createdCount++;
      }
    }
  });

  insertAll();

  return createdCount;
}

module.exports = { processReview, seedFromGuides };
