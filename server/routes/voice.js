// 음성 녹음 및 분석 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// POST /api/v1/voice/upload — 음성 녹음 저장
router.post('/upload', (req, res, next) => {
  try {
    const db = getDatabase();
    const { exam_answer_id, script_id, audio_data, duration } = req.body;

    if (!audio_data) {
      return res.status(400).json({
        error: true,
        code: 'MISSING_AUDIO',
        message: '오디오 데이터가 필요합니다 (audio_data)'
      });
    }

    const now = new Date().toISOString();

    const result = db.prepare(
      `INSERT INTO voice_recordings (exam_answer_id, script_id, audio_blob, duration, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      exam_answer_id || null,
      script_id || null,
      audio_data,
      duration || 0,
      now
    );

    res.json({
      id: result.lastInsertRowid,
      created_at: now
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/voice/:id — 녹음 상세 조회
router.get('/:id', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const recording = db.prepare('SELECT * FROM voice_recordings WHERE id = ?').get(id);

    if (!recording) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '녹음 데이터를 찾을 수 없습니다'
      });
    }

    res.json(recording);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/voice/:id/analyze — 음성 분석 요청 (Gemini)
router.post('/:id/analyze', async (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const recording = db.prepare('SELECT * FROM voice_recordings WHERE id = ?').get(id);

    if (!recording) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '녹음 데이터를 찾을 수 없습니다'
      });
    }

    let analysisResult;

    try {
      const { analyzeVoiceRecording } = require('../services/gemini');
      analysisResult = await analyzeVoiceRecording(recording);
    } catch (serviceErr) {
      // 서비스 미구현 시 플레이스홀더 응답
      analysisResult = {
        pronunciation_score: null,
        fluency_score: null,
        intonation_score: null,
        pace_wpm: null,
        filler_words: [],
        pause_count: 0,
        clarity_score: null,
        feedback: { message: 'analyzeVoiceRecording service not yet implemented' }
      };
    }

    const now = new Date().toISOString();

    const result = db.prepare(
      `INSERT INTO voice_analyses
       (recording_id, pronunciation_score, fluency_score, intonation_score, pace_wpm, filler_words, pause_count, clarity_score, feedback, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      analysisResult.pronunciation_score,
      analysisResult.fluency_score,
      analysisResult.intonation_score,
      analysisResult.pace_wpm,
      JSON.stringify(analysisResult.filler_words || []),
      analysisResult.pause_count || 0,
      analysisResult.clarity_score,
      JSON.stringify(analysisResult.feedback || {}),
      now
    );

    res.json({
      id: result.lastInsertRowid,
      recording_id: Number(id),
      ...analysisResult,
      created_at: now
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/voice/:id/analysis — 녹음 분석 결과 조회
router.get('/:id/analysis', (req, res, next) => {
  try {
    const db = getDatabase();
    const { id } = req.params;

    const analysis = db.prepare(
      'SELECT * FROM voice_analyses WHERE recording_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(id);

    if (!analysis) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '분석 결과를 찾을 수 없습니다'
      });
    }

    // JSON 문자열 파싱
    analysis.filler_words = JSON.parse(analysis.filler_words || '[]');
    analysis.feedback = JSON.parse(analysis.feedback || '{}');

    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
