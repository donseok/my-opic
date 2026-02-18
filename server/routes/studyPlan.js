// 학습 계획 API 라우터
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../db/database');

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * plan_id에 해당하는 태스크 목록을 조회
 */
function getTasksForPlan(db, planId) {
  return db.prepare(
    'SELECT * FROM study_tasks WHERE plan_id = ? ORDER BY priority DESC, id ASC'
  ).all(planId);
}

/**
 * 학습 계획의 완료율을 재계산하고 갱신
 */
function recalculateCompletionRate(db, planId) {
  const stats = db.prepare(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
     FROM study_tasks WHERE plan_id = ?`
  ).get(planId);

  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  db.prepare(
    `UPDATE study_plans SET completed_tasks = ?, completion_rate = ? WHERE id = ?`
  ).run(stats.completed, completionRate, planId);

  return completionRate;
}

// GET /api/v1/study-plan/today — 오늘의 학습 계획 조회 (없으면 자동 생성)
router.get('/today', (req, res, next) => {
  try {
    const db = getDatabase();
    const today = getTodayDate();

    let plan = db.prepare('SELECT * FROM study_plans WHERE plan_date = ?').get(today);

    if (!plan) {
      // 자동 생성 시도
      let generated;

      try {
        const studyPlanService = require('../services/studyPlanService');
        generated = studyPlanService.generateDailyPlan(db, today);
      } catch (serviceErr) {
        // 서비스 미구현 시 기본 계획 생성
        generated = generateDefaultPlan(db, today);
      }

      plan = db.prepare('SELECT * FROM study_plans WHERE plan_date = ?').get(today);

      if (!plan) {
        return res.status(500).json({
          error: true,
          code: 'PLAN_GENERATION_FAILED',
          message: '학습 계획 생성에 실패했습니다'
        });
      }
    }

    const tasks = getTasksForPlan(db, plan.id);

    res.json({ ...plan, tasks });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/study-plan/generate — 오늘의 학습 계획 강제 재생성
router.post('/generate', (req, res, next) => {
  try {
    const db = getDatabase();
    const today = getTodayDate();

    // 기존 계획이 있으면 태스크와 함께 삭제
    const existingPlan = db.prepare('SELECT id FROM study_plans WHERE plan_date = ?').get(today);
    if (existingPlan) {
      const deletePlan = db.transaction(() => {
        db.prepare('DELETE FROM study_tasks WHERE plan_id = ?').run(existingPlan.id);
        db.prepare('DELETE FROM study_plans WHERE id = ?').run(existingPlan.id);
      });
      deletePlan();
    }

    // 재생성
    try {
      const studyPlanService = require('../services/studyPlanService');
      studyPlanService.generateDailyPlan(db, today);
    } catch (serviceErr) {
      // 서비스 미구현 시 기본 계획 생성
      generateDefaultPlan(db, today);
    }

    const plan = db.prepare('SELECT * FROM study_plans WHERE plan_date = ?').get(today);

    if (!plan) {
      return res.status(500).json({
        error: true,
        code: 'PLAN_GENERATION_FAILED',
        message: '학습 계획 생성에 실패했습니다'
      });
    }

    const tasks = getTasksForPlan(db, plan.id);

    res.json({ ...plan, tasks });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/study-plan/tasks/:taskId/complete — 태스크 완료 처리
router.put('/tasks/:taskId/complete', (req, res, next) => {
  try {
    const db = getDatabase();
    const { taskId } = req.params;

    const task = db.prepare('SELECT * FROM study_tasks WHERE id = ?').get(taskId);

    if (!task) {
      return res.status(404).json({
        error: true,
        code: 'NOT_FOUND',
        message: '태스크를 찾을 수 없습니다'
      });
    }

    const now = new Date().toISOString();

    db.prepare(
      'UPDATE study_tasks SET is_completed = 1, completed_at = ? WHERE id = ?'
    ).run(now, taskId);

    const completionRate = recalculateCompletionRate(db, task.plan_id);

    const updatedTask = db.prepare('SELECT * FROM study_tasks WHERE id = ?').get(taskId);

    res.json({
      task: updatedTask,
      plan_completion_rate: completionRate
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/study-plan/history — 최근 7일 학습 계획 이력
router.get('/history', (req, res, next) => {
  try {
    const db = getDatabase();

    const plans = db.prepare(
      `SELECT * FROM study_plans
       ORDER BY plan_date DESC
       LIMIT 7`
    ).all();

    // 각 계획에 태스크 포함
    const plansWithTasks = plans.map(plan => ({
      ...plan,
      tasks: getTasksForPlan(db, plan.id)
    }));

    res.json(plansWithTasks);
  } catch (err) {
    next(err);
  }
});

/**
 * 기본 학습 계획 생성 (서비스 미구현 시 폴백)
 * SRS 복습, 스크립트 연습, 모의시험 등 기본 태스크를 포함
 */
function generateDefaultPlan(db, planDate) {
  const now = new Date().toISOString();

  const tasks = [];

  // SRS 복습 대상 확인
  const dueCount = db.prepare(
    'SELECT COUNT(*) as count FROM srs_items WHERE next_review_date <= ?'
  ).get(planDate).count;

  if (dueCount > 0) {
    tasks.push({
      task_type: 'srs_review',
      title: `SRS 복습 (${dueCount}개 항목)`,
      description: '오늘 복습할 간격반복 항목을 학습하세요',
      priority: 3
    });
  }

  // 진행 중인 스크립트 확인
  const activeScripts = db.prepare(
    "SELECT COUNT(*) as count FROM scripts WHERE status IN ('draft', 'refined', 'memorizing')"
  ).get().count;

  if (activeScripts > 0) {
    tasks.push({
      task_type: 'script_review',
      title: '스크립트 연습',
      description: `진행 중인 스크립트 ${activeScripts}개를 연습하세요`,
      priority: 2
    });
  }

  // 기본 모의시험 태스크
  tasks.push({
    task_type: 'exam',
    title: '모의시험 1회',
    description: '실전 감각 유지를 위해 모의시험을 실시하세요',
    priority: 1
  });

  // 태스크가 없는 경우 기본 태스크 추가
  if (tasks.length === 0) {
    tasks.push({
      task_type: 'skill_practice',
      title: '질문 유형 학습',
      description: '새로운 질문 유형을 살펴보세요',
      priority: 1
    });
  }

  const createPlan = db.transaction(() => {
    const planResult = db.prepare(
      'INSERT INTO study_plans (plan_date, total_tasks, completed_tasks, completion_rate, created_at) VALUES (?, ?, 0, 0, ?)'
    ).run(planDate, tasks.length, now);

    const planId = planResult.lastInsertRowid;

    const insertTask = db.prepare(
      'INSERT INTO study_tasks (plan_id, task_type, title, description, priority) VALUES (?, ?, ?, ?, ?)'
    );

    for (const task of tasks) {
      insertTask.run(planId, task.task_type, task.title, task.description, task.priority);
    }
  });

  createPlan();
}

module.exports = router;
