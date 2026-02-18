// 스크립트 관리 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// GET /api/v1/scripts — 스크립트 목록 조회
router.get('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const { status } = req.query;

    let query = `SELECT s.*, st.name as topic_name, st.name_en as topic_name_en
                 FROM scripts s
                 LEFT JOIN survey_topics st ON s.topic_id = st.id`;
    const params = [];

    if (status) {
      query += ' WHERE s.status = ?';
      params.push(status);
    }

    query += ' ORDER BY s.updated_at DESC';

    const scripts = db.prepare(query).all(...params);
    res.json(scripts);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/scripts/:id — 스크립트 상세 조회
router.get('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const script = db.prepare(
      `SELECT s.*, st.name as topic_name, st.name_en as topic_name_en
       FROM scripts s
       LEFT JOIN survey_topics st ON s.topic_id = st.id
       WHERE s.id = ?`
    ).get(id);

    if (!script) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '스크립트를 찾을 수 없습니다'
      });
    }

    res.json(script);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/scripts — 새 스크립트 생성
router.post('/', (req, res, next) => {
  try {
    const db = getDatabase();
    const { question_id, topic_id, title, question_text, draft_text, target_level } = req.body;

    if (!topic_id || !title) {
      return res.status(400).json({
        error: true,
        code: 'MISSING_PARAMS',
        message: '필수 파라미터가 누락되었습니다 (topic_id, title)'
      });
    }

    const now = new Date().toISOString();
    const wordCount = (draft_text || '').trim().split(/\s+/).filter(Boolean).length;

    const result = db.prepare(
      `INSERT INTO scripts (question_id, topic_id, title, question_text, draft_text, status, word_count, target_level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?)`
    ).run(
      question_id || null,
      topic_id,
      title,
      question_text || null,
      draft_text || null,
      wordCount,
      target_level || null,
      now,
      now
    );

    const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(result.lastInsertRowid);
    res.json(script);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/scripts/:id — 스크립트 수정
router.put('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '스크립트를 찾을 수 없습니다'
      });
    }

    const {
      title,
      question_text,
      draft_text,
      refined_text,
      final_text,
      status,
      target_level,
      memorization_progress
    } = req.body;

    const now = new Date().toISOString();

    // 현재 텍스트 기반 word_count 재계산
    const activeText = final_text || refined_text || draft_text || existing.final_text || existing.refined_text || existing.draft_text || '';
    const wordCount = activeText.trim().split(/\s+/).filter(Boolean).length;

    db.prepare(
      `UPDATE scripts SET
        title = COALESCE(?, title),
        question_text = COALESCE(?, question_text),
        draft_text = COALESCE(?, draft_text),
        refined_text = COALESCE(?, refined_text),
        final_text = COALESCE(?, final_text),
        status = COALESCE(?, status),
        target_level = COALESCE(?, target_level),
        memorization_progress = COALESCE(?, memorization_progress),
        word_count = ?,
        updated_at = ?
       WHERE id = ?`
    ).run(
      title || null,
      question_text || null,
      draft_text || null,
      refined_text || null,
      final_text || null,
      status || null,
      target_level || null,
      memorization_progress != null ? memorization_progress : null,
      wordCount,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/scripts/:id — 스크립트 삭제 (관련 연습 기록 포함)
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '스크립트를 찾을 수 없습니다'
      });
    }

    const deleteScript = db.transaction(() => {
      db.prepare('DELETE FROM script_practices WHERE script_id = ?').run(id);
      db.prepare('DELETE FROM voice_recordings WHERE script_id = ?').run(id);
      db.prepare('DELETE FROM scripts WHERE id = ?').run(id);
    });

    deleteScript();

    res.json({ success: true, message: '스크립트가 삭제되었습니다' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/scripts/generate — AI 스크립트 생성
router.post('/generate', async (req, res, next) => {
  try {
    const { question_text, target_level, question_type } = req.body;

    if (!question_text || !target_level) {
      return res.status(400).json({
        error: true,
        code: 'MISSING_PARAMS',
        message: '필수 파라미터가 누락되었습니다 (question_text, target_level)'
      });
    }

    let generatedScript;

    try {
      const scriptAI = require('../services/scriptAI');
      generatedScript = await scriptAI.generateScript({ question_text, target_level, question_type });
    } catch (serviceErr) {
      // 서비스 미구현 시 플레이스홀더 응답
      generatedScript = {
        script_text: null,
        message: 'scriptAI.generateScript service not yet implemented'
      };
    }

    res.json(generatedScript);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/scripts/:id/refine — AI 스크립트 개선
router.post('/:id/refine', async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id);
    if (!script) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '스크립트를 찾을 수 없습니다'
      });
    }

    if (!script.draft_text) {
      return res.status(400).json({
        error: true,
        code: 'NO_DRAFT',
        message: '개선할 초안이 없습니다'
      });
    }

    let refinedResult;

    try {
      const scriptAI = require('../services/scriptAI');
      refinedResult = await scriptAI.refineScript({
        draft_text: script.draft_text,
        target_level: script.target_level,
        question_text: script.question_text
      });
    } catch (serviceErr) {
      // 서비스 미구현 시 플레이스홀더 응답
      refinedResult = {
        refined_text: null,
        message: 'scriptAI.refineScript service not yet implemented'
      };
    }

    if (refinedResult.refined_text) {
      const now = new Date().toISOString();
      const wordCount = refinedResult.refined_text.trim().split(/\s+/).filter(Boolean).length;

      db.prepare(
        `UPDATE scripts SET refined_text = ?, status = 'refined', word_count = ?, updated_at = ? WHERE id = ?`
      ).run(refinedResult.refined_text, wordCount, now, id);
    }

    res.json(refinedResult);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/scripts/:id/practice — 연습 기록 저장
router.post('/:id/practice', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;
    const { practice_type, accuracy, duration } = req.body;

    const script = db.prepare('SELECT id FROM scripts WHERE id = ?').get(id);
    if (!script) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '스크립트를 찾을 수 없습니다'
      });
    }

    if (!practice_type) {
      return res.status(400).json({
        error: true,
        code: 'MISSING_PARAMS',
        message: '필수 파라미터가 누락되었습니다 (practice_type)'
      });
    }

    const now = new Date().toISOString();

    const result = db.prepare(
      `INSERT INTO script_practices (script_id, practice_type, accuracy, duration, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, practice_type, accuracy || 0, duration || 0, now);

    const practice = db.prepare('SELECT * FROM script_practices WHERE id = ?').get(result.lastInsertRowid);
    res.json(practice);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/scripts/:id/practices — 연습 기록 조회
router.get('/:id/practices', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const script = db.prepare('SELECT id FROM scripts WHERE id = ?').get(id);
    if (!script) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '스크립트를 찾을 수 없습니다'
      });
    }

    const practices = db.prepare(
      'SELECT * FROM script_practices WHERE script_id = ? ORDER BY created_at DESC'
    ).all(id);

    res.json(practices);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
