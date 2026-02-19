// SQLite 데이터베이스 연결 싱글턴
// better-sqlite3를 사용한 동기식 SQLite 바인딩

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// DB 파일 경로 (프로젝트 루트)
const DB_PATH = path.join(__dirname, '..', '..', 'opic_master.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

let db = null;

/**
 * 데이터베이스 연결을 반환하는 싱글턴 함수
 * 최초 호출 시 DB 생성, 스키마 적용, 시드 데이터 투입
 */
function getDatabase() {
  if (db) return db;

  // DB 연결 생성 (WAL 모드 활성화)
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 스키마 적용
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schema);

  // 마이그레이션: ai_feedbacks에 신규 컬럼 추가
  try {
    const cols = db.prepare("PRAGMA table_info(ai_feedbacks)").all().map(c => c.name);
    // 구 컬럼명 → 신 컬럼명 마이그레이션
    if (!cols.includes('task_completion_score')) {
      db.exec('ALTER TABLE ai_feedbacks ADD COLUMN task_completion_score INTEGER');
      console.log('[DB] 마이그레이션: ai_feedbacks.task_completion_score 추가');
      // 기존 pronunciation_score 데이터가 있으면 복사
      if (cols.includes('pronunciation_score')) {
        db.exec('UPDATE ai_feedbacks SET task_completion_score = pronunciation_score WHERE task_completion_score IS NULL');
      }
    }
    if (!cols.includes('content_delivery_score')) {
      db.exec('ALTER TABLE ai_feedbacks ADD COLUMN content_delivery_score INTEGER');
      console.log('[DB] 마이그레이션: ai_feedbacks.content_delivery_score 추가');
      if (cols.includes('content_organization_score')) {
        db.exec('UPDATE ai_feedbacks SET content_delivery_score = content_organization_score WHERE content_delivery_score IS NULL');
      }
    }
  } catch (e) {
    // 이미 존재하면 무시
  }

  // 마이그레이션: skill_assessments에 신규 컬럼 추가
  try {
    const skillCols = db.prepare("PRAGMA table_info(skill_assessments)").all().map(c => c.name);
    if (!skillCols.includes('task_completion_score')) {
      db.exec('ALTER TABLE skill_assessments ADD COLUMN task_completion_score INTEGER DEFAULT 0');
      console.log('[DB] 마이그레이션: skill_assessments.task_completion_score 추가');
      if (skillCols.includes('pronunciation_score')) {
        db.exec('UPDATE skill_assessments SET task_completion_score = pronunciation_score WHERE task_completion_score IS NULL');
      }
    }
    if (!skillCols.includes('content_delivery_score')) {
      db.exec('ALTER TABLE skill_assessments ADD COLUMN content_delivery_score INTEGER DEFAULT 0');
      console.log('[DB] 마이그레이션: skill_assessments.content_delivery_score 추가');
      if (skillCols.includes('content_organization_score')) {
        db.exec('UPDATE skill_assessments SET content_delivery_score = content_organization_score WHERE content_delivery_score IS NULL');
      }
    }
  } catch (e) {
    // 이미 존재하면 무시
  }

  // 마이그레이션: topic_vocabulary 테이블 추가
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS topic_vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      meaning_ko TEXT NOT NULL,
      example_sentence TEXT,
      category TEXT DEFAULT 'expression',
      FOREIGN KEY (topic_id) REFERENCES survey_topics(id)
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_topic_vocabulary_topic ON topic_vocabulary(topic_id)');
  } catch (e) {
    // 이미 존재하면 무시
  }

  // 시드 데이터 투입 (INSERT OR IGNORE로 중복 방지)
  const seed = fs.readFileSync(SEED_PATH, 'utf-8');
  const topicCount = db.prepare('SELECT COUNT(*) as count FROM survey_topics').get().count;
  if (topicCount === 0) {
    db.exec(seed);
    console.log('[DB] 초기 데이터 투입 완료');
  } else {
    // 답변 가이드 등 추가 시드 데이터 보충 (INSERT OR IGNORE로 중복 안전)
    const guideCount = db.prepare('SELECT COUNT(*) as count FROM answer_guides').get().count;
    if (guideCount < 42) {
      db.exec(seed);
      const newCount = db.prepare('SELECT COUNT(*) as count FROM answer_guides').get().count;
      console.log(`[DB] 답변 가이드 보충 완료: ${guideCount} → ${newCount}개`);
    } else {
      // survey_tips 보충
      const tipCount = db.prepare('SELECT COUNT(*) as count FROM survey_tips').get().count;
      if (tipCount < 25) {
        db.exec(seed);
        const newTipCount = db.prepare('SELECT COUNT(*) as count FROM survey_tips').get().count;
        console.log(`[DB] 서베이 팁 보충 완료: ${tipCount} → ${newTipCount}개`);
      } else {
        // topic_vocabulary 보충
        const vocabCount = db.prepare('SELECT COUNT(*) as count FROM topic_vocabulary').get().count;
        if (vocabCount < 100) {
          db.exec(seed);
          const newVocabCount = db.prepare('SELECT COUNT(*) as count FROM topic_vocabulary').get().count;
          console.log(`[DB] 단어장 보충 완료: ${vocabCount} → ${newVocabCount}개`);
        } else {
          console.log('[DB] 기존 데이터 확인 — 시드 생략');
        }
      }
    }
  }

  console.log(`[DB] SQLite 연결 완료: ${DB_PATH}`);
  return db;
}

/**
 * 데이터베이스 연결 종료
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] 연결 종료');
  }
}

module.exports = { getDatabase, closeDatabase };
