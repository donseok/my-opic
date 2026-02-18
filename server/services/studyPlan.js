// 학습 계획 생성 서비스
// 시험 결과 분석 기반 일일 학습 계획 자동 생성

const { getDatabase } = require('../db/database');

/**
 * 최근 시험 결과를 분석하여 일일 학습 계획을 생성
 * @param {import('better-sqlite3').Database} db - 데이터베이스 인스턴스
 * @returns {Object} {plan_id, tasks: [{task_type, title, description, priority}]}
 */
function generateDailyPlan(db) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // 이미 오늘의 계획이 있으면 반환
  const existingPlan = db.prepare(
    'SELECT id FROM study_plans WHERE plan_date = ?'
  ).get(today);

  if (existingPlan) {
    const existingTasks = db.prepare(
      'SELECT task_type, title, description, priority, is_completed FROM study_tasks WHERE plan_id = ? ORDER BY priority DESC'
    ).all(existingPlan.id);
    return { plan_id: existingPlan.id, tasks: existingTasks };
  }

  const tasks = [];

  // 1. 최근 5회 시험 세션의 AI 피드백 조회
  const recentFeedbacks = db.prepare(`
    SELECT af.grammar_score, af.fluency_score, af.vocabulary_score,
           af.pronunciation_score, af.content_organization_score,
           es.completed_at, es.target_level
    FROM ai_feedbacks af
    JOIN exam_sessions es ON af.session_id = es.id
    WHERE es.completed_at IS NOT NULL
    ORDER BY es.completed_at DESC
    LIMIT 5
  `).all();

  // 2. 5축 평균 점수 계산
  const avgScores = {
    grammar: 0,
    vocabulary: 0,
    fluency: 0,
    pronunciation: 0,
    content_organization: 0
  };

  if (recentFeedbacks.length > 0) {
    let counts = { grammar: 0, vocabulary: 0, fluency: 0, pronunciation: 0, content_organization: 0 };

    for (const fb of recentFeedbacks) {
      if (fb.grammar_score != null) { avgScores.grammar += fb.grammar_score; counts.grammar++; }
      if (fb.vocabulary_score != null) { avgScores.vocabulary += fb.vocabulary_score; counts.vocabulary++; }
      if (fb.fluency_score != null) { avgScores.fluency += fb.fluency_score; counts.fluency++; }
      if (fb.pronunciation_score != null) { avgScores.pronunciation += fb.pronunciation_score; counts.pronunciation++; }
      if (fb.content_organization_score != null) { avgScores.content_organization += fb.content_organization_score; counts.content_organization++; }
    }

    for (const key of Object.keys(avgScores)) {
      avgScores[key] = counts[key] > 0 ? Math.round(avgScores[key] / counts[key]) : 0;
    }
  }

  // 3. 약점 영역 식별 (80점 미만)
  const WEAKNESS_THRESHOLD = 80;
  const weakAreas = [];
  const skillNames = {
    grammar: '문법 (Grammar)',
    vocabulary: '어휘 (Vocabulary)',
    fluency: '유창성 (Fluency)',
    pronunciation: '발음 (Pronunciation)',
    content_organization: '내용 구성 (Content Organization)'
  };

  for (const [key, score] of Object.entries(avgScores)) {
    if (score > 0 && score < WEAKNESS_THRESHOLD) {
      weakAreas.push({ skill: key, score, name: skillNames[key] });
    }
  }

  // 점수가 낮은 순으로 정렬
  weakAreas.sort((a, b) => a.score - b.score);

  // 4. SRS 복습 대기 항목 수 확인
  const srsDueCount = db.prepare(
    'SELECT COUNT(*) as count FROM srs_items WHERE next_review_date <= ?'
  ).get(today).count;

  // 5. 암기 중인 스크립트 확인
  const memorizingScripts = db.prepare(
    "SELECT COUNT(*) as count FROM scripts WHERE status = 'memorizing'"
  ).get().count;

  // 6. 마지막 시험 이후 경과 일수
  const lastExam = db.prepare(
    'SELECT completed_at FROM exam_sessions WHERE completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 1'
  ).get();

  let daysSinceLastExam = 999;
  if (lastExam && lastExam.completed_at) {
    const lastDate = new Date(lastExam.completed_at);
    const todayDate = new Date(today);
    daysSinceLastExam = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
  }

  // 7. 약점 질문 유형 파악
  const weakQuestionTypes = db.prepare(`
    SELECT q.type, AVG(ea.word_count) as avg_words,
           COUNT(*) as attempt_count
    FROM exam_answers ea
    JOIN questions q ON ea.question_id = q.id
    JOIN exam_sessions es ON ea.session_id = es.id
    WHERE es.completed_at IS NOT NULL
    GROUP BY q.type
    HAVING avg_words < 60
    ORDER BY avg_words ASC
  `).all();

  // --- 태스크 생성 ---

  // SRS 복습 대기 항목 (priority: 10)
  if (srsDueCount > 0) {
    tasks.push({
      task_type: 'srs_review',
      title: `SRS 복습 (${srsDueCount}개 항목)`,
      description: `오늘 복습할 간격반복 항목이 ${srsDueCount}개 있습니다. 핵심 표현을 복습하세요.`,
      priority: 10
    });
  }

  // 약점 스킬 연습 (priority: 8)
  for (const area of weakAreas.slice(0, 2)) {
    tasks.push({
      task_type: 'skill_practice',
      title: `${area.name} 강화 연습`,
      description: `현재 평균 ${area.score}점으로 목표(80점) 미달입니다. 관련 표현과 패턴을 집중 연습하세요.`,
      priority: 8
    });
  }

  // 스크립트 복습 (priority: 6)
  if (memorizingScripts > 0) {
    tasks.push({
      task_type: 'script_review',
      title: `스크립트 암기 복습 (${memorizingScripts}개)`,
      description: `암기 중인 스크립트 ${memorizingScripts}개를 복습하세요. 소리 내어 읽기를 권장합니다.`,
      priority: 6
    });
  }

  // 약점 질문 유형 연습 (priority: 4)
  for (const qt of weakQuestionTypes.slice(0, 2)) {
    const typeNames = {
      survey: '서베이',
      combo: '콤보',
      roleplay: '롤플레이',
      unexpected: '돌발'
    };
    const typeName = typeNames[qt.type] || qt.type;
    tasks.push({
      task_type: 'skill_practice',
      title: `${typeName} 유형 답변 연습`,
      description: `${typeName} 유형의 평균 답변 길이가 ${Math.round(qt.avg_words)}단어로 부족합니다. 답변 길이와 구조를 개선하세요.`,
      priority: 4
    });
  }

  // 모의 시험 (3일 이상 경과 시) (priority: 2)
  if (daysSinceLastExam > 3) {
    tasks.push({
      task_type: 'exam',
      title: '모의 시험 응시',
      description: `마지막 시험으로부터 ${daysSinceLastExam}일 경과했습니다. 실전 감각 유지를 위해 모의 시험을 응시하세요.`,
      priority: 2
    });
  }

  // 태스크가 하나도 없으면 기본 태스크 추가
  if (tasks.length === 0) {
    tasks.push({
      task_type: 'skill_practice',
      title: '자유 연습',
      description: '특별한 약점이 발견되지 않았습니다. 관심 주제의 질문을 선택하여 자유롭게 연습하세요.',
      priority: 5
    });
  }

  // DB에 학습 계획 저장
  const insertPlan = db.prepare(
    'INSERT INTO study_plans (plan_date, total_tasks, completed_tasks, completion_rate, created_at) VALUES (?, ?, 0, 0, ?)'
  );
  const planResult = insertPlan.run(today, tasks.length, now);
  const planId = planResult.lastInsertRowid;

  // 태스크 저장
  const insertTask = db.prepare(
    'INSERT INTO study_tasks (plan_id, task_type, title, description, priority, is_completed) VALUES (?, ?, ?, ?, ?, 0)'
  );

  const insertAll = db.transaction((planId, tasks) => {
    for (const task of tasks) {
      insertTask.run(planId, task.task_type, task.title, task.description, task.priority);
    }
  });

  insertAll(planId, tasks);

  return { plan_id: planId, tasks };
}

/**
 * 최근 시험 결과 기반 약점 분석
 * @param {import('better-sqlite3').Database} db - 데이터베이스 인스턴스
 * @returns {Object} {skills: {grammar, vocabulary, fluency, pronunciation, content_organization}, weakest_skill, weak_question_types: []}
 */
function getWeaknessAnalysis(db) {
  // 최근 5회 시험 피드백 조회
  const recentFeedbacks = db.prepare(`
    SELECT af.grammar_score, af.fluency_score, af.vocabulary_score,
           af.pronunciation_score, af.content_organization_score
    FROM ai_feedbacks af
    JOIN exam_sessions es ON af.session_id = es.id
    WHERE es.completed_at IS NOT NULL
    ORDER BY es.completed_at DESC
    LIMIT 5
  `).all();

  // 5축 평균 계산
  const skills = {
    grammar: 0,
    vocabulary: 0,
    fluency: 0,
    pronunciation: 0,
    content_organization: 0
  };

  if (recentFeedbacks.length > 0) {
    let counts = { grammar: 0, vocabulary: 0, fluency: 0, pronunciation: 0, content_organization: 0 };

    for (const fb of recentFeedbacks) {
      if (fb.grammar_score != null) { skills.grammar += fb.grammar_score; counts.grammar++; }
      if (fb.vocabulary_score != null) { skills.vocabulary += fb.vocabulary_score; counts.vocabulary++; }
      if (fb.fluency_score != null) { skills.fluency += fb.fluency_score; counts.fluency++; }
      if (fb.pronunciation_score != null) { skills.pronunciation += fb.pronunciation_score; counts.pronunciation++; }
      if (fb.content_organization_score != null) { skills.content_organization += fb.content_organization_score; counts.content_organization++; }
    }

    for (const key of Object.keys(skills)) {
      skills[key] = counts[key] > 0 ? Math.round(skills[key] / counts[key]) : 0;
    }
  }

  // 가장 약한 스킬 식별 (점수가 0인 것은 데이터 없음으로 제외)
  let weakestSkill = null;
  let weakestScore = Infinity;
  for (const [key, score] of Object.entries(skills)) {
    if (score > 0 && score < weakestScore) {
      weakestScore = score;
      weakestSkill = key;
    }
  }

  // 약점 질문 유형 파악
  const weakQuestionTypes = db.prepare(`
    SELECT q.type,
           ROUND(AVG(ea.word_count), 1) as avg_words,
           COUNT(*) as attempt_count
    FROM exam_answers ea
    JOIN questions q ON ea.question_id = q.id
    JOIN exam_sessions es ON ea.session_id = es.id
    WHERE es.completed_at IS NOT NULL
    GROUP BY q.type
    HAVING avg_words < 60
    ORDER BY avg_words ASC
  `).all();

  return {
    skills,
    weakest_skill: weakestSkill,
    weak_question_types: weakQuestionTypes.map(qt => qt.type)
  };
}

module.exports = { generateDailyPlan, getWeaknessAnalysis };
