import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Timeout wrapper for API calls (30 seconds per question)
const withTimeout = (promise, timeoutMs = 30000) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('API timeout')), timeoutMs)
        )
    ]);
};

export async function POST(req) {
    try {
        const { transcript, timeTaken, question, previousHistory = [] } = await req.json();

        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_key') {
            console.warn("OpenAI API key missing. Falling back to mock evaluation.");
            return runMockEvaluation(transcript, timeTaken, question);
        }

        const questionText = typeof question === 'string' ? question : question.text;
        const idealAnswer = question.idealAnswer || "";
        const keywords = question.keywords || [];

        try {
            const completion = await withTimeout(
                openai.chat.completions.create({
                    model: "gpt-4-turbo", // Faster than gpt-4o
                    messages: [
                        {
                            role: "system",
                            content: `You are an expert technical interviewer. Evaluate the candidate's response to the following question.
                    
                    Question: ${questionText}
                    ${idealAnswer ? `Ideal Answer Guide: ${idealAnswer}` : ''}
                    ${keywords.length > 0 ? `Target Keywords: ${keywords.join(', ')}` : ''}

                    Analyze the response based on:
                    1. Technical Accuracy (Score 0-10)
                    2. Communication Clarity (Score 0-10) - Consider filler words and structure.
                    3. Specific Strengths and Weaknesses.
                    4. A relevant, challenging follow-up question.

                    The transcript provided is: "${transcript}"
                    The candidate took ${timeTaken} seconds.

                     Return ONLY a JSON object with this structure:
                    {
                        "score": { "technical": 0, "communication": 0, "overall": 0 },
                        "feedback": { "strengths": "", "weaknesses": "" },
                        "followUpQuestion": "",
                        "analysis": {}
                    }`
                        }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.7 // Lower temperature for consistency
                }),
                30000 // 30 second timeout
            );

            const aiResult = JSON.parse(completion.choices[0].message.content);

        // Calculate communication metrics locally for transparency
        const fillerWords = ['um', 'uh', 'uhh', 'umm', 'like', 'actually', 'basically', 'you know', 'literally'];
        const words = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const wordCount = words.length;
        let fillerCount = 0;
        words.forEach(word => {
            if (fillerWords.includes(word.replace(/[^a-z]/g, ''))) fillerCount++;
        });
        const minutes = timeTaken / 60;
        const wpm = Math.round(wordCount / (minutes || 1));
        const fillerDensity = (fillerCount / (wordCount || 1));

        const { matchedKeywords, missingKeywords } = performLocalKeywordMatch(transcript, keywords);

        // Deterministic Technical Score Calculation based on keywords
        let technicalScore = 0;
        const totalKeywords = keywords.length;
        const matchedCount = matchedKeywords.length;
        
        if (totalKeywords === 0) {
            technicalScore = aiResult.score.technical || 7;
        } else if (matchedCount >= totalKeywords - 1 && totalKeywords > 1) {
            // Award full marks if missing at most 1 keyword (e.g. 5 out of 6)
            technicalScore = 10;
        } else if (totalKeywords === 1 && matchedCount === 1) {
            technicalScore = 10;
        } else {
            technicalScore = Number(((matchedCount / totalKeywords) * 10).toFixed(2));
        }

        // Override AI technical score with precise keyword-based score
        aiResult.score.technical = technicalScore;
        // Weight technical score more heavily (70%) than communication (30%) for an accurate overall readiness
        aiResult.score.overall = Number(((technicalScore * 0.7) + ((aiResult.score.communication || 0) * 0.3)).toFixed(2));

        return Response.json({
            ...aiResult,
            metrics: {
                wpm,
                fillerCount,
                fillerDensity: (fillerDensity * 100).toFixed(1) + '%',
                matchedKeywords,
                missingKeywords
            }
        });

        } catch (apiError) {
            console.warn("OpenAI API error, falling back to mock:", apiError.message);
            return runMockEvaluation(transcript, timeTaken, question);
        }
    } catch (error) {
        console.error("Evaluation Error:", error);
        return Response.json({
            score: { technical: 5, communication: 5, overall: 5 },
            metrics: { wpm: 0, fillerCount: 0, fillerDensity: '0%' },
            feedback: { strengths: "Response recorded.", weaknesses: "Unable to generate detailed feedback." },
            followUpQuestion: "Can you elaborate on that?"
        });
    }
}

// Fallback helper for mock evaluation
function runMockEvaluation(transcript, timeTaken, question) {
    const fillerWords = ['um', 'uh', 'uhh', 'umm', 'like', 'actually', 'basically', 'you know', 'literally'];
    const words = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    let fillerCount = 0;
    words.forEach(word => {
        if (fillerWords.includes(word.replace(/[^a-z]/g, ''))) fillerCount++;
    });
    const minutes = timeTaken / 60;
    const wpm = Math.round(wordCount / (minutes || 1));
    const fillerDensity = fillerCount / (wordCount || 1);

    let commScore = 10;
    if (fillerDensity > 0.05) commScore -= 2;
    if (wpm < 100 || wpm > 180) commScore -= 1;

    const keywords = question.keywords || [];
    const { matchedKeywords, missingKeywords } = performLocalKeywordMatch(transcript, keywords);

    // Deterministic Technical Score Calculation
    let technicalScore = 0;
    const totalKeywords = keywords.length;
    const matchedCount = matchedKeywords.length;
    
    if (totalKeywords === 0) {
        technicalScore = 7;
    } else if (matchedCount >= totalKeywords - 1 && totalKeywords > 1) {
        technicalScore = 10;
    } else if (totalKeywords === 1 && matchedCount === 1) {
        technicalScore = 10;
    } else {
        technicalScore = Number(((matchedCount / totalKeywords) * 10).toFixed(2));
    }

    return Response.json({
        score: { technical: technicalScore, communication: commScore, overall: Number(((technicalScore * 0.7) + (commScore * 0.3)).toFixed(2)) },
        metrics: { wpm, fillerCount, fillerDensity: (fillerDensity * 100).toFixed(1) + '%', matchedKeywords, missingKeywords },
        feedback: { strengths: "Good baseline response.", weaknesses: "Use an API key for deeper AI insights." },
        followUpQuestion: "Can you elaborate more on your experience with this technology?"
    });
}

function performLocalKeywordMatch(transcript, keywords) {
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) return { matchedKeywords: [], missingKeywords: [] };
    const matchedKeywords = [];
    const missingKeywords = [];
    const lowerTranscript = transcript.toLowerCase();

    keywords.forEach(kw => {
        const kwLower = kw.toLowerCase().trim();
        if (!kwLower) return;
        
        const escapedKw = kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedKw}\\b`, 'i');
        
        if (regex.test(lowerTranscript) || lowerTranscript.includes(kwLower)) {
            matchedKeywords.push(kw);
        } else {
            missingKeywords.push(kw);
        }
    });

    return { matchedKeywords, missingKeywords };
}
