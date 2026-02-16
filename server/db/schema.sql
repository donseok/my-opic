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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_exam_answers_session ON exam_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedbacks_session ON ai_feedbacks(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_started ON exam_sessions(started_at);
