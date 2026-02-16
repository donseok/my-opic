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

  // 시드 데이터 투입 (INSERT OR IGNORE로 중복 방지)
  const seed = fs.readFileSync(SEED_PATH, 'utf-8');
  const topicCount = db.prepare('SELECT COUNT(*) as count FROM survey_topics').get().count;
  if (topicCount === 0) {
    db.exec(seed);
    console.log('[DB] 초기 데이터 투입 완료');
  } else {
    // 답변 가이드 등 추가 시드 데이터 보충 (INSERT OR IGNORE)
    const guideCount = db.prepare('SELECT COUNT(*) as count FROM answer_guides').get().count;
    if (guideCount === 0) {
      db.exec(seed);
      console.log('[DB] 답변 가이드 등 보충 데이터 투입 완료');
    } else {
      console.log('[DB] 기존 데이터 확인 — 시드 생략');
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
