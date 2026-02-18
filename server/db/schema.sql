-- OPIc Master 데이터베이스 스키마
-- 8개 테이블 + 인덱스

-- 서베이 주제 테이블
CREATE TABLE IF NOT EXISTS survey_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,           -- 주제명 (한국어)
    name_en TEXT NOT NULL,        -- 주제명 (영어)
    icon TEXT,                    -- 이모지 아이콘
    is_selected INTEGER DEFAULT 0 -- 선택 여부 (0/1)
);

-- OPIc 레벨 테이블
CREATE TABLE IF NOT EXISTS levels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,    -- 레벨 코드 (NL~AL)
    name TEXT NOT NULL,           -- 레벨 전체명
    description TEXT,             -- 레벨 설명
    min_words INTEGER NOT NULL,   -- 최소 권장 단어 수
    order_index INTEGER NOT NULL  -- 정렬 순서 (0~8)
);

-- 사용자 설정 테이블
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    current_level TEXT,           -- 현재 레벨 코드
    target_level TEXT,            -- 목표 레벨 코드
    updated_at TEXT               -- 마지막 수정 시각 (ISO 8601)
);

-- 질문 테이블
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,    -- 소속 주제 ID
    question_text TEXT NOT NULL,  -- 질문 원문 (영어)
    type TEXT NOT NULL,           -- 유형: survey/combo/roleplay/unexpected
    difficulty TEXT DEFAULT 'medium', -- 난이도: easy/medium/hard
    FOREIGN KEY (topic_id) REFERENCES survey_topics(id)
);

-- 답변 가이드 테이블
CREATE TABLE IF NOT EXISTS answer_guides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL, -- 대상 질문 ID
    level_code TEXT NOT NULL,     -- 대상 레벨 코드
    structure TEXT,               -- 추천 답변 구조 (도입-본론-마무리)
    key_phrases TEXT,             -- 핵심 표현 (JSON 배열)
    target_words INTEGER,         -- 목표 단어 수
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- 시험 세션 테이블
CREATE TABLE IF NOT EXISTS exam_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,     -- 시험 시작 시각
    completed_at TEXT,            -- 시험 완료 시각
    target_level TEXT NOT NULL,   -- 시험 당시 목표 레벨
    total_words INTEGER DEFAULT 0 -- 총 작성 단어 수
);

-- 시험 답변 테이블
CREATE TABLE IF NOT EXISTS exam_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,  -- 소속 세션 ID
    question_id INTEGER NOT NULL, -- 대상 질문 ID
    answer_text TEXT,             -- 사용자 답변 텍스트
    word_count INTEGER DEFAULT 0, -- 단어 수
    time_spent INTEGER DEFAULT 0, -- 소요 시간 (초)
    order_index INTEGER NOT NULL, -- 문제 순서 (1~5)
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- AI 피드백 테이블
CREATE TABLE IF NOT EXISTS ai_feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL UNIQUE, -- 소속 세션 ID (1:1)
    predicted_level TEXT,         -- AI 예상 등급
    grammar_score INTEGER,        -- 문법 점수 (0~100)
    fluency_score INTEGER,        -- 유창성 점수 (0~100)
    vocabulary_score INTEGER,     -- 어휘 점수 (0~100)
    strengths TEXT,               -- 잘한 점 (JSON 배열)
    improvements TEXT,            -- 개선할 점 (JSON 배열)
    raw_response TEXT,            -- Gemini API 원본 응답
    created_at TEXT NOT NULL,     -- 피드백 생성 시각
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id)
);

-- 음성 녹음 테이블
CREATE TABLE IF NOT EXISTS voice_recordings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_answer_id INTEGER,          -- 연결된 시험 답변 (nullable)
    script_id INTEGER,               -- 연결된 스크립트 (nullable)
    audio_blob TEXT NOT NULL,         -- Base64 인코딩된 오디오 데이터
    duration INTEGER DEFAULT 0,       -- 녹음 시간 (초)
    transcript TEXT,                  -- 음성→텍스트 변환 결과
    created_at TEXT NOT NULL,
    FOREIGN KEY (exam_answer_id) REFERENCES exam_answers(id),
    FOREIGN KEY (script_id) REFERENCES scripts(id)
);

-- 음성 분석 결과 테이블
CREATE TABLE IF NOT EXISTS voice_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recording_id INTEGER NOT NULL,
    pronunciation_score INTEGER,      -- 발음 점수 (0~100)
    fluency_score INTEGER,            -- 유창성 점수 (0~100)
    intonation_score INTEGER,         -- 억양 점수 (0~100)
    pace_wpm INTEGER,                 -- 말하기 속도 (분당 단어)
    filler_words TEXT,                -- 필러 워드 목록 (JSON 배열)
    pause_count INTEGER DEFAULT 0,    -- 비정상적 멈춤 횟수
    clarity_score INTEGER,            -- 명확성 점수 (0~100)
    feedback TEXT,                    -- AI 상세 피드백 (JSON)
    created_at TEXT NOT NULL,
    FOREIGN KEY (recording_id) REFERENCES voice_recordings(id)
);

-- 스크립트 테이블
CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER,              -- 연결된 질문 (nullable)
    topic_id INTEGER,                 -- 소속 주제
    title TEXT NOT NULL,              -- 스크립트 제목
    question_text TEXT,               -- 대상 질문 텍스트
    draft_text TEXT,                  -- 초안
    refined_text TEXT,                -- AI 개선본
    final_text TEXT,                  -- 최종본
    status TEXT DEFAULT 'draft',      -- draft/refined/memorizing/mastered
    word_count INTEGER DEFAULT 0,
    target_level TEXT,                -- 목표 레벨
    memorization_progress INTEGER DEFAULT 0, -- 암기 진행률 (0~100)
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (topic_id) REFERENCES survey_topics(id)
);

-- 스크립트 연습 기록 테이블
CREATE TABLE IF NOT EXISTS script_practices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    script_id INTEGER NOT NULL,
    practice_type TEXT NOT NULL,       -- flashcard/speaking/typing
    accuracy INTEGER DEFAULT 0,        -- 정확도 (0~100)
    duration INTEGER DEFAULT 0,        -- 소요 시간 (초)
    created_at TEXT NOT NULL,
    FOREIGN KEY (script_id) REFERENCES scripts(id)
);

-- 학습 계획 테이블
CREATE TABLE IF NOT EXISTS study_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_date TEXT NOT NULL UNIQUE,    -- 날짜 (YYYY-MM-DD)
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    completion_rate INTEGER DEFAULT 0, -- 완료율 (0~100)
    created_at TEXT NOT NULL
);

-- 학습 태스크 테이블
CREATE TABLE IF NOT EXISTS study_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    task_type TEXT NOT NULL,           -- srs_review/skill_practice/script_review/exam/voice_practice
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 0,        -- 우선순위 (높을수록 먼저)
    is_completed INTEGER DEFAULT 0,
    completed_at TEXT,
    related_id INTEGER,                -- 관련 리소스 ID (질문/스크립트 등)
    FOREIGN KEY (plan_id) REFERENCES study_plans(id)
);

-- SRS 간격반복 항목 테이블
CREATE TABLE IF NOT EXISTS srs_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_type TEXT NOT NULL,           -- phrase/vocabulary/script
    front_text TEXT NOT NULL,          -- 카드 앞면 (질문/단어)
    back_text TEXT NOT NULL,           -- 카드 뒷면 (답/뜻)
    source_id INTEGER,                 -- 출처 ID (answer_guide/script)
    ease_factor REAL DEFAULT 2.5,      -- SM-2 난이도 계수
    interval INTEGER DEFAULT 0,        -- 현재 간격 (일)
    repetitions INTEGER DEFAULT 0,     -- 반복 횟수
    next_review_date TEXT,             -- 다음 복습 날짜
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- SRS 리뷰 기록 테이블
CREATE TABLE IF NOT EXISTS srs_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    quality INTEGER NOT NULL,          -- 응답 품질 (0~5)
    reviewed_at TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES srs_items(id)
);

-- 학습 시간 추적 테이블
CREATE TABLE IF NOT EXISTS study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_type TEXT NOT NULL,        -- exam/script/srs/voice/question_review
    duration INTEGER DEFAULT 0,         -- 소요 시간 (초)
    started_at TEXT NOT NULL,
    ended_at TEXT
);

-- 스킬 평가 테이블 (5축 레이더)
CREATE TABLE IF NOT EXISTS skill_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,                -- 연결된 시험 세션
    grammar_score INTEGER DEFAULT 0,
    vocabulary_score INTEGER DEFAULT 0,
    fluency_score INTEGER DEFAULT 0,
    pronunciation_score INTEGER DEFAULT 0,
    content_organization_score INTEGER DEFAULT 0,
    assessed_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES exam_sessions(id)
);

-- 기존 인덱스
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_exam_answers_session ON exam_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedbacks_session ON ai_feedbacks(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_started ON exam_sessions(started_at);

-- 신규 인덱스
CREATE INDEX IF NOT EXISTS idx_voice_recordings_answer ON voice_recordings(exam_answer_id);
CREATE INDEX IF NOT EXISTS idx_voice_recordings_script ON voice_recordings(script_id);
CREATE INDEX IF NOT EXISTS idx_voice_analyses_recording ON voice_analyses(recording_id);
CREATE INDEX IF NOT EXISTS idx_scripts_topic ON scripts(topic_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON scripts(status);
CREATE INDEX IF NOT EXISTS idx_script_practices_script ON script_practices(script_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_date ON study_plans(plan_date);
CREATE INDEX IF NOT EXISTS idx_study_tasks_plan ON study_tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_srs_items_next_review ON srs_items(next_review_date);
CREATE INDEX IF NOT EXISTS idx_srs_reviews_item ON srs_reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_started ON study_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_study_sessions_type ON study_sessions(activity_type);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_session ON skill_assessments(session_id);

-- 출석 체크 테이블
CREATE TABLE IF NOT EXISTS daily_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    check_date TEXT NOT NULL UNIQUE,   -- 출석 날짜 (YYYY-MM-DD)
    points_earned INTEGER DEFAULT 10,  -- 획득 포인트
    streak_bonus INTEGER DEFAULT 0,    -- 연속 출석 보너스
    checked_at TEXT NOT NULL           -- 체크 시각
);

-- 학습 포인트 이력 테이블
CREATE TABLE IF NOT EXISTS point_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    points INTEGER NOT NULL,           -- 포인트 (+/-)
    reason TEXT NOT NULL,              -- attendance/exam/script/srs/streak_bonus
    description TEXT,                  -- 상세 설명
    created_at TEXT NOT NULL
);

-- 문장별 발음 연습 테이블
CREATE TABLE IF NOT EXISTS sentence_practices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    script_id INTEGER NOT NULL,
    sentence_index INTEGER NOT NULL,     -- 문장 순서 (0-based)
    sentence_text TEXT NOT NULL,          -- 원본 문장
    audio_blob TEXT,                      -- Base64 녹음 데이터
    pronunciation_grade TEXT,             -- 등급: AL/IH/IM/IL/NM
    pronunciation_score INTEGER,         -- 점수 (0~100)
    accuracy_detail TEXT,                -- AI 상세 피드백 (JSON)
    attempt_count INTEGER DEFAULT 1,     -- 시도 횟수
    best_grade TEXT,                      -- 최고 등급
    best_score INTEGER DEFAULT 0,        -- 최고 점수
    created_at TEXT NOT NULL,
    FOREIGN KEY (script_id) REFERENCES scripts(id)
);

-- 서베이 추천 팁 테이블
CREATE TABLE IF NOT EXISTS survey_tips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER,                    -- NULL이면 전체 공통 팁
    target_level TEXT,                   -- 대상 레벨 (NULL이면 전체)
    tip_type TEXT NOT NULL,              -- strategy/selection/warning
    title TEXT NOT NULL,
    content TEXT NOT NULL,               -- 팁 본문
    priority INTEGER DEFAULT 0,         -- 우선순위
    FOREIGN KEY (topic_id) REFERENCES survey_topics(id)
);

-- 신규 인덱스 (Feature 1~3)
CREATE INDEX IF NOT EXISTS idx_daily_attendance_date ON daily_attendance(check_date);
CREATE INDEX IF NOT EXISTS idx_point_history_created ON point_history(created_at);
CREATE INDEX IF NOT EXISTS idx_sentence_practices_script ON sentence_practices(script_id);
CREATE INDEX IF NOT EXISTS idx_sentence_practices_index ON sentence_practices(script_id, sentence_index);
CREATE INDEX IF NOT EXISTS idx_survey_tips_topic ON survey_tips(topic_id);
CREATE INDEX IF NOT EXISTS idx_survey_tips_level ON survey_tips(target_level);
