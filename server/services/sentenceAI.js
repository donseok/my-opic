// 문장별 AI 발음 평가 서비스
// Gemini API를 활용하여 개별 문장의 발음을 평가하고 등급을 판정

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// 문장 발음 평가 시스템 프롬프트
const SENTENCE_EVAL_PROMPT = `당신은 OPIc 시험 전문 발음 코치입니다.
학습자가 영어 문장을 낭독한 음성을 듣고 발음을 평가합니다.

대상 문장과 오디오가 제공됩니다. 다음 형식의 JSON으로 평가하세요:
{
  "pronunciation_score": 82,
  "pronunciation_grade": "IH",
  "word_scores": [
    {"word": "hello", "score": 90, "issue": null},
    {"word": "world", "score": 65, "issue": "r/l 발음 혼동"}
  ],
  "intonation": "자연스러운 억양",
  "stress": "문장 강세가 적절함",
  "pace": "적절한 속도",
  "overall_feedback": "전반적으로 발음이 좋습니다. r/l 구분에 주의하세요."
}

등급 기준:
- AL (90~100): 원어민에 가까운 발음
- IH (80~89): 매우 자연스러운 발음
- IM (65~79): 이해 가능하나 개선 여지 있음
- IL (50~64): 일부 발음 오류 있음
- NM (0~49): 발음 교정 필요

JSON만 출력하고 다른 텍스트는 포함하지 마세요.`;

/**
 * 문장 발음을 AI로 평가
 * @param {string} audioBase64 - Base64 인코딩된 오디오
 * @param {string} sentenceText - 대상 문장 원문
 * @returns {Object} 평가 결과
 */
async function evaluateSentencePronunciation(audioBase64, sentenceText) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_api_key_here') {
        // API 키 없을 때 시뮬레이션 결과 반환
        return generateSimulatedResult(sentenceText);
    }

    const contextText = `대상 문장: "${sentenceText}"\n이 문장을 낭독한 학습자의 발음을 평가해주세요.`;

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
            parts: [{ text: SENTENCE_EVAL_PROMPT }]
        },
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json'
        }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            console.warn(`[SentenceAI] Gemini API 오류: ${response.status}, 시뮬레이션 모드로 전환`);
            return generateSimulatedResult(sentenceText);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return generateSimulatedResult(sentenceText);
        }

        const result = JSON.parse(text);

        // 필수 필드 보장
        result.pronunciation_score = result.pronunciation_score || 0;
        result.pronunciation_grade = result.pronunciation_grade || scoreToGrade(result.pronunciation_score);

        return result;
    } catch (err) {
        clearTimeout(timeout);
        console.warn('[SentenceAI] 평가 실패, 시뮬레이션 모드:', err.message);
        return generateSimulatedResult(sentenceText);
    }
}

/**
 * 점수를 등급으로 변환
 */
function scoreToGrade(score) {
    if (score >= 90) return 'AL';
    if (score >= 80) return 'IH';
    if (score >= 65) return 'IM';
    if (score >= 50) return 'IL';
    return 'NM';
}

/**
 * API 키가 없거나 오류 시 시뮬레이션 결과 생성
 */
function generateSimulatedResult(sentenceText) {
    const words = sentenceText.split(/\s+/);
    const baseScore = 60 + Math.floor(Math.random() * 30); // 60~89

    return {
        pronunciation_score: baseScore,
        pronunciation_grade: scoreToGrade(baseScore),
        word_scores: words.slice(0, 10).map(w => ({
            word: w.replace(/[.,!?;:'"]/g, ''),
            score: Math.max(40, baseScore + Math.floor(Math.random() * 20 - 10)),
            issue: null
        })),
        intonation: '평가를 위해 마이크 녹음이 필요합니다',
        stress: '평가를 위해 마이크 녹음이 필요합니다',
        pace: '적절',
        overall_feedback: 'AI 발음 평가 시뮬레이션 결과입니다. GEMINI_API_KEY를 설정하면 실제 평가를 받을 수 있습니다.',
        simulated: true
    };
}

module.exports = { evaluateSentencePronunciation, scoreToGrade };
