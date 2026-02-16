# OPIc Master - 개발 프롬프트

## 프로젝트 개요
OPIc(영어 말하기 시험) 대비 개인 학습 웹 앱을 개발합니다.
기술 문서는 `docs/` 디렉토리에 있습니다:
- `docs/PRD-20260216-083400.md` — 제품 요구사항 (기능 명세)
- `docs/TRD-20260216-084000.md` — 기술 요구사항 (아키텍처, DB, API)
- `docs/WBS-20260216-084500.md` — 작업 분해 구조

## 기술 스택 (고정)
- Frontend: HTML5/CSS3/JavaScript (ES6+), Vanilla JS SPA
- Backend: Node.js 20 + Express.js 4.x
- Database: SQLite (better-sqlite3)
- AI: Google Gemini API (gemini-2.5-flash-lite)
- 차트: Chart.js 4.x (CDN)
- 아이콘: Lucide Icons (CDN)

## 현재 마일스톤: M1 — 기본 설정 기능

### 목표
프로젝트 스캐폴딩 + 서베이 설정 + 레벨 설정 + 네비게이션 구현

### 구현 작업 목록

1. **프로젝트 초기화**
   - package.json 생성 (의존성: express, better-sqlite3, dotenv)
   - TRD 섹션 9의 프로젝트 구조대로 디렉토리 생성
   - .env.example, .gitignore 생성

2. **DB 스키마 및 초기 데이터**
   - `server/db/schema.sql` — TRD 섹션 4의 8개 테이블 DDL
   - `server/db/seed.sql` — 10개 서베이 주제, 9개 레벨, 주제당 5개+ 질문
   - `server/db/database.js` — SQLite 연결 싱글턴 (자동 초기화)

3. **Express 서버**
   - `server/index.js` — Express 서버 (포트 3000, 정적 파일 서빙)
   - `server/middleware/errorHandler.js` — 공통 에러 처리

4. **API 엔드포인트 (M1 범위)**
   - GET /api/v1/topics — 주제 목록 조회
   - PUT /api/v1/topics/selection — 주제 선택 저장
   - GET /api/v1/levels — 레벨 목록 조회
   - GET /api/v1/settings — 사용자 설정 조회
   - PUT /api/v1/settings — 사용자 설정 저장

5. **프론트엔드 SPA**
   - `public/index.html` — SPA 진입점 (다크 모드)
   - `public/css/global.css` — 다크 모드 테마 (배경 #0F172A, 카드 #1E293B, 액센트 #2DD4BF)
   - `public/js/app.js` — SPA 라우터, 탭바 네비게이션
   - `public/js/api.js` — fetch API 유틸리티

6. **서베이 설정 화면 (FR-001~004)**
   - 10개 주제 카드 그리드 표시
   - 카드 탭으로 선택/해제 토글
   - 3~5개 선택 제한 (초과 시 안내)
   - 저장 버튼 → API 호출 → 확인 피드백
   - 앱 시작 시 이전 선택 자동 로드

7. **레벨 설정 화면 (FR-009~013)**
   - 9단계 레벨 시각적 나열 (NL~AL)
   - 현재 레벨 / 목표 레벨 각각 선택
   - 목표 레벨 < 현재 레벨 시 유효성 검사
   - 갭 분석 프로그레스 바
   - 설정 저장 → DB 반영

8. **네비게이션 (FR-031~032)**
   - 하단 탭바: 서베이 설정, 문제은행, 모의시험, AI 피드백, 대시보드, 레벨 설정
   - 아이콘 + 텍스트, 활성 탭 틸 컬러 강조
   - 상단 "OPIc Master" 타이틀 헤더

### 디자인 가이드
- 다크 모드 기본
- 배경: #0F172A
- 카드 배경: #1E293B
- 액센트(틸): #2DD4BF
- 텍스트: #F1F5F9 (밝은 회색)
- 서브 텍스트: #94A3B8
- 경고: #EF4444
- 성공: #22C55E
- 폰트: system-ui

### 완료 조건
아래 조건이 **모두** 충족되면 완료:
- [ ] `npm install && npm start`로 서버가 정상 실행된다
- [ ] http://localhost:3000 접속 시 다크 모드 SPA가 표시된다
- [ ] 하단 탭바로 6개 화면 전환이 가능하다
- [ ] 서베이 주제 10개 카드가 표시되고 3~5개 선택/저장/로드가 동작한다
- [ ] 레벨 9단계 선택, 갭 분석 표시, 저장/로드가 동작한다
- [ ] DB에 주제(10개), 레벨(9개), 질문(50개+) 초기 데이터가 투입된다

### 작업 지침
- 매 반복마다 git status를 확인하고, 변경사항이 있으면 의미 있는 커밋을 생성하라
- 기존 파일이 있으면 읽고 이해한 뒤 수정하라
- 에러가 있으면 디버그하고 수정하라
- 코드에 한국어 주석을 포함하라
- 모든 완료 조건이 충족되면 아래 태그를 출력하라:

<promise>M1 COMPLETE</promise>
