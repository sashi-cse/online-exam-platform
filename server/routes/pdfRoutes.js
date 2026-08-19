const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Exam = require('../models/Exam');
const { generateTestCode } = require('../models/Exam');
const Question = require('../models/Question');
const { verifyToken, verifyTeacherOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer: store PDF in memory (max 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  },
});

// Helper: Extract text using pdf-parse (supports function & class exports)
async function extractPdfText(buffer) {
  try {
    const pdfModule = require('pdf-parse');
    if (typeof pdfModule === 'function') {
      const data = await pdfModule(buffer);
      return { text: data.text || '', pages: data.numpages || 1 };
    } else if (pdfModule && pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const data = await parser.getText();
      return { text: data.text || '', pages: data.total || 1 };
    }
  } catch (e) {
    console.warn('⚠️ pdf-parse text extraction warning:', e.message);
  }
  return { text: '', pages: 1 };
}

// Gemini AI prompt to parse PDF content into structured questions
const PARSE_PROMPT = `You are an expert exam paper parser. I am providing a question paper PDF document. Your job is to parse it into structured JSON.

RULES:
1. Extract EVERY question found in the document.
2. Each question must have:
   - questionText: The full question text.
   - options: Array of 4 strings corresponding to options A, B, C, D (or 1, 2, 3, 4).
   - correctOption: 0-indexed integer (0 for A, 1 for B, 2 for C, 3 for D).
   - subject: The subject section (e.g. "Physics", "Chemistry", "Botany", "Zoology", "Mathematics", or "General").
   - solution: Explanation if given in the document, otherwise empty string "".
3. If an answer key or detailed solution section is included in the document, use it to accurately populate correctOption and solution for each question.
4. Clean up question numbers from questionText, but preserve mathematical symbols, formulas, and formatting.
5. For options, clean up prefixes like (A), (B), (a), (b) — return only option content strings.

Return ONLY a valid JSON object matching this exact schema (no markdown, no preamble):
{
  "hasAnswerKey": true,
  "suggestedTitle": "A suggested exam title",
  "suggestedSubject": "Primary subject",
  "questions": [
    {
      "questionText": "Question string here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "subject": "Physics",
      "solution": "Solution explanation if available"
    }
  ]
}`;

// Candidate Gemini models to try in sequence for maximum compatibility across regions/API versions
const CANDIDATE_MODELS = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-002',
  'gemini-1.5-pro',
  'gemini-pro',
];

// @route   POST /api/pdf/parse
// @desc    Upload PDF, extract & parse using Gemini AI (with robust multi-model fallback & dual parsing strategies)
router.post('/parse', verifyToken, verifyTeacherOrAdmin, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }

    console.log(`📄 Received PDF: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY in Render environment variables.',
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Extract text via pdf-parse helper
    const { text: extractedText, pages: pageCount } = await extractPdfText(req.file.buffer);
    if (extractedText) {
      console.log(`📝 Extracted ${extractedText.length} chars from PDF (${pageCount} pages)`);
    } else {
      console.log('📦 Text extraction skipped/failed — using direct binary PDF upload to Gemini AI.');
    }

    // Prepare inputs
    const maxChars = 120000;
    const textContent = extractedText && extractedText.length >= 50
      ? (extractedText.length > maxChars ? extractedText.substring(0, maxChars) + '\n\n[TRUNCATED]' : extractedText)
      : null;

    const pdfPart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: 'application/pdf',
      },
    };

    let result = null;
    let lastErr = null;

    // Try candidate models in order until one succeeds
    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`🤖 Trying Gemini model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        if (textContent) {
          result = await model.generateContent([PARSE_PROMPT, textContent]);
        } else {
          result = await model.generateContent([PARSE_PROMPT, pdfPart]);
        }

        if (result && result.response) {
          console.log(`✅ Successfully generated content using Gemini model: ${modelName}`);
          break;
        }
      } catch (mErr) {
        console.warn(`⚠️ Model ${modelName} failed:`, mErr.message);
        lastErr = mErr;
      }
    }

    if (!result || !result.response) {
      console.error('❌ All candidate Gemini models failed. Last error:', lastErr?.message);
      return res.status(500).json({
        success: false,
        message: `Gemini AI API error: ${lastErr?.message || 'Could not connect to Gemini models.'}`,
      });
    }

    const responseText = result.response.text();

    // Parse AI response JSON
    let parsed;
    try {
      let jsonStr = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseErr) {
      console.error('❌ JSON parse error from AI response:', parseErr.message);
      console.error('Raw AI response sample:', responseText.substring(0, 300));
      return res.status(500).json({
        success: false,
        message: 'AI processed the PDF, but output format was invalid. Please retry uploading.',
      });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No multiple-choice questions found in the PDF. Please check that the PDF contains clear MCQ questions.',
      });
    }

    // Validate and clean up questions
    const validQuestions = parsed.questions
      .filter(q => q.questionText && q.options && Array.isArray(q.options) && q.options.length >= 2)
      .map((q, idx) => ({
        questionNumber: idx + 1,
        questionText: String(q.questionText).trim(),
        options: q.options.map(opt => String(opt).trim()),
        correctOption: typeof q.correctOption === 'number' && q.correctOption >= 0 && q.correctOption < q.options.length
          ? q.correctOption
          : 0,
        subject: q.subject || parsed.suggestedSubject || 'General',
        solution: q.solution || '',
      }));

    console.log(`✅ Successfully parsed ${validQuestions.length} questions from PDF`);

    res.json({
      success: true,
      message: `Successfully parsed ${validQuestions.length} questions from your PDF!`,
      data: {
        hasAnswerKey: parsed.hasAnswerKey !== false,
        suggestedTitle: parsed.suggestedTitle || req.file.originalname.replace(/\.pdf$/i, ''),
        suggestedSubject: parsed.suggestedSubject || 'General',
        totalPages: pageCount,
        questions: validQuestions,
      },
    });
  } catch (err) {
    console.error('❌ PDF Parse Handler Error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to process PDF.' });
  }
});

// @route   POST /api/pdf/create-exam
// @desc    Create exam + questions from parsed PDF data
router.post('/create-exam', verifyToken, verifyTeacherOrAdmin, async (req, res) => {
  try {
    const { title, subject, durationMinutes, defaultMarksPerQuestion, defaultNegativeMarks, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Exam title and at least one question are required.',
      });
    }

    let testCode;
    for (let attempt = 0; attempt < 10; attempt++) {
      testCode = generateTestCode();
      const exists = await Exam.findOne({ testCode });
      if (!exists) break;
    }

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

    exam.totalMarks = questions.length * marksPerQ;
    await exam.save();

    console.log(`✅ Exam "${title}" created with ${questions.length} questions (Code: ${testCode})`);

    res.status(201).json({
      success: true,
      message: `Exam created with ${questions.length} questions! Test Code: ${testCode}`,
      exam: {
        ...exam.toObject(),
        questionCount: questions.length,
      },
    });
  } catch (err) {
    console.error('❌ Create Exam Error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to create exam.' });
  }
});

module.exports = router;
