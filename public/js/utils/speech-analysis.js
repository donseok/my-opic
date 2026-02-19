// 음성 분석 유틸리티
// WPM, 멈춤 감지, 말하기 메트릭 계산

const SpeechAnalysisUtil = {
  /**
   * 텍스트와 녹음 시간으로 말하기 메트릭 분석
   * @param {string} transcript - 음성 인식 텍스트
   * @param {number} durationSec - 녹음 시간 (초)
   * @returns {{wpm: number, word_count: number, speaking_duration: number}}
   */
  analyze(transcript, durationSec) {
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const minutes = durationSec / 60;
    const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;

    return {
      wpm: wpm,
      word_count: wordCount,
      speaking_duration: durationSec
    };
  },

  /**
   * 진폭 히스토리로 멈춤 분석
   * @param {number[]} amplitudeHistory - 평균 진폭 배열
   * @param {number} intervalMs - 수집 간격 (ms)
   * @param {number} [threshold=10] - 멈춤 감지 임계값
   * @returns {{pause_count: number, total_pause_ms: number, avg_amplitude: number}}
   */
  analyzePauses(amplitudeHistory, intervalMs, threshold) {
    if (!amplitudeHistory || amplitudeHistory.length === 0) {
      return { pause_count: 0, total_pause_ms: 0, avg_amplitude: 0 };
    }

    const thresh = threshold || 10;
    let pauseCount = 0;
    let totalPauseMs = 0;
    let inPause = false;
    let currentPauseLength = 0;
    let totalAmplitude = 0;

    for (let i = 0; i < amplitudeHistory.length; i++) {
      totalAmplitude += amplitudeHistory[i];

      if (amplitudeHistory[i] < thresh) {
        if (!inPause) {
          inPause = true;
          currentPauseLength = 0;
        }
        currentPauseLength += intervalMs;
      } else {
        if (inPause) {
          // 500ms 이상의 멈춤만 카운트
          if (currentPauseLength >= 500) {
            pauseCount++;
            totalPauseMs += currentPauseLength;
          }
          inPause = false;
        }
      }
    }

    // 마지막 멈춤 처리
    if (inPause && currentPauseLength >= 500) {
      pauseCount++;
      totalPauseMs += currentPauseLength;
    }

    return {
      pause_count: pauseCount,
      total_pause_ms: totalPauseMs,
      avg_amplitude: Math.round(totalAmplitude / amplitudeHistory.length)
    };
  },

  /**
   * WPM에 따른 속도 평가
   * @param {number} wpm - 분당 단어 수
   * @returns {string} 평가 텍스트
   */
  getSpeedRating(wpm) {
    if (wpm === 0) return '-';
    if (wpm < 80) return '느림';
    if (wpm < 110) return '약간 느림';
    if (wpm <= 150) return '적정';
    if (wpm <= 180) return '약간 빠름';
    return '빠름';
  }
};
