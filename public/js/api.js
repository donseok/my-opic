// API 호출 유틸리티
// fetch 래퍼 — GET, POST, PUT, DELETE 요청 공통 처리

const API_BASE = '/api/v1';

/**
 * API GET 요청
 * @param {string} path - API 경로 (예: '/topics')
 * @returns {Promise<Object>} 응답 데이터
 */
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '요청 실패' }));
    throw { status: res.status, ...err };
  }
  return res.json();
}

/**
 * API POST 요청
 * @param {string} path - API 경로
 * @param {Object} body - 요청 본문
 * @returns {Promise<Object>} 응답 데이터
 */
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '요청 실패' }));
    throw { status: res.status, ...err };
  }
  return res.json();
}

/**
 * API PUT 요청
 * @param {string} path - API 경로
 * @param {Object} body - 요청 본문
 * @returns {Promise<Object>} 응답 데이터
 */
async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '요청 실패' }));
    throw { status: res.status, ...err };
  }
  return res.json();
}

/**
 * API DELETE 요청
 * @param {string} path - API 경로
 * @returns {Promise<Object>} 응답 데이터
 */
async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '요청 실패' }));
    throw { status: res.status, ...err };
  }
  return res.json();
}

/**
 * API POST 요청 (FormData / 대용량 데이터)
 * @param {string} path - API 경로
 * @param {Object} body - 요청 본문 (JSON으로 전송, 대용량 지원)
 * @returns {Promise<Object>} 응답 데이터
 */
async function apiPostLarge(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: '요청 실패' }));
    throw { status: res.status, ...err };
  }
  return res.json();
}

/**
 * 토스트 알림 표시
 * @param {string} message - 메시지
 * @param {string} type - 'success' | 'error' | 'warning'
 */
function showToast(message, type = 'success') {
  // 기존 토스트 제거
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // 표시 애니메이션
  requestAnimationFrame(() => toast.classList.add('show'));

  // 3초 후 제거
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
