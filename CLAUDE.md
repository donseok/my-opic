# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OPIc Master — 영어 말하기 시험(OPIc) 대비 종합 학습 앱. 단일 Express 서버가 SPA 웹 프론트엔드와 REST API를 모두 서빙하며, Flutter 모바일 앱이 같은 API를 사용한다.

## Commands

```bash
# 서버 시작 (포트 3000, 웹+API 동시 서빙)
npm start                    # = node server/index.js

# 모바일 앱
cd mobile && flutter pub get
cd mobile && flutter run      # 에뮬레이터/실기기
cd mobile && flutter build apk --release  # Android APK

# DB 초기화 (opic_master.db 삭제 후 서버 재시작하면 자동 생성)
rm opic_master.db && npm start
```

**환경 변수** (`.env` 파일 필요):
```
GEMINI_API_KEY=<Google Gemini API 키>
PORT=3000  # 선택
```

## Architecture

### 기술 스택 (고정, 변경 금지)
- **Backend**: Node.js 20 + Express 4 + better-sqlite3 (동기식 SQLite, WAL 모드)
- **Web Frontend**: Vanilla JS SPA (프레임워크 사용 금지), Chart.js 4 (CDN), Lucide Icons (CDN)
- **Mobile**: Flutter (Dart), fl_chart, provider 패턴
- **AI**: Google Gemini API (`gemini-2.5-flash`) — `node-fetch`로 호출, 텍스트+오디오 멀티모달

### 웹 SPA 라우팅
`public/js/app.js`가 hash 기반 SPA 라우터. 각 탭은 독립 JS 모듈(`SurveyModule`, `ExamModule` 등)로, `render(container)` 메서드가 DOM을 직접 조작한다. **innerHTML 사용 금지** — 모든 DOM은 `createElement`+`textContent`로 생성 (XSS 방지).

`public/js/api.js`에 `apiGet/apiPost/apiPut/apiDelete/showToast` 전역 함수가 정의되어 있으며, 모든 모듈이 이를 사용한다.

### 모듈-탭 매핑
| 탭 | JS 모듈 | API 프리픽스 | 라우트 파일 |
|---|---------|------------|-----------|
| 서베이 | `SurveyModule` | `/topics` | `topics.js` |
| 문제은행 | `QuestionsModule` | `/questions` | `questions.js` |
| 스크립트 | `ScriptsModule` | `/scripts` | `scripts.js` |
| 모의시험 | `ExamModule` | `/exam` | `exam.js` |
| AI피드백 | `FeedbackModule` | `/feedback` | `feedback.js` |
| 학습플랜 | `StudyPlanModule` | `/study-plan` | `studyPlan.js` |
| 복습(SRS) | `SrsModule` | `/srs` | `srs.js` |
| 대시보드 | `DashboardModule` | `/dashboard` | `dashboard.js` |
| 레벨설정 | `LevelModule` | `/levels`, `/settings` | `levels.js`, `settings.js` |

### 데이터베이스
- **파일**: 프로젝트 루트 `opic_master.db` (gitignore됨)
- **스키마**: `server/db/schema.sql` (18개 테이블), **시드**: `server/db/seed.sql`
- **싱글턴**: `server/db/database.js`의 `getDatabase()` — 서버 시작 시 스키마+시드 자동 적용
- **마이그레이션**: `database.js`에서 `PRAGMA table_info`로 컬럼 존재 확인 후 `ALTER TABLE` 실행
- `better-sqlite3`는 **동기식** API — `db.prepare().get()`, `db.prepare().all()`, `db.prepare().run()`

### 핵심 데이터 흐름
1. **모의시험**: `POST /exam/start` (5문제 구성) → 답변 입력 → `POST /exam/sessions` (결과 저장) → `POST /feedback/evaluate` (Gemini AI 평가) → `skill_assessments` 테이블에 5축 점수 저장
2. **스크립트 빌더**: 초안 작성 → `POST /scripts/generate` (AI 생성) → `POST /scripts/:id/refine` (AI 개선) → 플래시카드 암기
3. **SRS**: `POST /srs/seed` (답변가이드에서 항목 자동 생성) → `GET /srs/due` (오늘 복습 대상) → `POST /srs/review` (SM-2 알고리즘으로 간격 업데이트)
4. **학습 플랜**: `GET /study-plan/today` (없으면 자동 생성) → 약점 분석 기반 태스크 목록

### Flutter 모바일 앱
- **API 설정**: `mobile/lib/config/api_config.dart` — Android 에뮬레이터(`10.0.2.2:3000`), iOS 시뮬레이터(`localhost:3000`), 실기기(PC IP 변경 필요)
- **서비스**: `mobile/lib/services/api_service.dart` — `get/post/put/delete/postLarge` 정적 메서드
- **테마**: 라이트 모드 (흰색+스카이블루 `#0284C7`), `main.dart`의 `AppColors` 커스텀 ThemeExtension
- 5탭 바텀 네비: 학습플랜, 문제은행, 모의시험, 복습, 대시보드 (서베이/레벨/스크립트는 AppBar 메뉴)

### 디자인 시스템
CSS 커스텀 프로퍼티 (`public/css/global.css`):
- 배경: `#FFFFFF` / `#F0F9FF` (스카이블루 틴트)
- 액센트: `#0284C7` (sky-600) / `#38BDF8` / `#BAE6FD`
- 텍스트: `#0F172A` / `#475569` / `#94A3B8`
- 카드: 흰색 + `box-shadow` + `border-radius: 16px`

### AI 서비스 (`server/services/`)
- `gemini.js`: Gemini API 프록시 — `evaluateAnswers()` (텍스트 평가), `analyzeVoiceRecording()` (오디오 멀티모달)
- `scriptAI.js`: 스크립트 생성/개선
- `studyPlan.js`: 약점 분석 + 일일 학습 계획 자동 생성
- `srs.js`: SM-2 간격반복 알고리즘 (`processReview`, `seedFromGuides`)

## Key Conventions

- **한국어 UI**: 모든 사용자 대면 텍스트는 한국어, 영어 질문/답변은 원문 유지
- **API 경로**: 모두 `/api/v1/` 프리픽스, SPA 폴백은 `server/index.js`의 `app.get('*')`
- **에러 응답**: `{ error: true, code: 'ERROR_CODE', message: '...' }` 형식
- **JSON 배열 필드**: `strengths`, `improvements`, `key_phrases`, `filler_words` 등은 DB에 JSON 문자열로 저장, 프론트에서 파싱
- **점수 범위**: 모든 점수는 0~100 정수
- **OPIc 레벨 코드**: NL, NM, NH, IL, IM1, IM2, IM3, IH, AL (9단계)
