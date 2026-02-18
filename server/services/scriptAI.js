// OPIc 스크립트 AI 생성 서비스
// Gemini API를 사용하여 OPIc 답변 스크립트 생성 및 개선

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// 스크립트 생성용 시스템 프롬프트
const GENERATE_SYSTEM_PROMPT = `You are an expert OPIc (Oral Proficiency Interview - computer) script writer.
Your task is to create a natural, high-quality English answer script for OPIc questions.

You will be given:
- The question text (English)
- The target ACTFL proficiency level
- The question type (survey, combo, roleplay, unexpected)

Generate a script following these structures:

For survey/combo/unexpected questions:
- Hook (1-2 sentences): Engaging opening that directly addresses the question
- Main1 (3-4 sentences): First main point with specific details and examples
- Main2 (3-4 sentences): Second main point with different angle or supporting details
- Reflection (2-3 sentences): Personal reflection or concluding thought
- Target: 130+ words for IH/AL levels, 80+ words for IM levels, 50+ words for lower levels

For roleplay questions:
- Greeting (1-2 sentences): Appropriate greeting and context setting
- Problem (2-3 sentences): Clearly state the situation or problem
- Request (2-3 sentences): Make specific requests or proposals
- Closing (1-2 sentences): Polite closing and thank you
- Target: 100+ words for IH/AL levels, 70+ words for IM levels, 40+ words for lower levels

Important guidelines:
- Use vocabulary and grammar appropriate for the target level
- Include natural fillers and transitions for higher levels (IH/AL)
- Keep sentences simple and clear for lower levels (IM1/IM2)
- Include idiomatic expressions for IH/AL levels
- Make the script sound natural when spoken aloud, not like written text

Respond ONLY with JSON in this exact format:
{
  "script_text": "The full script text",
  "word_count": 135,
  "structure_notes": "Hook(2) -> Main1(4) -> Main2(3) -> Reflection(2)",
  "key_expressions": ["expression 1", "expression 2", "expression 3", "expression 4"]
}

Output JSON only. No other text.`;

// 스크립트 개선용 시스템 프롬프트
const REFINE_SYSTEM_PROMPT = `You are an expert OPIc (Oral Proficiency Interview - computer) script editor.
Your task is to improve an existing OPIc answer script to better match the target proficiency level.

You will be given:
- The original question text
- The current draft script
- The target ACTFL proficiency level

Improve the script by:
1. Adjusting vocabulary complexity to match the target level
2. Improving sentence flow and natural speech patterns
3. Adding appropriate transitions and connectors
4. Ensuring the script sounds natural when spoken aloud
5. Fixing any grammatical issues
6. Adding idiomatic expressions appropriate for the level
7. Adjusting length to meet level requirements

Respond ONLY with JSON in this exact format:
{
  "refined_text": "The improved script text",
  "improvements": ["Improvement 1 description", "Improvement 2 description"],
  "word_count": 142,
  "suggestions": ["Additional suggestion 1", "Additional suggestion 2"]
}

Output JSON only. No other text.`;

/**
 * Gemini API를 호출하여 OPIc 답변 스크립트를 생성
 * @param {string} questionText - 질문 원문 (영어)
 * @param {string} targetLevel - 목표 레벨 코드 (IM1, IH, AL 등)
 * @param {string} questionType - 질문 유형 (survey, combo, roleplay, unexpected)
 * @returns {Object} {script_text, word_count, structure_notes, key_expressions}
 */
async function generateScript(questionText, targetLevel, questionType) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
    const err = new Error('Gemini API Key가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 설정해주세요.');
    err.status = 400;
    throw err;
  }

  const userContent = `Question: ${questionText}\nTarget Level: ${targetLevel}\nQuestion Type: ${questionType}`;

  const requestBody = {
    contents: [{
      parts: [{ text: userContent }]
    }],
    systemInstruction: {
      parts: [{ text: GENERATE_SYSTEM_PROMPT }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  };

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

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API 응답이 비어있습니다');
    }

    const result = JSON.parse(text);

    // 필수 필드 검증
    if (!result.script_text || !result.word_count) {
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다');
    }

    // key_expressions 기본값 보장
    if (!Array.isArray(result.key_expressions)) {
      result.key_expressions = [];
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

/**
 * Gemini API를 호출하여 기존 스크립트를 개선
 * @param {string} draftText - 원본 스크립트 텍스트
 * @param {string} targetLevel - 목표 레벨 코드
 * @param {string} questionText - 원본 질문 텍스트
 * @returns {Object} {refined_text, improvements, word_count, suggestions}
 */
async function refineScript(draftText, targetLevel, questionText) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
    const err = new Error('Gemini API Key가 설정되지 않았습니다. .env 파일에 GEMINI_API_KEY를 설정해주세요.');
    err.status = 400;
    throw err;
  }

  const userContent = `Original Question: ${questionText}\nTarget Level: ${targetLevel}\n\nCurrent Draft:\n${draftText}`;

  const requestBody = {
    contents: [{
      parts: [{ text: userContent }]
    }],
    systemInstruction: {
      parts: [{ text: REFINE_SYSTEM_PROMPT }]
    },
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  };

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

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Gemini API 응답이 비어있습니다');
    }

    const result = JSON.parse(text);

    // 필수 필드 검증
    if (!result.refined_text || !result.word_count) {
      throw new Error('Gemini API 응답 형식이 올바르지 않습니다');
    }

    // 배열 필드 기본값 보장
    if (!Array.isArray(result.improvements)) {
      result.improvements = [];
    }
    if (!Array.isArray(result.suggestions)) {
      result.suggestions = [];
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

module.exports = { generateScript, refineScript };
