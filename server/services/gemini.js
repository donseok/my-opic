// Gemini API 서비스 (M3에서 상세 구현)
// OPIc 답변 평가를 위한 Gemini API 프록시

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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
  "strengths": ["잘한 점 1", "잘한 점 2", "잘한 점 3"],
  "improvements": ["개선할 점 1 (목표 레벨 기준)", "개선할 점 2", "개선할 점 3"]
}

평가 기준:
- predicted_level: NL/NM/NH/IL/IM1/IM2/IM3/IH/AL 중 하나
- grammar_score: 문법 정확도 (0~100)
- fluency_score: 유창성, 자연스러움 (0~100)
- vocabulary_score: 어휘 다양성과 적절성 (0~100)
- strengths: 잘한 점 3가지 (한국어)
- improvements: 목표 레벨 도달을 위한 개선점 3가지 (한국어)

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

    // 응답에서 텍스트 추출
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API 응답이 비어있습니다');
    }

    // JSON 파싱
    const result = JSON.parse(text);

    // 필수 필드 검증
    if (!result.predicted_level || result.grammar_score === undefined) {
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다');
    }

    return result;
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

module.exports = { evaluateAnswers };
