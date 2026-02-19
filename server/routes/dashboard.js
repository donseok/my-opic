// 대시보드 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

// GET /api/v1/dashboard/stats — 대시보드 통계 요약
router.get('/stats', (req, res, next) => {
  try {
    const db = getDatabase();

    const totalExams = db.prepare('SELECT COUNT(*) as count FROM exam_sessions').get().count;

    const avgScores = db.prepare(
      `SELECT
        ROUND(AVG(grammar_score)) as avg_grammar,
        ROUND(AVG(fluency_score)) as avg_fluency,
        ROUND(AVG(vocabulary_score)) as avg_vocabulary,
        ROUND(AVG(task_completion_score)) as avg_task_completion,
        ROUND(AVG(content_delivery_score)) as avg_content_delivery
       FROM ai_feedbacks`
    ).get();

    const latestFeedback = db.prepare(
      'SELECT predicted_level FROM ai_feedbacks ORDER BY created_at DESC LIMIT 1'
    ).get();

    const settings = db.prepare('SELECT current_level, target_level FROM user_settings WHERE id = 1').get();

    res.json({
      total_exams: totalExams,
      avg_grammar: avgScores?.avg_grammar || 0,
      avg_fluency: avgScores?.avg_fluency || 0,
      avg_vocabulary: avgScores?.avg_vocabulary || 0,
      avg_task_completion: avgScores?.avg_task_completion || 0,
      avg_content_delivery: avgScores?.avg_content_delivery || 0,
      latest_level: latestFeedback?.predicted_level || null,
      current_level: settings?.current_level || null,
      target_level: settings?.target_level || null
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/trends — 점수 추이 데이터
router.get('/trends', (req, res, next) => {
  try {
    const db = getDatabase();

    const trends = db.prepare(
      `SELECT
        es.id as session_id,
        es.started_at,
        af.predicted_level,
        af.grammar_score,
        af.fluency_score,
        af.vocabulary_score,
        af.task_completion_score,
        af.content_delivery_score
       FROM exam_sessions es
       JOIN ai_feedbacks af ON es.id = af.session_id
       ORDER BY es.started_at ASC`
    ).all();

    res.json(trends);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/skills — 5축 스킬 레이더 데이터
router.get('/skills', (req, res, next) => {
  try {
    const db = getDatabase();

    // 이번주 평균
    const thisWeek = db.prepare(
      `SELECT
        ROUND(AVG(af.grammar_score)) as grammar,
        ROUND(AVG(af.vocabulary_score)) as vocabulary,
        ROUND(AVG(af.fluency_score)) as fluency,
        ROUND(AVG(af.task_completion_score)) as task_completion,
        ROUND(AVG(af.content_delivery_score)) as content_delivery
       FROM ai_feedbacks af
       JOIN exam_sessions es ON af.session_id = es.id
       WHERE es.started_at >= date('now', '-7 days')`
    ).get();

    // 지난주 평균
    const lastWeek = db.prepare(
      `SELECT
        ROUND(AVG(af.grammar_score)) as grammar,
        ROUND(AVG(af.vocabulary_score)) as vocabulary,
        ROUND(AVG(af.fluency_score)) as fluency,
        ROUND(AVG(af.task_completion_score)) as task_completion,
        ROUND(AVG(af.content_delivery_score)) as content_delivery
       FROM ai_feedbacks af
       JOIN exam_sessions es ON af.session_id = es.id
       WHERE es.started_at >= date('now', '-14 days')
         AND es.started_at < date('now', '-7 days')`
    ).get();

    res.json({
      this_week: {
        grammar: thisWeek?.grammar || 0,
        vocabulary: thisWeek?.vocabulary || 0,
        fluency: thisWeek?.fluency || 0,
        task_completion: thisWeek?.task_completion || 0,
        content_delivery: thisWeek?.content_delivery || 0
      },
      last_week: {
        grammar: lastWeek?.grammar || 0,
        vocabulary: lastWeek?.vocabulary || 0,
        fluency: lastWeek?.fluency || 0,
        task_completion: lastWeek?.task_completion || 0,
        content_delivery: lastWeek?.content_delivery || 0
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/study-time — 학습 시간 데이터
router.get('/study-time', (req, res, next) => {
  try {
    const db = getDatabase();

    // 오늘 학습 시간
    const today = db.prepare(
      `SELECT COALESCE(SUM(duration), 0) as total
       FROM study_sessions
       WHERE date(started_at) = date('now')`
    ).get();

    // 이번 주 학습 시간
    const week = db.prepare(
      `SELECT COALESCE(SUM(duration), 0) as total
       FROM study_sessions
       WHERE started_at >= date('now', '-7 days')`
    ).get();

    // 활동 유형별 이번 주 시간
    const byType = db.prepare(
      `SELECT activity_type, COALESCE(SUM(duration), 0) as total
       FROM study_sessions
       WHERE started_at >= date('now', '-7 days')
       GROUP BY activity_type`
    ).all();

    res.json({
      today_seconds: today.total,
      week_seconds: week.total,
      by_type: byType
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/streak — 학습 스트릭 데이터
router.get('/streak', (req, res, next) => {
  try {
    const db = getDatabase();

    // 최근 120일간 학습 날짜 목록
    const studyDates = db.prepare(
      `SELECT DISTINCT date(started_at) as study_date
       FROM study_sessions
       WHERE started_at >= date('now', '-120 days')
       ORDER BY study_date DESC`
    ).all().map(r => r.study_date);

    // 시험 날짜도 포함
    const examDates = db.prepare(
      `SELECT DISTINCT date(started_at) as study_date
       FROM exam_sessions
       WHERE started_at >= date('now', '-120 days')
       ORDER BY study_date DESC`
    ).all().map(r => r.study_date);

    const allDates = [...new Set([...studyDates, ...examDates])].sort().reverse();

    // 연속 스트릭 계산
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (allDates.includes(today) || allDates.includes(yesterday)) {
      let checkDate = allDates.includes(today) ? new Date() : new Date(Date.now() - 86400000);
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (allDates.includes(dateStr)) {
          streak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    // 히트맵 데이터 (최근 12주, 84일)
    const heatmap = db.prepare(
      `SELECT date(started_at) as study_date, SUM(duration) as total_minutes
       FROM study_sessions
       WHERE started_at >= date('now', '-84 days')
       GROUP BY date(started_at)`
    ).all();

    res.json({
      current_streak: streak,
      total_study_days: allDates.length,
      heatmap: heatmap.map(h => ({
        date: h.study_date,
        minutes: Math.round(h.total_minutes / 60)
      }))
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/dashboard/weekly — 주간 요약
router.get('/weekly', (req, res, next) => {
  try {
    const db = getDatabase();

    const studyTime = db.prepare(
      `SELECT COALESCE(SUM(duration), 0) as total
       FROM study_sessions
       WHERE started_at >= date('now', '-7 days')`
    ).get();

    const exams = db.prepare(
      `SELECT COUNT(*) as count
       FROM exam_sessions
       WHERE started_at >= date('now', '-7 days')`
    ).get();

    const completedTasks = db.prepare(
      `SELECT COUNT(*) as count
       FROM study_tasks st
       JOIN study_plans sp ON st.plan_id = sp.id
       WHERE sp.plan_date >= date('now', '-7 days')
         AND st.is_completed = 1`
    ).get();

    const totalTasks = db.prepare(
      `SELECT COUNT(*) as count
       FROM study_tasks st
       JOIN study_plans sp ON st.plan_id = sp.id
       WHERE sp.plan_date >= date('now', '-7 days')`
    ).get();

    res.json({
      study_time_seconds: studyTime.total,
      exam_count: exams.count,
      completed_tasks: completedTasks.count,
      total_tasks: totalTasks.count
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
