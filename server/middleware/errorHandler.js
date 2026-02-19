// 공통 에러 처리 미들웨어

const isProduction = process.env.NODE_ENV === 'production';

/**
 * 상태 코드에 따른 에러 코드 분류
 */
function classifyErrorCode(err, statusCode) {
  if (err.code) return err.code;
  if (statusCode === 400) return 'VALIDATION_ERROR';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 429) return 'RATE_LIMIT';
  return 'INTERNAL_ERROR';
}

/**
 * Express 에러 핸들러
 * 모든 라우터에서 발생한 에러를 통합 처리
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const statusCode = err.statusCode || err.status || 500;
  const code = classifyErrorCode(err, statusCode);

  // 프로덕션에서 5xx 에러는 내부 메시지를 숨김
  const message = (isProduction && statusCode >= 500)
    ? '서버 내부 오류가 발생했습니다'
    : (err.message || '서버 내부 오류가 발생했습니다');

  res.status(statusCode).json({
    error: true,
    code,
    message
  });
}

module.exports = errorHandler;
