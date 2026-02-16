# OPIc Master - 전체 개발 프롬프트

## 프로젝트 개요
OPIc(영어 말하기 시험) 대비 개인 학습 웹 앱을 처음부터 완성까지 구현한다.
기술 문서는 `docs/` 디렉토리를 참조하라:
- `docs/PRD-20260216-083400.md` — 제품 요구사항 정의서 (FR-001~032, NFR-001~006)
- `docs/TRD-20260216-084000.md` — 기술 요구사항 정의서 (아키텍처, DB 스키마, API 명세)
- `docs/WBS-20260216-084500.md` — 작업 분해 구조

## 기술 스택 (고정, 변경 금지)
- Frontend: HTML5 / CSS3 / JavaScript (ES6+) — Vanilla JS SPA, 프레임워크 사용 금지
- Backend: Node.js 20 LTS + Express.js 4.x
- Database: SQLite 3.x (better-sqlite3 11.x)
- AI: Google Gemini API (gemini-2.5-flash-lite) — node-fetch로 호출
- 환경변수: dotenv 16.x
- 차트: Chart.js 4.x (CDN)
- 아이콘: Lucide Icons (CDN)

## 프로젝트 구조 (TRD 섹션 9 기준)
```
my-opic/
├── public/                    # 정적 파일 (Express가 서빙)
│   ├── index.html             # SPA 진입점
│   ├── css/
│   │   ├── global.css         # 공통 스타일 (다크 모드 테마)
│   │   ├── survey.css         # 서베이 설정 화면
│   │   ├── level.css          # 레벨 설정 화면
│   │   ├── questions.css      # 문제은행 화면
│   │   ├── exam.css           # 모의시험 화면
│   │   ├── feedback.css       # AI 피드백 화면
│   │   └── dashboard.css      # 대시보드 화면
│   ├── js/
│   │   ├── app.js             # SPA 라우터 + 초기화
│   │   ├── api.js             # API 호출 유틸리티
│   │   ├── survey.js          # 서베이 설정 모듈
│   │   ├── level.js           # 레벨 설정 모듈
│   │   ├── questions.js       # 문제은행 모듈
│   │   ├── exam.js            # 모의시험 모듈 (타이머 포함)
│   │   ├── feedback.js        # AI 피드백 모듈
│   │   ├── dashboard.js       # 대시보드 모듈 (Chart.js)
│   │   └── utils/
│   │       ├── timer.js       # 타이머 유틸리티 (SVG 원형)
│   │       └── wordcount.js   # 단어 수 카운트 유틸리티
│   └── assets/
│       └── icons/             # 아이콘 파일
├── server/
│   ├── index.js               # Express 서버 진입점
│   ├── routes/
│   │   ├── topics.js          # 주제 API
│   │   ├── levels.js          # 레벨 API
│   │   ├── settings.js        # 설정 API
│   │   ├── questions.js       # 질문 API
│   │   ├── exam.js            # 시험 API
│   │   ├── feedback.js        # 피드백 API (Gemini 프록시)
│   │   └── dashboard.js       # 대시보드 API
│   ├── services/
│   │   └── gemini.js          # Gemini API 서비스
│   ├── db/
│   │   ├── database.js        # SQLite 연결 싱글턴
│   │   ├── schema.sql         # 테이블 생성 DDL
│   │   └── seed.sql           # 초기 데이터
│   └── middleware/
│       └── errorHandler.js    # 공통 에러 처리
├── .env                       # 환경변수 (GEMINI_API_KEY)
├── .env.example               # 환경변수 템플릿
├── .gitignore
├── package.json
└── PROMPT.md
```

## 디자인 시스템
| 용도 | 색상 코드 |
|------|----------|
| 배경 | #0F172A |
| 카드/패널 배경 | #1E293B |
| 카드 테두리 | #334155 |
| 액센트 (틸) | #2DD4BF |
| 기본 텍스트 | #F1F5F9 |
| 보조 텍스트 | #94A3B8 |
| 경고/에러 | #EF4444 |
| 성공 | #22C55E |
| 노란색 강조 | #FBBF24 |

- 다크 모드 기본 (라이트 모드 없음)
- 폰트: system-ui, -apple-system, sans-serif
- border-radius: 카드 12px, 버튼 8px, 뱃지 16px
- 카드 hover/active 시 미세한 밝기 변화

## DB 스키마 (TRD 섹션 4 기준, 8개 테이블)

### survey_topics
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 주제 ID |
| name | TEXT | NOT NULL | 주제명 한국어 |
| name_en | TEXT | NOT NULL | 주제명 영어 |
| icon | TEXT | | 이모지 아이콘 |
| is_selected | INTEGER | DEFAULT 0 | 선택 여부 (0/1) |

### levels
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 레벨 ID |
| code | TEXT | NOT NULL UNIQUE | NL/NM/NH/IL/IM1/IM2/IM3/IH/AL |
| name | TEXT | NOT NULL | 레벨 전체명 |
| description | TEXT | | 레벨 설명 |
| min_words | INTEGER | NOT NULL | 최소 권장 단어 수 |
| order_index | INTEGER | NOT NULL | 정렬 순서 (0~8) |

### user_settings
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 설정 ID |
| current_level | TEXT | | 현재 레벨 코드 |
| target_level | TEXT | | 목표 레벨 코드 |
| updated_at | TEXT | | ISO 8601 시각 |

### questions
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 질문 ID |
| topic_id | INTEGER | FK→survey_topics.id | 소속 주제 |
| question_text | TEXT | NOT NULL | 질문 원문 (영어) |
| type | TEXT | NOT NULL | survey/combo/roleplay/unexpected |
| difficulty | TEXT | DEFAULT 'medium' | easy/medium/hard |

### answer_guides
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 가이드 ID |
| question_id | INTEGER | FK→questions.id | 대상 질문 |
| level_code | TEXT | NOT NULL | 대상 레벨 |
| structure | TEXT | | 추천 답변 구조 (도입-본론-마무리) |
| key_phrases | TEXT | | 핵심 표현 (JSON 배열) |
| target_words | INTEGER | | 목표 단어 수 |

### exam_sessions
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 세션 ID |
| started_at | TEXT | NOT NULL | 시험 시작 시각 |
| completed_at | TEXT | | 시험 완료 시각 |
| target_level | TEXT | NOT NULL | 시험 당시 목표 레벨 |
| total_words | INTEGER | DEFAULT 0 | 총 단어 수 |

### exam_answers
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 답변 ID |
| session_id | INTEGER | FK→exam_sessions.id | 소속 세션 |
| question_id | INTEGER | FK→questions.id | 대상 질문 |
| answer_text | TEXT | | 답변 텍스트 |
| word_count | INTEGER | DEFAULT 0 | 단어 수 |
| time_spent | INTEGER | DEFAULT 0 | 소요 시간 (초) |
| order_index | INTEGER | NOT NULL | 문제 순서 (1~5) |

### ai_feedbacks
| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | INTEGER | PK AUTOINCREMENT | 피드백 ID |
| session_id | INTEGER | FK→exam_sessions.id, UNIQUE | 소속 세션 |
| predicted_level | TEXT | | AI 예상 등급 |
| grammar_score | INTEGER | | 문법 점수 (0~100) |
| fluency_score | INTEGER | | 유창성 점수 (0~100) |
| vocabulary_score | INTEGER | | 어휘 점수 (0~100) |
| strengths | TEXT | | 잘한 점 (JSON 배열) |
| improvements | TEXT | | 개선할 점 (JSON 배열) |
| raw_response | TEXT | | Gemini 원본 응답 |
| created_at | TEXT | NOT NULL | 생성 시각 |

### 인덱스
- idx_questions_topic: questions.topic_id
- idx_questions_type: questions.type
- idx_exam_answers_session: exam_answers.session_id
- idx_ai_feedbacks_session: ai_feedbacks.session_id
- idx_exam_sessions_started: exam_sessions.started_at

## API 엔드포인트 (TRD 섹션 5 기준, Base: /api/v1)

| Method | Path | 설명 |
|--------|------|------|
| GET | /topics | 전체 주제 목록 |
| PUT | /topics/selection | 주제 선택 저장 (body: { selected_ids: [1,3,5] }) |
| GET | /levels | 전체 레벨 목록 |
| GET | /settings | 사용자 설정 조회 |
| PUT | /settings | 사용자 설정 저장 (body: { current_level, target_level }) |
| GET | /questions | 주제별 질문 목록 (query: topic_id, type) |
| GET | /questions/:id/guide | 질문별 답변 가이드 (query: level_code) |
| POST | /exam/start | 모의시험 시작 — 5문제 랜덤 구성 (body: { topic_ids }) |
| POST | /exam/sessions | 시험 결과 저장 |
| GET | /exam/sessions | 시험 이력 목록 |
| GET | /exam/sessions/:id | 시험 상세 조회 |
| POST | /feedback/evaluate | AI 피드백 요청 — Gemini 프록시 |
| GET | /feedback/:sessionId | 피드백 결과 조회 |
| GET | /dashboard/stats | 대시보드 통계 |
| GET | /dashboard/trends | 점수 추이 데이터 |

## Gemini API 시스템 프롬프트 (FR-023)

```
당신은 OPIc(Oral Proficiency Interview - computer) 시험 전문 채점관입니다.
ACTFL 기준에 따라 영어 답변을 평가합니다.

아래 정보가 제공됩니다:
- 질문 텍스트 (영어)
- 사용자 답변 텍스트 (영어)
- 사용자 목표 레벨

다음 형식의 JSON으로 평가 결과를 출력하세요:
{
  "predicted_level": "IM1",
  "grammar_score": 72,
  "fluency_score": 65,
  "vocabulary_score": 68,
  "strengths": ["잘한 점 1", "잘한 점 2", "잘한 점 3"],
  "improvements": ["개선할 점 1 (목표 레벨 기준)", "개선할 점 2", "개선할 점 3"]
}

평가 기준:
- predicted_level: NL/NM/NH/IL/IM1/IM2/IM3/IH/AL 중 하나
- grammar_score: 문법 정확도 (0~100)
- fluency_score: 유창성, 자연스러움 (0~100)
- vocabulary_score: 어휘 다양성과 적절성 (0~100)
- strengths: 잘한 점 3가지 (한국어)
- improvements: 목표 레벨 도달을 위한 개선점 3가지 (한국어)

JSON만 출력하고 다른 텍스트는 포함하지 마세요.
```

---

# 마일스톤별 구현 작업

## ═══════════════════════════════════════
## M1: 프로젝트 초기화 + 기본 설정 기능
## ═══════════════════════════════════════

### M1 작업 목록

**M1-1. 프로젝트 스캐폴딩**
- package.json 생성 (name: "opic-master", scripts: { start: "node server/index.js" })
- 의존성: express, better-sqlite3, dotenv, node-fetch
- 위 프로젝트 구조대로 모든 디렉토리 생성
- .gitignore: node_modules/, .env, opic_master.db
- .env.example: GEMINI_API_KEY=your_api_key_here, PORT=3000

**M1-2. DB 스키마 + 초기 데이터**
- server/db/schema.sql — 위 8개 테이블 DDL + 인덱스 전부 작성
- server/db/seed.sql — 아래 초기 데이터 투입:
  - 10개 서베이 주제: 자기소개, 집/이웃, 여가활동, 여행, 운동/스포츠, 음악/영화, 요리/음식, 기술/인터넷, 교육, 직장/업무 (각각 영문명, 이모지 포함)
  - 9개 레벨: NL(20단어), NM(30), NH(40), IL(50), IM1(60), IM2(70), IM3(80), IH(110), AL(130)
  - 주제당 최소 5개 영어 질문 (총 50개+) — type은 survey/combo/roleplay/unexpected 혼합
  - user_settings 기본 행 1개 (current_level=NULL, target_level=NULL)
- server/db/database.js — better-sqlite3 싱글턴, 앱 시작 시 schema.sql 실행 후 seed.sql 실행 (이미 데이터 있으면 skip)

**M1-3. Express 서버**
- server/index.js — Express 앱, 포트 3000, public/ 정적 서빙, /api/v1 라우터 마운트, 에러 핸들러
- server/middleware/errorHandler.js — 공통 에러 미들웨어

**M1-4. M1 범위 API**
- server/routes/topics.js — GET /topics, PUT /topics/selection
- server/routes/levels.js — GET /levels
- server/routes/settings.js — GET /settings, PUT /settings

**M1-5. SPA 기본 구조**
- public/index.html — 다크 모드 SPA 진입점, CDN (Chart.js, Lucide), 탭바 구조
- public/css/global.css — 위 디자인 시스템 색상, 공통 컴포넌트 스타일
- public/js/app.js — SPA 라우터 (hash 기반 #survey, #level, #questions, #exam, #feedback, #dashboard), 탭바 전환
- public/js/api.js — fetch 래퍼 (GET, POST, PUT)

**M1-6. 서베이 설정 화면 (FR-001~004)**
- public/js/survey.js + public/css/survey.css
- 10개 주제 카드 그리드 표시 (주제명 한국어 + 이모지 아이콘)
- 카드 클릭 시 선택/해제 토글 (선택 시 틸 컬러 하이라이트)
- 선택 개수 실시간 표시 ("3/5개 선택")
- 5개 초과 선택 차단 + 안내 메시지
- 3개 미만 시 저장 버튼 비활성화
- 저장 클릭 → PUT /topics/selection → 성공 피드백
- 화면 진입 시 GET /topics → 이전 선택 자동 반영

**M1-7. 레벨 설정 화면 (FR-009~013)**
- public/js/level.js + public/css/level.css
- 9단계 레벨 시각적 나열 (NL~AL, 각 레벨명 + 최소 단어 수 표시)
- "현재 레벨" 섹션: 하나만 선택 가능, 선택 시 강조
- "목표 레벨" 섹션: 현재 레벨 이상만 선택 가능, 미만은 비활성화
- 갭 분석: 현재→목표 단계 수, 프로그레스 바, 예상 학습 기간, 필요 역량 텍스트
- 저장 → PUT /settings → 확인 피드백
- 화면 진입 시 GET /settings → 이전 설정 자동 반영

**M1-8. 네비게이션 (FR-031~032)**
- 상단 헤더: "OPIc Master" 타이틀 + 아이콘
- 하단 탭바: 6개 탭 (서베이설정/문제은행/모의시험/AI피드백/대시보드/레벨설정)
- 각 탭: Lucide 아이콘 + 텍스트 라벨
- 활성 탭 → 틸 컬러(#2DD4BF) 강조, 비활성 → #94A3B8

### M1 완료 조건
- [ ] `npm install && npm start` → 서버 정상 실행
- [ ] http://localhost:3000 → 다크 모드 SPA 표시
- [ ] 하단 탭바 6개 탭 전환 동작
- [ ] 서베이: 10개 주제 카드 표시, 3~5개 선택/저장/로드 동작
- [ ] 레벨: 9단계 선택, 유효성 검사, 갭 분석 표시, 저장/로드 동작
- [ ] DB: 주제 10개, 레벨 9개, 질문 50개+ 초기 데이터 확인

## ═══════════════════════════════════════
## M2: 문제은행 + 모의시험
## ═══════════════════════════════════════

### M2 전제조건
M1 완료 조건이 모두 충족된 상태에서 시작한다.

### M2 작업 목록

**M2-1. 문제은행 API**
- server/routes/questions.js — GET /questions (query: topic_id, type 필터), GET /questions/:id/guide

**M2-2. 시험 API**
- server/routes/exam.js:
  - POST /exam/start — 선택된 주제에서 서베이 4문제 + 롤플레이 1문제 랜덤 구성, 각 문제에 time_limit(서베이=90초, 롤플레이=120초) 포함
  - POST /exam/sessions — 시험 결과 저장 (exam_sessions + exam_answers INSERT)
  - GET /exam/sessions — 시험 이력 목록 (최근 10개, 내림차순)
  - GET /exam/sessions/:id — 시험 상세 (답변 포함)

**M2-3. 문제은행 화면 (FR-005~008)**
- public/js/questions.js + public/css/questions.css
- 선택한 주제별 탭으로 질문 목록 구분
- 각 질문에 유형 태그 (서베이/콤보/롤플레이/돌발) — 색상 또는 아이콘 구분
- 유형별 필터링 기능
- 질문 클릭 → 답변 가이드 표시 (도입-본론-마무리 구조, 핵심 표현, 목표 단어 수)
- 목표 레벨에 따라 가이드 내용 분기

**M2-4. 모의시험 화면 (FR-014~021)**
- public/js/exam.js + public/css/exam.css + public/js/utils/timer.js + public/js/utils/wordcount.js
- 시험 시작 대기 화면:
  - 서베이 주제/레벨 미설정 시 시작 버튼 비활성화 + 안내 메시지
  - 양쪽 설정 완료 시 "시험 시작" 버튼 활성화
- 시험 진행 화면:
  - 문제 번호 표시 (1/5, 2/5 ...)
  - 준비 시간: SVG 원형 타이머 8초 카운트다운 → 자동 전환
  - 답변 시간: 서베이 90초 / 롤플레이 120초 프로그레스 바 + 남은 시간 숫자
  - 남은 시간 30초 미만 → 빨간색(#EF4444) 경고
  - 텍스트 입력 영역 (충분한 크기)
  - 실시간 단어 수 카운트 표시
  - 목표 대비 달성률 프로그레스 바 ("45/70 단어 — 64% 달성")
  - "다음" 버튼 또는 타이머 종료 시 → 현재 답변 자동 저장 → 다음 문제
- 시험 완료 화면:
  - 5문제 답변 요약 (문제별 답변 텍스트, 단어 수, 소요 시간)
  - POST /exam/sessions로 결과 저장
  - "AI 피드백 받기" 버튼 (M3에서 구현, 여기서는 버튼만 배치)

### M2 완료 조건
- [ ] 문제은행: 주제별 탭 전환, 질문 목록 표시, 유형 태그 표시, 답변 가이드 표시 동작
- [ ] 모의시험 시작: 주제/레벨 미설정 시 비활성화, 설정 완료 시 활성화
- [ ] 시험 진행: 5문제 순차 진행, 준비 8초 타이머, 답변 90/120초 타이머, 30초 경고
- [ ] 답변 입력: 텍스트 입력, 실시간 단어 수, 달성률 표시
- [ ] 시험 완료: 결과 요약 화면, DB 저장 확인
- [ ] "다음" 버튼과 타이머 종료 모두 정상 동작

## ═══════════════════════════════════════
## M3: AI 피드백 연동
## ═══════════════════════════════════════

### M3 전제조건
M1 + M2 완료 조건이 모두 충족된 상태에서 시작한다.

### M3 작업 목록

**M3-1. Gemini API 서비스**
- server/services/gemini.js:
  - 위 "Gemini API 시스템 프롬프트" 사용
  - 요청 구성: 질문 텍스트 + 답변 텍스트 + 목표 레벨 → Gemini API 호출
  - 응답 파싱: JSON 추출 및 검증 (predicted_level, 3개 점수, strengths, improvements)
  - 파싱 실패 시 재시도 1회 (temperature 낮춤)
  - 에러 처리: 429(한도초과), 400(잘못된 요청), 500(서버오류), 네트워크 오류 분기

**M3-2. 피드백 API**
- server/routes/feedback.js:
  - POST /feedback/evaluate — Gemini 프록시, 결과를 ai_feedbacks에 저장 후 반환
  - GET /feedback/:sessionId — 저장된 피드백 조회
  - 15초 타임아웃 (AbortController)

**M3-3. AI 피드백 화면 (FR-022~026)**
- public/js/feedback.js + public/css/feedback.css
- "AI 피드백 받기" 버튼 클릭 → POST /feedback/evaluate → 로딩 인디케이터
- 피드백 결과 시각화:
  - 예상 등급 큰 글씨 뱃지
  - 문법/유창성/어휘 점수 → 원형 게이지 또는 바 차트 (각 0~100)
  - 잘한 점 3개 카드 (초록색 강조)
  - 개선할 점 3개 카드 (노란색 강조)
  - 현재 레벨 → 예상 등급 → 목표 레벨 진행 경로 시각화
- 에러 처리 UI:
  - 429: "요청 한도 초과, 잠시 후 다시 시도해주세요"
  - 400: "잘못된 요청입니다"
  - 500: "서버 오류가 발생했습니다"
  - 네트워크: "인터넷 연결을 확인해주세요"
  - 모든 에러에 "재시도" 버튼

**M3-4. 피드백 저장 (FR-025)**
- AI 피드백 수신 시 ai_feedbacks 테이블 자동 저장
- 예상 등급, 3개 점수, strengths, improvements, raw_response 모두 저장

### M3 완료 조건
- [ ] .env에 GEMINI_API_KEY 설정 가이드가 .env.example에 있다
- [ ] "AI 피드백 받기" 클릭 → 로딩 → 결과 표시 흐름 동작 (API Key 있을 때)
- [ ] 예상 등급 뱃지, 3개 점수 시각화, 잘한 점/개선할 점 카드 표시
- [ ] 현재→예상→목표 레벨 진행 경로 시각화
- [ ] API Key 없거나 에러 시 사용자 친화적 에러 메시지 + 재시도 버튼
- [ ] 피드백 결과가 DB에 저장되고, 재조회 시 동일 결과 표시

## ═══════════════════════════════════════
## M4: 대시보드 + 최종 마무리
## ═══════════════════════════════════════

### M4 전제조건
M1 + M2 + M3 완료 조건이 모두 충족된 상태에서 시작한다.

### M4 작업 목록

**M4-1. 대시보드 API**
- server/routes/dashboard.js:
  - GET /dashboard/stats — 총 시험 횟수, 문법/유창성/어휘 평균 점수, 최근 예상 등급
  - GET /dashboard/trends — 시험별 3개 점수 시계열 데이터 (Chart.js용)

**M4-2. 대시보드 화면 (FR-027~030)**
- public/js/dashboard.js + public/css/dashboard.css
- 학습 통계 요약 카드: 총 시험 횟수, 평균 점수 3개, 최근 예상 등급
- Chart.js 라인 차트: 시험별 문법/유창성/어휘 점수 추이, 3개 라인 색상 구분, 호버 시 점수 표시
- 레벨 진행률 바: 전체 9단계에서 현재 위치, 목표 위치, 최근 AI 예상 등급 위치
- 최근 시험 이력: 5~10회 목록 (날짜, 예상 등급, 주요 점수), 클릭 → 상세 피드백 이동
- 데이터 없을 때 빈 상태 안내 메시지

**M4-3. 전체 통합 검증**
- 전체 흐름 검증: 서베이 설정 → 레벨 설정 → 모의시험 → AI 피드백 → 대시보드 확인
- 화면 간 데이터 연동 확인
- 탭바 네비게이션 전 화면 정상 동작
- DB 데이터 저장/복원 무결성

**M4-4. 코드 품질 마무리**
- 모든 JS 파일에 한국어 주석 포함 확인
- console.error로 디버그 로그 정리
- 불필요한 console.log 제거
- HTML/CSS/JS 코드 정리

### M4 완료 조건
- [ ] 대시보드: 통계 요약, 점수 추이 차트, 레벨 진행률, 시험 이력 목록 표시
- [ ] 차트: Chart.js 라인 차트에 3개 점수 라인, 호버 시 점수 표시
- [ ] 전체 흐름: 서베이→레벨→시험→피드백→대시보드 끝까지 정상 동작
- [ ] 모든 탭 화면이 정상 렌더링되고 데이터 연동됨
- [ ] 코드에 한국어 주석 포함, 불필요 로그 제거

---

# 작업 규칙 (매 반복마다 준수)

## 반복 시작 시
1. `git status`로 현재 상태 확인
2. 기존 파일이 있으면 읽고 이해한 뒤 작업
3. 현재 어느 마일스톤 단계인지 판단 (M1→M2→M3→M4 순서)
4. 해당 마일스톤의 미완료 작업 식별

## 작업 중
- 코드에 한국어 주석 포함
- TRD 명세를 준수 (API 경로, DB 스키마, 프로젝트 구조)
- better-sqlite3 prepared statement 사용 (SQL 인젝션 방지)
- innerHTML 사용 금지 → textContent 사용 (XSS 방지)
- API Key는 절대 클라이언트 코드에 포함하지 않음

## 반복 종료 시
1. 변경사항이 있으면 의미 있는 git commit 생성
2. 에러가 있으면 다음 반복에서 수정
3. 현재 마일스톤 완료 조건을 체크
4. M1~M4 완료 조건이 **전부** 충족되면 아래 태그를 출력:

<promise>ALL COMPLETE</promise>
