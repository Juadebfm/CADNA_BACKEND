/**
 * AI Prompt Templates
 * Optimized for Vercel AI SDK
 */

export const prompts = {
  /**
   * Essay Grading
   */
  gradeEssay: ({ question, answer, rubric, maxScore = 100 }) => ({
    systemPrompt: `You are an expert academic grader. Grade essays fairly and consistently.

RULES:
- Be objective and constructive
- Return ONLY valid JSON (no markdown, no extra text)
- Grade strictly but encouragingly
- Base your grade on the rubric provided`,
    
    prompt: `Grade this essay and return your response as a JSON object.

QUESTION:
${question}

STUDENT'S ANSWER:
${answer}

GRADING RUBRIC:
${rubric || 'Grade based on: Content accuracy (40%), Organization (30%), Grammar (20%), Analysis (10%)'}

MAX SCORE: ${maxScore}

Return ONLY this JSON structure:
{
  "score": <number 0-${maxScore}>,
  "maxScore": ${maxScore},
  "feedback": "<2-3 sentence overall feedback>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "rubricScores": {
    "content": <score>,
    "organization": <score>,
    "grammar": <score>,
    "analysis": <score>
  }
}`
  }),

  /**
   * Short Answer Grading
   */
  gradeShortAnswer: ({ question, answer, correctAnswer, maxScore = 10 }) => ({
    systemPrompt: 'You are an expert grader for short-answer questions. Grade based on correctness, completeness, and clarity.',
    
    prompt: `Grade this short answer.

QUESTION: ${question}

CORRECT ANSWER: ${correctAnswer}

STUDENT'S ANSWER: ${answer}

Return ONLY this JSON:
{
  "score": <number 0-${maxScore}>,
  "isCorrect": <true/false>,
  "feedback": "<brief explanation>",
  "partialCredit": <true/false>
}`
  }),

  /**
   * AI Detection
   */
  detectAI: ({ answer }) => ({
    systemPrompt: `You are an AI detection expert. Analyze text to determine if it was written by AI or human.

AI INDICATORS:
- Overly formal or perfect grammar
- Lack of personal voice
- Repetitive structures
- Hedging language ("it's worth noting")
- Perfect formatting

HUMAN INDICATORS:
- Natural inconsistencies
- Personal anecdotes
- Typos or grammar mistakes
- Informal language
- Unique style`,
    
    prompt: `Analyze this text for AI generation.

TEXT:
${answer}

Return ONLY this JSON:
{
  "isAIGenerated": <true/false>,
  "confidence": <0.0 to 1.0>,
  "analysis": "<brief explanation>",
  "indicators": {
    "vocabularyComplexity": "<low/moderate/high>",
    "sentenceStructure": "<varied/repetitive/perfect>",
    "writingStyle": "<conversational/formal/academic>",
    "coherence": "<natural/artificial>"
  },
  "verdict": "<likely_ai/likely_human/uncertain>"
}`
  }),

  /**
   * Plagiarism Detection
   */
  detectPlagiarism: ({ answer1, answer2 }) => ({
    systemPrompt: 'You are a plagiarism detection expert. Compare two texts for similarity and copying.',
    
    prompt: `Compare these two answers for plagiarism.

ANSWER 1:
${answer1}

ANSWER 2:
${answer2}

Return ONLY this JSON:
{
  "similarity": <0-100 percentage>,
  "isPlagiarized": <true/false>,
  "matchingPhrases": ["<phrase 1>", "<phrase 2>"],
  "analysis": "<explanation>",
  "verdict": "<original/minor_similarity/significant_similarity/plagiarized>"
}`
  }),

  /**
   * Behavior Analysis
   */
  analyzeBehavior: ({ behaviors }) => ({
    systemPrompt: 'You are a test integrity analyst. Analyze exam-taking behaviors for cheating patterns.',
    
    prompt: `Analyze these exam behaviors for suspicious patterns.

BEHAVIORS:
${JSON.stringify(behaviors, null, 2)}

Return ONLY this JSON:
{
  "riskScore": <0-100>,
  "suspiciousPatterns": ["<pattern 1>", "<pattern 2>"],
  "recommendation": "<no_action/flag_for_review/investigate_further>",
  "analysis": "<explanation>"
}`
  }),

  /**
   * Question Generation
   */
  generateQuestions: ({ topic, difficulty = 'medium', count = 5, questionTypes = ['multiple-choice'] }) => ({
    systemPrompt: `You are an expert educator and test designer.

GUIDELINES:
- Questions should be clear and unambiguous
- Avoid trick questions
- One clearly correct answer
- Plausible but wrong distractors
- Match specified difficulty
- Cover important concepts`,
    
    prompt: `Generate ${count} exam questions.

TOPIC: ${topic}
DIFFICULTY: ${difficulty}
QUESTION TYPES: ${questionTypes.join(', ')}

Return ONLY this JSON array:
{
  "questions": [
    {
      "type": "<multiple-choice|true-false|short-answer|essay>",
      "question": "<question text>",
      "options": [
        {
          "text": "<option text>",
          "value": "<option value>",
          "isCorrect": <true/false>
        }
      ],
      "correctAnswer": "<correct answer>",
      "explanation": "<why this is correct>",
      "difficulty": "${difficulty}",
      "points": <1-10>,
      "topic": "${topic}",
      "bloomsLevel": "<remember|understand|apply|analyze|evaluate|create>"
    }
  ]
}`
  }),

  /**
   * Similar Questions
   */
  generateSimilar: ({ existingQuestion, count = 3 }) => ({
    systemPrompt: 'You are an expert test designer. Create variations of questions that test the same concept.',
    
    prompt: `Create ${count} variations of this question.

ORIGINAL:
${JSON.stringify(existingQuestion, null, 2)}

Requirements:
- Test the same concept
- Different wording or examples
- Same difficulty level
- Same question type

Return JSON array with same structure as original.`
  }),

  /**
   * Improve Question
   */
  improveQuestion: ({ question, feedback }) => ({
    systemPrompt: 'You are an expert test designer. Improve questions based on feedback.',
    
    prompt: `Improve this question.

ORIGINAL:
${JSON.stringify(question, null, 2)}

FEEDBACK:
${feedback}

Return improved question in same JSON format.`
  }),

  /**
   * Explain Answer
   */
  explainAnswer: ({ question, correctAnswer, studentAnswer }) => ({
    systemPrompt: 'You are a helpful tutor. Explain why an answer is correct or incorrect.',
    
    prompt: `Explain this answer.

QUESTION: ${question}

CORRECT ANSWER: ${correctAnswer}

STUDENT'S ANSWER: ${studentAnswer}

Provide a clear explanation suitable for a student.`
  })
};

export default prompts;
