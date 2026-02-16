// 단어 수 카운트 유틸리티

const WordCountUtil = {
  /**
   * 텍스트의 단어 수 계산 (영어 기준)
   * @param {string} text - 입력 텍스트
   * @returns {number} 단어 수
   */
  count(text) {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  }
};
