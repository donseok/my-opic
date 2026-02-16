// 공통 에러 처리 미들웨어

/**
 * Express 에러 핸들러
 * 모든 라우터에서 발생한 에러를 통합 처리
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || '서버 내부 오류가 발생했습니다';

  res.status(statusCode).json({
    error: true,
    code: err.code || 'INTERNAL_ERROR',
    message: message
  });
}

module.exports = errorHandler;
