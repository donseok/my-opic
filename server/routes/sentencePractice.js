// 문장별 발음 연습 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');
const { evaluateSentencePronunciation, scoreToGrade } = require('../services/sentenceAI');

// POST /api/v1/sentence-practice/split — 스크립트를 문장 단위로 분리
router.post('/split', (req, res, next) => {
    try {
        const db = getDatabase();
        const { script_id } = req.body;

        if (!script_id) {
            return res.status(400).json({
                error: true,
                code: 'MISSING_PARAMS',
                message: 'script_id가 필요합니다'
            });
        }

        const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(script_id);
        if (!script) {
            return res.status(404).json({
                error: true,
                code: 'NOT_FOUND',
                message: '스크립트를 찾을 수 없습니다'
            });
        }

        // final_text > refined_text > draft_text 순으로 우선
        const text = script.final_text || script.refined_text || script.draft_text || '';
        if (!text.trim()) {
            return res.status(400).json({
                error: true,
                code: 'EMPTY_SCRIPT',
                message: '스크립트 내용이 비어있습니다'
            });
        }

        // 문장 분리 (마침표, 느낌표, 물음표 기준)
        const sentences = text
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // 기존 연습 현황 조회
        const existing = db.prepare(
            'SELECT sentence_index, best_grade, best_score, attempt_count FROM sentence_practices WHERE script_id = ? ORDER BY sentence_index'
        ).all(script_id);

        const practiceMap = {};
        existing.forEach(e => {
            practiceMap[e.sentence_index] = e;
        });

        const result = sentences.map((sentence, idx) => ({
            index: idx,
            text: sentence,
            best_grade: practiceMap[idx]?.best_grade || null,
            best_score: practiceMap[idx]?.best_score || 0,
            attempt_count: practiceMap[idx]?.attempt_count || 0
        }));

        res.json({
            script_id: Number(script_id),
            title: script.title,
            total_sentences: sentences.length,
            sentences: result
        });
    } catch (err) {
        next(err);
    }
});

// POST /api/v1/sentence-practice/evaluate — 문장 발음 평가
router.post('/evaluate', async (req, res, next) => {
    try {
        const db = getDatabase();
        const { script_id, sentence_index, sentence_text, audio_data } = req.body;

        if (!script_id || sentence_index === undefined || !sentence_text) {
            return res.status(400).json({
                error: true,
                code: 'MISSING_PARAMS',
                message: 'script_id, sentence_index, sentence_text가 필요합니다'
            });
        }

        // AI 발음 평가
        let evalResult;
        if (audio_data) {
            evalResult = await evaluateSentencePronunciation(audio_data, sentence_text);
        } else {
            // 오디오 없이 텍스트만으로 시뮬레이션
            evalResult = {
                pronunciation_score: 0,
                pronunciation_grade: 'NM',
                overall_feedback: '오디오 데이터가 없어 평가할 수 없습니다. 녹음 후 다시 시도해주세요.',
                simulated: true
            };
        }

        const now = new Date().toISOString();
        const grade = evalResult.pronunciation_grade;
        const score = evalResult.pronunciation_score;

        // 기존 기록 조회
        const existing = db.prepare(
            'SELECT * FROM sentence_practices WHERE script_id = ? AND sentence_index = ? ORDER BY created_at DESC LIMIT 1'
        ).get(script_id, sentence_index);

        if (existing) {
            // 기존 기록 업데이트 (최고 점수 갱신)
            const newBestScore = Math.max(existing.best_score || 0, score);
            const newBestGrade = newBestScore === score ? grade : (existing.best_grade || grade);
            const newAttempt = (existing.attempt_count || 1) + 1;

            db.prepare(
                `UPDATE sentence_practices
         SET pronunciation_grade = ?, pronunciation_score = ?,
             accuracy_detail = ?, attempt_count = ?,
             best_grade = ?, best_score = ?,
             audio_blob = COALESCE(?, audio_blob),
             created_at = ?
         WHERE id = ?`
            ).run(
                grade, score,
                JSON.stringify(evalResult),
                newAttempt,
                newBestGrade, newBestScore,
                audio_data || null,
                now,
                existing.id
            );

            res.json({
                id: existing.id,
                ...evalResult,
                attempt_count: newAttempt,
                best_grade: newBestGrade,
                best_score: newBestScore,
                improved: score > (existing.best_score || 0)
            });
        } else {
            // 새 기록 생성
            const result = db.prepare(
                `INSERT INTO sentence_practices
         (script_id, sentence_index, sentence_text, audio_blob, pronunciation_grade, pronunciation_score, accuracy_detail, attempt_count, best_grade, best_score, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
            ).run(
                script_id, sentence_index, sentence_text,
                audio_data || null,
                grade, score,
                JSON.stringify(evalResult),
                grade, score,
                now
            );

            res.json({
                id: result.lastInsertRowid,
                ...evalResult,
                attempt_count: 1,
                best_grade: grade,
                best_score: score,
                improved: true
            });
        }
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/sentence-practice/script/:id — 스크립트별 문장 연습 현황
router.get('/script/:id', (req, res, next) => {
    try {
        const db = getDatabase();
        const { id } = req.params;

        const script = db.prepare('SELECT id, title FROM scripts WHERE id = ?').get(id);
        if (!script) {
            return res.status(404).json({
                error: true,
                code: 'NOT_FOUND',
                message: '스크립트를 찾을 수 없습니다'
            });
        }

        const practices = db.prepare(
            `SELECT sentence_index, sentence_text, pronunciation_grade, pronunciation_score,
              best_grade, best_score, attempt_count, created_at
       FROM sentence_practices
       WHERE script_id = ?
       ORDER BY sentence_index`
        ).all(id);

        // 통계 계산
        const totalPracticed = practices.length;
        const avgScore = totalPracticed > 0
            ? Math.round(practices.reduce((sum, p) => sum + (p.best_score || 0), 0) / totalPracticed)
            : 0;
        const totalAttempts = practices.reduce((sum, p) => sum + (p.attempt_count || 0), 0);

        // 등급 분포
        const gradeDistribution = { AL: 0, IH: 0, IM: 0, IL: 0, NM: 0 };
        practices.forEach(p => {
            if (p.best_grade && gradeDistribution[p.best_grade] !== undefined) {
                gradeDistribution[p.best_grade]++;
            }
        });

        res.json({
            script_id: Number(id),
            title: script.title,
            total_practiced: totalPracticed,
            avg_score: avgScore,
            total_attempts: totalAttempts,
            grade_distribution: gradeDistribution,
            sentences: practices
        });
    } catch (err) {
        next(err);
    }
});

// GET /api/v1/sentence-practice/stats — 전체 문장 연습 통계
router.get('/stats', (req, res, next) => {
    try {
        const db = getDatabase();

        const totalPractices = db.prepare(
            'SELECT COUNT(*) as count FROM sentence_practices'
        ).get().count;

        const totalAttempts = db.prepare(
            'SELECT COALESCE(SUM(attempt_count), 0) as total FROM sentence_practices'
        ).get().total;

        const avgScore = db.prepare(
            'SELECT ROUND(AVG(best_score)) as avg FROM sentence_practices WHERE best_score > 0'
        ).get().avg || 0;

        const gradeDistribution = db.prepare(
            `SELECT best_grade as grade, COUNT(*) as count
       FROM sentence_practices
       WHERE best_grade IS NOT NULL
       GROUP BY best_grade`
        ).all();

        const recentPractices = db.prepare(
            `SELECT sp.*, s.title as script_title
       FROM sentence_practices sp
       JOIN scripts s ON sp.script_id = s.id
       ORDER BY sp.created_at DESC LIMIT 10`
        ).all();

        res.json({
            total_sentences_practiced: totalPractices,
            total_attempts: totalAttempts,
            avg_best_score: avgScore,
            grade_distribution: gradeDistribution,
            recent: recentPractices
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
