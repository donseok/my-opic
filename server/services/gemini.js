// Gemini API 서비스
// OPIc 답변 평가 + 음성 분석을 위한 Gemini API 프록시

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// OPIc 채점관 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 OPIc(Oral Proficiency Interview - computer) 시험 전문 채점관입니다.
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
  "task_completion_score": 70,
  "content_delivery_score": 65,
  "strengths": ["잘한 점 1", "잘한 점 2", "잘한 점 3"],
  "improvements": ["개선할 점 1 (목표 레벨 기준)", "개선할 점 2", "개선할 점 3"]
}

평가 기준:
- predicted_level: NL/NM/NH/IL/IM1/IM2/IM3/IH/AL 중 하나
- grammar_score: 문법 정확도 (0~100)
- fluency_score: 유창성, 자연스러움 (0~100)
- vocabulary_score: 어휘 다양성과 적절성 (0~100)
- task_completion_score: 문제 이해력 (0~100, 질문의 의도를 정확히 파악하고 적절히 답변했는지)
- content_delivery_score: 내용 표현력 (0~100, 구체적 사례/설명의 풍부함, 논리적 전개)
- strengths: 잘한 점 3가지 (한국어)
- improvements: 목표 레벨 도달을 위한 개선점 3가지 (한국어)

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`;

// 음성 분석 시스템 프롬프트
const VOICE_ANALYSIS_PROMPT = `당신은 OPIc 시험 전문 음성 분석관입니다.
제공된 오디오를 듣고 영어 말하기를 분석합니다.

다음 형식의 JSON으로 분석 결과를 출력하세요:
{
  "transcript": "음성을 텍스트로 변환한 결과",
  "pronunciation_score": 72,
  "fluency_score": 65,
  "intonation_score": 68,
  "pace_wpm": 120,
  "filler_words": ["um", "uh", "like"],
  "pause_count": 3,
  "clarity_score": 70,
  "feedback": {
    "pronunciation": "발음에 대한 상세 피드백 (한국어)",
    "fluency": "유창성에 대한 상세 피드백 (한국어)",
    "intonation": "억양에 대한 상세 피드백 (한국어)",
    "overall": "전반적인 피드백과 개선 방향 (한국어)"
  }
}

평가 기준:
- pronunciation_score: 발음 정확도 (0~100)
- fluency_score: 유창성 (0~100)
- intonation_score: 억양 자연스러움 (0~100)
- pace_wpm: 분당 단어 수 (정상: 110~150)
- filler_words: 사용한 필러 워드 목록
- pause_count: 비정상적으로 긴 멈춤 횟수
- clarity_score: 전체 명확성 (0~100)

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`;

/**
 * Gemini API를 호출하여 OPIc 답변을 평가
 * @param {Array} answers - 답변 배열 [{question_text, answer_text, word_count}]
 * @param {string} targetLevel - 목표 레벨 코드
 * @returns {Object} 평가 결과
 */
async function evaluateAnswers(answers, targetLevel) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
    const err = new Error('Gemini API Key가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 설정해주세요.');
    err.status = 400;
    throw err;
  }

  // 사용자 답변을 평가용 텍스트로 구성
  let userContent = `목표 레벨: ${targetLevel}\n\n`;
  answers.forEach((a, idx) => {
    userContent += `--- 질문 ${idx + 1} ---\n`;
    userContent += `질문: ${a.question_text}\n`;
    userContent += `답변: ${a.answer_text}\n`;
    userContent += `단어 수: ${a.word_count}\n\n`;
  });

  const requestBody = {
    contents: [{
      parts: [{ text: userContent }]
    }],
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  };

  // 15초 타임아웃 설정
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = new Error(`Gemini API 오류: ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();

    // 응답에서 텍스트 추출
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API 응답이 비어있습니다');
    }

    // 마크다운 코드블록 래퍼 제거 후 JSON 파싱
    const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const result = JSON.parse(cleaned);

    // 필수 필드 검증 및 기본값 보정
    if (!result.predicted_level) {
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다');
    }

    return {
      predicted_level: result.predicted_level,
      grammar_score: Number(result.grammar_score) || 0,
      fluency_score: Number(result.fluency_score) || 0,
      vocabulary_score: Number(result.vocabulary_score) || 0,
      task_completion_score: Number(result.task_completion_score) || 0,
      content_delivery_score: Number(result.content_delivery_score) || 0,
      strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 3) : [],
      improvements: Array.isArray(result.improvements) ? result.improvements.slice(0, 3) : []
    };
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Gemini API 응답 시간이 초과되었습니다 (15초)');
      timeoutErr.status = 504;
      throw timeoutErr;
    }

    throw err;
  }
}

/**
 * Gemini API를 호출하여 음성 녹음을 분석
 * @param {string} audioBase64 - Base64 인코딩된 오디오 데이터
 * @param {string} questionText - 질문 텍스트 (컨텍스트)
 * @returns {Object} 음성 분석 결과
 */
async function analyzeVoiceRecording(audioBase64, questionText) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
    const err = new Error('Gemini API Key가 설정되지 않았습니다.');
    err.status = 400;
    throw err;
  }

  const contextText = questionText
    ? `질문: ${questionText}\n이 질문에 대한 사용자의 영어 음성 답변을 분석해주세요.`
    : '사용자의 영어 음성을 분석해주세요.';

  const requestBody = {
    contents: [{
      parts: [
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: audioBase64
          }
        },
        { text: contextText }
      ]
    }],
    systemInstruction: {
      parts: [{ text: VOICE_ANALYSIS_PROMPT }]
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json'
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30초 (오디오 처리)

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = new Error(`Gemini API 오류: ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API 음성 분석 응답이 비어있습니다');
    }

    return JSON.parse(text);
  } catch (err) {
    clearTimeout(timeout);

    if (err.name === 'AbortError') {
      const timeoutErr = new Error('음성 분석 시간이 초과되었습니다 (30초)');
      timeoutErr.status = 504;
      throw timeoutErr;
    }

    throw err;
  }
}

module.exports = { evaluateAnswers, analyzeVoiceRecording };
