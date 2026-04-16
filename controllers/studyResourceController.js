import asyncHandler from 'express-async-handler';
import StudyResource from '../models/studyResourceModel.js';
import Result from '../models/resultModel.js';
import Exam from '../models/examModel.js';

// Helper: Call Groq API
const callGroq = async (prompt) => {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: 'You are an educational AI assistant. Always respond with valid JSON only. No markdown, no explanation outside JSON.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Groq API error: ${response.status}`);

  const data = await response.json();
  const text = data.choices[0]?.message?.content || '{}';
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};

// Helper: Identify weak areas from results
const getWeakAreas = (results) => {
  const weakAreas = [];

  for (const result of results) {
    const categories = result.analytics?.categoryBreakdown || [];
    for (const cat of categories) {
      if (cat.percentage < 60) {
        weakAreas.push({
          subject: result.exam?.title || 'Unknown',
          topic: cat.category,
          score: cat.percentage,
          examId: result.exam?._id,
          resultId: result._id,
        });
      }
    }
  }

  return weakAreas.sort((a, b) => a.score - b.score);
};

// Helper: Generate practice quiz using Groq
const generatePracticeQuiz = async (subject, topic, difficulty) => {
  const prompt = `Generate a practice quiz for a student studying ${subject}, specifically on the topic "${topic}".
  Difficulty level: ${difficulty}.
  Generate exactly 5 multiple choice questions.
  
  Respond with this exact JSON structure:
  {
    "questions": [
      {
        "question": "question text here",
        "options": [
          { "text": "option A", "isCorrect": false },
          { "text": "option B", "isCorrect": true },
          { "text": "option C", "isCorrect": false },
          { "text": "option D", "isCorrect": false }
        ],
        "correctAnswer": "option B",
        "explanation": "brief explanation of why this is correct",
        "difficulty": "${difficulty}"
      }
    ]
  }`;

  return callGroq(prompt);
};

// Helper: Generate study guide using Groq
const generateStudyGuide = async (subject, topic) => {
  const prompt = `Generate a comprehensive study guide for a student studying ${subject}, specifically on "${topic}".
  
  Respond with this exact JSON structure:
  {
    "summary": "2-3 sentence overview of the topic",
    "keyPoints": [
      "key point 1",
      "key point 2",
      "key point 3",
      "key point 4",
      "key point 5"
    ],
    "detailedExplanation": "detailed paragraph explaining the topic clearly for a student"
  }`;

  return callGroq(prompt);
};

//  Helper: Search real YouTube videos using YouTube Data API
const generateVideoLesson = async (subject, topic) => {
  const query = encodeURIComponent(`${subject} ${topic} tutorial lesson`);
  const apiKey = process.env.YOUTUBE_API_KEY;

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&relevanceLanguage=en&safeSearch=strict&key=${apiKey}`
  );

  if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);

  const data = await response.json();
  const video = data.items?.[0];

  if (!video) throw new Error('No YouTube video found for this topic');

  const videoId = video.id.videoId;
  const snippet = video.snippet;

  return {
    videoTitle: snippet.title,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    videoDuration: 'Watch on YouTube',
    videoDescription: snippet.description || `A video lesson on ${topic} in ${subject}`,
    thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
  };
};

// Helper: Check if cached resources are still valid
const getCachedResources = async (studentId, subject, topic, type) => {
  return await StudyResource.findOne({
    student: studentId,
    subject,
    topic,
    type,
    isActive: true,
    expiresAt: { $gt: new Date() },
  });
};

// @desc    Get AI study suggestions
// @route   GET /api/study-resources/suggestions
// @access  Private (Student)
export const getStudySuggestions = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const recentResults = await Result.find({ student: studentId })
    .populate('exam', 'title')
    .sort({ createdAt: -1 })
    .limit(20); // fetch more so we can deduplicate

  if (!recentResults.length) {
    return res.json({
      success: true,
      message: 'No exam results yet. Take some exams to get personalized suggestions.',
      data: { suggestions: [], hasResults: false },
    });
  }

  //  Keep only the most recent result per exam
  const seenExams = new Set();
  const deduplicated = [];

  for (const result of recentResults) {
    const examId = result.exam?._id?.toString();
    if (examId && !seenExams.has(examId)) {
      seenExams.add(examId);
      deduplicated.push(result);
    }
    if (deduplicated.length === 5) break; // only last 5 unique exams
  }

  const weakAreas = getWeakAreas(deduplicated);

  if (!weakAreas.length) {
    return res.json({
      success: true,
      message: 'Great job! No weak areas detected. Keep it up!',
      data: { suggestions: [], hasResults: true, allPassing: true },
    });
  }

  const suggestions = weakAreas.slice(0, 3).map((area) => ({
    subject: area.subject,
    topic: area.topic,
    score: area.score,
    priority: area.score < 30 ? 'high' : area.score < 50 ? 'medium' : 'low',
    message: `Your score in ${area.topic} was ${area.score}%. We recommend studying this topic.`,
  }));

  res.json({
    success: true,
    data: { suggestions, hasResults: true, totalWeakAreas: weakAreas.length },
  });
});

// @desc    Get all study resources for student
// @route   GET /api/study-resources
// @access  Private (Student)
export const getStudyResources = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const { type, subject } = req.query;

  const filter = {
    student: studentId,
    isActive: true,
    expiresAt: { $gt: new Date() },
  };

  if (type) filter.type = type;
  if (subject) filter.subject = subject;

  const resources = await StudyResource.find(filter).sort({ createdAt: -1 });

  res.json({ success: true, data: resources, count: resources.length });
});

// @desc    Get single study resource
// @route   GET /api/study-resources/:id
// @access  Private (Student)
export const getStudyResource = asyncHandler(async (req, res) => {
  const resource = await StudyResource.findOne({
    _id: req.params.id,
    student: req.user._id,
  });

  if (!resource) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  res.json({ success: true, data: resource });
});

// @desc    Generate a study resource using AI
// @route   POST /api/study-resources/generate
// @access  Private (Student)
export const generateStudyResource = asyncHandler(async (req, res) => {
  const { subject, topic, type, difficulty = 'medium', resultId, examId } = req.body;
  const studentId = req.user._id;

  if (!subject || !topic || !type) {
    return res.status(400).json({ success: false, message: 'Subject, topic and type are required' });
  }

  const cached = await getCachedResources(studentId, subject, topic, type);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  let content = {};

  try {
    if (type === 'practice-quiz' || type === 'past-question') {
      const quiz = await generatePracticeQuiz(subject, topic, difficulty);
      content = { questions: quiz.questions || [] };
    } else if (type === 'study-guide') {
      const guide = await generateStudyGuide(subject, topic);
      content = {
        summary: guide.summary,
        keyPoints: guide.keyPoints,
        detailedExplanation: guide.detailedExplanation,
      };
    } else if (type === 'video-lesson') {
      const video = await generateVideoLesson(subject, topic);
      content = {
        videoTitle: video.videoTitle,
        videoUrl: video.videoUrl,
        videoDuration: video.videoDuration,
        videoDescription: video.videoDescription,
        thumbnailUrl: video.thumbnailUrl,
      };
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate content. Please try again.',
      error: error.message,
    });
  }

  const resource = await StudyResource.create({
    student: studentId,
    subject,
    topic,
    type,
    difficulty,
    content,
    aiSuggestion: {
      reason: `Generated based on your performance in ${subject}`,
      priority: 'medium',
    },
    basedOnExam: examId || null,
    basedOnResult: resultId || null,
  });

  res.status(201).json({ success: true, data: resource, fromCache: false });
});

// @desc    Auto generate resources for student based on weak areas
// @route   POST /api/study-resources/auto-generate
// @access  Private (Student)
export const autoGenerateResources = asyncHandler(async (req, res) => {
  const studentId = req.user._id;

  const recentResults = await Result.find({ student: studentId })
    .populate('exam', 'title subject')
    .sort({ createdAt: -1 })
    .limit(3);

  if (!recentResults.length) {
    return res.status(400).json({
      success: false,
      message: 'No exam results found. Take some exams first.',
    });
  }

  const weakAreas = getWeakAreas(recentResults);

  if (!weakAreas.length) {
    return res.json({
      success: true,
      message: 'No weak areas found. All scores are above 60%.',
      data: [],
    });
  }

  const generated = [];
  const topWeakAreas = weakAreas.slice(0, 2);

  for (const area of topWeakAreas) {
    const difficulty = area.score < 30 ? 'easy' : area.score < 50 ? 'medium' : 'hard';
    const priority = area.score < 30 ? 'high' : area.score < 50 ? 'medium' : 'low';

    //  Generate practice quiz
    const cachedQuiz = await getCachedResources(studentId, area.subject, area.topic, 'practice-quiz');
    if (cachedQuiz) {
      generated.push({ ...cachedQuiz.toObject(), fromCache: true });
    } else {
      try {
        const quiz = await generatePracticeQuiz(area.subject, area.topic, difficulty);
        const resource = await StudyResource.create({
          student: studentId,
          subject: area.subject,
          topic: area.topic,
          type: 'practice-quiz',
          difficulty,
          content: { questions: quiz.questions || [] },
          aiSuggestion: {
            reason: `Your score in ${area.topic} was ${area.score}%. Practice this to improve.`,
            weakAreaScore: area.score,
            priority,
          },
          basedOnExam: area.examId,
          basedOnResult: area.resultId,
        });
        generated.push({ ...resource.toObject(), fromCache: false });
      } catch (error) {
        console.error(`Failed to generate quiz for ${area.topic}:`, error.message);
      }
    }

    //  Generate real YouTube video lesson
    const cachedVideo = await getCachedResources(studentId, area.subject, area.topic, 'video-lesson');
    if (cachedVideo) {
      generated.push({ ...cachedVideo.toObject(), fromCache: true });
    } else {
      try {
        const video = await generateVideoLesson(area.subject, area.topic);
        const resource = await StudyResource.create({
          student: studentId,
          subject: area.subject,
          topic: area.topic,
          type: 'video-lesson',
          difficulty,
          content: {
            videoTitle: video.videoTitle,
            videoUrl: video.videoUrl,
            videoDuration: video.videoDuration,
            videoDescription: video.videoDescription,
            thumbnailUrl: video.thumbnailUrl,
          },
          aiSuggestion: {
            reason: `Watch this to improve your understanding of ${area.topic}`,
            weakAreaScore: area.score,
            priority,
          },
          basedOnExam: area.examId,
          basedOnResult: area.resultId,
        });
        generated.push({ ...resource.toObject(), fromCache: false });
      } catch (error) {
        console.error(`Failed to generate video for ${area.topic}:`, error.message);
      }
    }
  }

  res.json({
    success: true,
    message: `Generated ${generated.length} study resources based on your weak areas`,
    data: generated,
  });
});

// @desc    Delete a study resource
// @route   DELETE /api/study-resources/:id
// @access  Private (Student)
export const deleteStudyResource = asyncHandler(async (req, res) => {
  const resource = await StudyResource.findOne({
    _id: req.params.id,
    student: req.user._id,
  });

  if (!resource) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  resource.isActive = false;
  await resource.save();

  res.json({ success: true, message: 'Resource deleted successfully' });
});