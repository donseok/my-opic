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

// GET /api/v1/topics/recommendations — 목표 레벨 기반 서베이 추천 조합
router.get('/recommendations', (req, res, next) => {
  try {
    const db = getDatabase();

    // 사용자 설정에서 목표 레벨 조회
    const settings = db.prepare('SELECT target_level FROM user_settings WHERE id = 1').get();
    const targetLevel = settings?.target_level || 'IM1';

    // 레벨별 추천 전략 팁
    const levelTips = db.prepare(
      `SELECT * FROM survey_tips
       WHERE (target_level = ? OR target_level IS NULL)
         AND tip_type = 'strategy'
       ORDER BY priority DESC`
    ).all(targetLevel);

    // 주제별 선택 팁
    const selectionTips = db.prepare(
      `SELECT st.*, t.name as topic_name, t.icon as topic_icon
       FROM survey_tips st
       LEFT JOIN survey_topics t ON st.topic_id = t.id
       WHERE st.tip_type = 'selection'
       ORDER BY st.priority DESC`
    ).all();

    // 경고 팁
    const warnings = db.prepare(
      `SELECT * FROM survey_tips
       WHERE tip_type = 'warning'
       ORDER BY priority DESC`
    ).all();

    // 레벨별 추천 조합 생성
    let recommendedIds;
    if (['IH', 'AL'].includes(targetLevel)) {
      recommendedIds = [1, 3, 8, 9, 10]; // 자기소개, 여가, 기술, 교육, 직장
    } else if (['IM2', 'IM3'].includes(targetLevel)) {
      recommendedIds = [1, 2, 3, 5, 7]; // 자기소개, 집, 여가, 운동, 요리
    } else {
      recommendedIds = [1, 2, 3, 7]; // 자기소개, 집, 여가, 요리
    }

    const recommendedTopics = db.prepare(
      `SELECT * FROM survey_topics WHERE id IN (${recommendedIds.map(() => '?').join(',')})`
    ).all(...recommendedIds);

    res.json({
      target_level: targetLevel,
      recommended_topics: recommendedTopics,
      strategy_tips: levelTips,
      selection_tips: selectionTips,
      warnings
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/topics/tips — 현재 선택/레벨에 맞는 꿀팁
router.get('/tips', (req, res, next) => {
  try {
    const db = getDatabase();

    const settings = db.prepare('SELECT target_level FROM user_settings WHERE id = 1').get();
    const targetLevel = settings?.target_level || null;

    // 선택된 주제 조회
    const selectedTopics = db.prepare(
      'SELECT id FROM survey_topics WHERE is_selected = 1'
    ).all().map(t => t.id);

    // 전체 공통 팁 + 레벨별 팁
    let tips = db.prepare(
      `SELECT * FROM survey_tips
       WHERE (target_level IS NULL OR target_level = ?)
         AND (topic_id IS NULL OR topic_id IN (${selectedTopics.length > 0 ? selectedTopics.map(() => '?').join(',') : '0'}))
       ORDER BY priority DESC`
    ).all(targetLevel, ...selectedTopics);

    res.json({
      target_level: targetLevel,
      selected_topic_count: selectedTopics.length,
      tips
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
