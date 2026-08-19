const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Exam = require('../models/Exam');
const { generateTestCode } = require('../models/Exam');
const Question = require('../models/Question');
const { verifyToken, verifyTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer: store PDF in memory (max 20MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  },
});

// Gemini AI prompt to parse extracted PDF text into structured questions
const PARSE_PROMPT = `You are an expert exam paper parser. I will give you the raw text extracted from a question paper PDF. Your job is to parse it into structured JSON.

RULES:
1. Extract EVERY question found in the text.
2. Each question must have: questionText, options (array of 4 strings), correctOption (0-indexed integer 0-3), subject (if detectable from section headers, otherwise "General"), and solution (empty string if not available).
3. If there is an answer key section at the end, use it to set the correctOption for each question.
4. If no answer key is found, set correctOption to 0 for all questions and set "hasAnswerKey" to false.
5. Clean up the question text - remove question numbers but keep the content. Keep any mathematical notation.
6. For options, remove option labels like (A), (B), (a), (b), 1), 2) etc. Keep only the option content.
7. Try to detect the subject from section headers like "PHYSICS", "CHEMISTRY", "BIOLOGY", "MATHEMATICS" etc.

Return ONLY valid JSON in this exact format (no markdown, no code fences, no explanation):
{
  "hasAnswerKey": true,
  "suggestedTitle": "A suggested exam title based on the content",
  "suggestedSubject": "The primary subject detected",
  "questions": [
    {
      "questionText": "The question text here",
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correctOption": 0,
      "subject": "Physics",
      "solution": ""
    }
  ]
}

Here is the PDF text to parse:

`;

// @route   POST /api/pdf/parse
// @desc    Upload PDF, extract text, parse with Gemini AI into structured questions
router.post('/parse', verifyToken, verifyTeacherOrAdmin, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }

    // Step 1: Extract text from PDF
    console.log(`📄 Parsing PDF: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);
    
    let pdfData;
    try {
      pdfData = await pdfParse(req.file.buffer);
    } catch (pdfErr) {
      return res.status(400).json({
        success: false,
        message: 'Failed to read PDF. The file may be corrupted, password-protected, or image-only (scanned).',
      });
    }

    const extractedText = pdfData.text;
    if (!extractedText || extractedText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract enough text from the PDF. It may be a scanned/image PDF. Please use a text-based PDF.',
      });
    }

    console.log(`📝 Extracted ${extractedText.length} characters from PDF (${pdfData.numpages} pages)`);

    // Step 2: Parse with Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'GEMINI_API_KEY is not configured. Please add it to your environment variables.',
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Truncate text if too long (Gemini has token limits)
    const maxChars = 100000;
    const textToSend = extractedText.length > maxChars
      ? extractedText.substring(0, maxChars) + '\n\n[TEXT TRUNCATED - REMAINING CONTENT NOT INCLUDED]'
      : extractedText;

    console.log('🤖 Sending to Gemini AI for intelligent parsing...');

    const result = await model.generateContent(PARSE_PROMPT + textToSend);
    const responseText = result.response.text();

    // Step 3: Parse AI response JSON
    let parsed;
    try {
      // Try to extract JSON from the response (handle cases where AI wraps in markdown)
      let jsonStr = responseText;
      
      // Remove markdown code fences if present
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseErr) {
      console.error('❌ Failed to parse Gemini AI response:', parseErr.message);
      console.error('Raw response:', responseText.substring(0, 500));
      return res.status(500).json({
        success: false,
        message: 'AI could not parse the PDF content into questions. Try a different PDF or check its format.',
      });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions could be identified in the PDF. Please check the PDF contains properly formatted MCQ questions.',
      });
    }

    // Validate and clean up each question
    const validQuestions = parsed.questions.filter(q => 
      q.questionText && 
      q.options && 
      Array.isArray(q.options) && 
      q.options.length >= 2
    ).map((q, idx) => ({
      questionNumber: idx + 1,
      questionText: q.questionText.trim(),
      options: q.options.map(opt => String(opt).trim()),
      correctOption: typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption < q.options.length 
        ? q.correctOption 
        : 0,
      subject: q.subject || parsed.suggestedSubject || 'General',
      solution: q.solution || '',
    }));

    console.log(`✅ AI parsed ${validQuestions.length} valid questions from PDF`);

    res.json({
      success: true,
      message: `Successfully parsed ${validQuestions.length} questions from your PDF!`,
      data: {
        hasAnswerKey: parsed.hasAnswerKey !== false,
        suggestedTitle: parsed.suggestedTitle || req.file.originalname.replace('.pdf', ''),
        suggestedSubject: parsed.suggestedSubject || 'General',
        totalPages: pdfData.numpages,
        extractedTextLength: extractedText.length,
        questions: validQuestions,
      },
    });
  } catch (err) {
    console.error('❌ PDF Parse Error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to process PDF.' });
  }
});

// @route   POST /api/pdf/create-exam
// @desc    Create exam + all questions from parsed PDF data
router.post('/create-exam', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const { title, subject, durationMinutes, defaultMarksPerQuestion, defaultNegativeMarks, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exam title and at least one question are required.',
      });
    }

    // Generate unique test code
    let testCode;
    for (let attempt = 0; attempt < 10; attempt++) {
      testCode = generateTestCode();
      const exists = await Exam.findOne({ testCode });
      if (!exists) break;
    }

    // Create the exam
    const exam = await Exam.create({
      title,
      subject: subject || 'General',
      durationMinutes: Number(durationMinutes) || 60,
      defaultMarksPerQuestion: Number(defaultMarksPerQuestion) || 4,
      defaultNegativeMarks: Number(defaultNegativeMarks) || 1,
      testCode,
      createdBy: req.user._id,
      isPublished: false,
    });

    // Create all questions
    const marksPerQ = Number(defaultMarksPerQuestion) || 4;
    const negMarks = Number(defaultNegativeMarks) || 1;

    const questionDocs = questions.map((q, idx) => ({
      examId: exam._id,
      questionNumber: idx + 1,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      subject: q.subject || subject || 'General',
      marksForCorrect: marksPerQ,
      negativeMarksForIncorrect: negMarks,
      solution: q.solution || '',
    }));

    await Question.insertMany(questionDocs);

    // Update exam total marks
    exam.totalMarks = questions.length * marksPerQ;
    await exam.save();

    console.log(`✅ Created exam "${title}" with ${questions.length} questions from PDF (Code: ${testCode})`);

    res.status(201).json({
      success: true,
      message: `Exam created with ${questions.length} questions! Test Code: ${testCode}`,
      exam: {
        ...exam.toObject(),
        questionCount: questions.length,
      },
    });
  } catch (err) {
    console.error('❌ Create Exam from PDF Error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to create exam.' });
  }
});

module.exports = router;
