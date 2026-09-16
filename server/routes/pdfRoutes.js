const express = require('express');
const multer = require('multer');
const https = require('https');
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

// Helper 1: Extract text using pdf-parse (supports function & class exports)
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

// Helper: Universal normalize correct option (maps 'A','B','C','D', '(A)', 1, '1', 0, etc. to 0-3 index)
function normalizeCorrectOption(val, options = []) {
  if (val === undefined || val === null) return 0;

  // 1. Direct number check
  if (typeof val === 'number') {
    if (val >= 0 && val <= 3) return val;
    if (val >= 1 && val <= 4) return val - 1; // 1-indexed number
  }

  const str = String(val).trim();

  // 2. Direct letter match: A, B, C, D or (A), (B), (C), (D) or Option A or Opt B
  const letterMatch = str.match(/(?:Option|Opt)?\s*\(?([A-D])\)?/i);
  if (letterMatch) {
    const l = letterMatch[1].toUpperCase();
    return l === 'A' ? 0 : l === 'B' ? 1 : l === 'C' ? 2 : 3;
  }

  // 3. String digits 0-3 (0-indexed)
  if (/^[0-3]$/.test(str)) return parseInt(str, 10);
  // 4. String digits 1-4 (1-indexed)
  if (/^[1-4]$/.test(str)) return parseInt(str, 10) - 1;

  // 5. Match text against options array if provided
  if (Array.isArray(options) && options.length > 0) {
    const cleanedStr = str.toLowerCase();
    for (let i = 0; i < options.length; i++) {
      if (options[i] && (options[i].toLowerCase() === cleanedStr || options[i].toLowerCase().includes(cleanedStr))) {
        return i;
      }
    }
  }

  return 0;
}

// Helper: Extract Document-Level Answer Key Map (e.g., "1. B  2. C  3. A" or "116. A 117. B" or "1. (B)")
function extractAnswerKeyMap(text) {
  const map = {};
  if (!text) return map;

  const patterns = [
    /(?:^|\s)(?:Q\.?)?(\d{1,3})[\.\)\:\-]?\s*\(?([A-D])\)?(?=\s|\n|,|\;|$)/gi,
    /(?:^|\s)(?:Q\.?)?(\d{1,3})[\.\)\:\-]?\s*\(?([1-4])\)?(?=\s|\n|,|\;|$)/gi
  ];

  for (const regex of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const qNum = parseInt(match[1]);
      const rawVal = match[2];
      const idx = normalizeCorrectOption(rawVal);
      if (qNum > 0 && qNum <= 300) {
        if (map[qNum] === undefined || /[A-D]/i.test(rawVal)) {
          map[qNum] = idx;
        }
      }
    }
  }
  return map;
}

// Helper 2: Fast & 100% Reliable Regex Question Parser (No API Key Required!)
function parseQuestionsWithRegex(text) {
  if (!text || text.length < 50) return { questions: [], hasAnswerKey: false };

  // Normalize line breaks
  const normalized = text.replace(/\r\n/g, '\n');

  // Extract document-wide answer key map if present at end or section of PDF
  const docAnswerKeyMap = extractAnswerKeyMap(normalized);

  const blocks = normalized.split(/\n(?=\d+[\.\)]\s+)/);
  const questions = [];
  let foundAnyAnswerKey = Object.keys(docAnswerKeyMap).length > 0;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Match question number and text
    const qMatch = trimmed.match(/^(\d+)[\.\)]\s+([\s\S]+?)(?=(?:\([A-D]\)|[A-D][\.\)]|\nAnswer:|\nAns:|$))/i);
    if (!qMatch) continue;

    const qNum = parseInt(qMatch[1]);
    const qText = qMatch[2].trim();

    // Match options (A), (B), (C), (D) or A), B), C), D)
    const optA = trimmed.match(/(?:\(A\)|A[\.\)])\s*([\s\S]+?)(?=(?:\(B\)|B[\.\)]|\(C\)|C[\.\)]|\(D\)|D[\.\)]|\nAnswer:|\nAns:|$))/i);
    const optB = trimmed.match(/(?:\(B\)|B[\.\)])\s*([\s\S]+?)(?=(?:\(C\)|C[\.\)]|\(D\)|D[\.\)]|\nAnswer:|\nAns:|$))/i);
    const optC = trimmed.match(/(?:\(C\)|C[\.\)])\s*([\s\S]+?)(?=(?:\(D\)|D[\.\)]|\nAnswer:|\nAns:|$))/i);
    const optD = trimmed.match(/(?:\(D\)|D[\.\)])\s*([\s\S]+?)(?=(?:\nAnswer:|\nAns:|\nNCERT|\nTopic:|\n\d+[\.\)]|$))/i);

    if (optA && optB && optC && optD) {
      let correctOpt = 0;

      // Check inline answer pattern in block
      const inlineAns = trimmed.match(/(?:Answer|Ans|Correct|Option)[\s\:\-\=]*\(?([A-D1-4])\)?/i);
      if (inlineAns) {
        correctOpt = normalizeCorrectOption(inlineAns[1]);
        foundAnyAnswerKey = true;
      } else if (docAnswerKeyMap[qNum] !== undefined) {
        correctOpt = docAnswerKeyMap[qNum];
      }

      let solution = '';
      const solMatch = trimmed.match(/(?:Answer|Ans):\s*\(?[A-D1-4]\)?\s*[^\n]*\n([\s\S]+?)(?=\nNCERT|\nTopic:|\n\d+[\.\)]|$)/i);
      if (solMatch) {
        solution = solMatch[1].trim();
      }

      // Infer subject section
      let subject = 'General';
      if (normalized.includes('PHYSICS') && qNum <= 45) subject = 'Physics';
      else if (normalized.includes('CHEMISTRY') && qNum > 45 && qNum <= 90) subject = 'Chemistry';
      else if (normalized.includes('BOTANY') && qNum > 90 && qNum <= 135) subject = 'Botany';
      else if (normalized.includes('ZOOLOGY') && qNum > 135) subject = 'Zoology';

      questions.push({
        questionNumber: qNum,
        questionText: qText,
        options: [optA[1].trim(), optB[1].trim(), optC[1].trim(), optD[1].trim()],
        correctOption: correctOpt,
        subject,
        solution,
      });
    }
  }

  return { questions, hasAnswerKey: foundAnyAnswerKey };
}

// Helper 3: Direct REST API call to Google Gemini (Bypasses SDK version issues)
function callGeminiApiRest(apiKey, prompt, payload) {
  return new Promise((resolve, reject) => {
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-pro'];

    let modelIndex = 0;

    function tryNextModel() {
      if (modelIndex >= models.length) {
        return reject(new Error('All Gemini API models failed. Please check GEMINI_API_KEY.'));
      }

      const currentModel = models[modelIndex++];
      console.log(`🤖 Attempting REST call to Gemini model: ${currentModel}...`);

      const postData = JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              ...(payload.text ? [{ text: payload.text }] : []),
              ...(payload.inlineData ? [{ inline_data: payload.inlineData }] : []),
            ],
          },
        ],
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (res.statusCode === 200 && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
              console.log(`✅ Gemini REST API succeeded with model: ${currentModel}`);
              resolve(data.candidates[0].content.parts[0].text);
            } else {
              console.warn(`⚠️ Model ${currentModel} returned status ${res.statusCode}:`, data.error?.message || body.substring(0, 200));
              tryNextModel();
            }
          } catch (e) {
            tryNextModel();
          }
        });
      });

      req.on('error', (err) => {
        console.warn(`⚠️ Network error with ${currentModel}:`, err.message);
        tryNextModel();
      });

      req.write(postData);
      req.end();
    }

    tryNextModel();
  });
}

// Gemini AI prompt
const PARSE_PROMPT = `You are an expert exam paper parser. Parse the provided document into structured JSON.
RULES:
1. Extract EVERY question found in the document.
2. Each question must have:
   - questionText: String
   - options: Array of 4 strings [A, B, C, D]
   - correctOption: 0-indexed integer (0 for A, 1 for B, 2 for C, 3 for D). IMPORTANT: Carefully extract the correct answer key from the document for each question (0=A, 1=B, 2=C, 3=D). Do NOT default all to 0!
   - subject: Subject string (e.g. Physics, Chemistry, Botany, Zoology, General)
   - solution: Explanation string if available, otherwise ""
3. Return ONLY a valid JSON object matching this exact format:
{
  "hasAnswerKey": true,
  "suggestedTitle": "Exam Title",
  "suggestedSubject": "Physics & Chemistry",
  "questions": [
    {
      "questionText": "Question string",
      "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
      "correctOption": 0,
      "subject": "Physics",
      "solution": ""
    }
  ]
}`;

// @route   POST /api/pdf/parse
// @desc    Upload PDF, parse using 3-tier strategy (Regex Parser + Direct Gemini REST API + AI fallback)
router.post('/parse', verifyToken, verifyTeacherOrAdmin, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }

    console.log(`📄 Received PDF: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    // Tier 1: Extract text with pdf-parse
    const { text: extractedText, pages: pageCount } = await extractPdfText(req.file.buffer);

    // Tier 2: Try 100% reliable local Regex Question Parser first
    if (extractedText && extractedText.length > 100) {
      const { questions: regexQuestions, hasAnswerKey } = parseQuestionsWithRegex(extractedText);
      if (regexQuestions && regexQuestions.length >= 3) {
        console.log(`⚡ Instant Regex Parser extracted ${regexQuestions.length} questions from PDF! (Has Answer Key: ${hasAnswerKey})`);
        return res.json({
          success: true,
          message: `Successfully parsed ${regexQuestions.length} questions from your PDF!`,
          data: {
            hasAnswerKey,
            suggestedTitle: req.file.originalname.replace(/\.pdf$/i, '').replace(/_/g, ' '),
            suggestedSubject: regexQuestions[0]?.subject || 'General',
            totalPages: pageCount,
            questions: regexQuestions,
          },
        });
      }
    }

    // Tier 3: Call Gemini AI via direct REST API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Could not automatically parse PDF layout. Please configure GEMINI_API_KEY in Render environment variables for AI document parsing.',
      });
    }

    console.log('🤖 Invoking Gemini AI REST parser...');

    const maxChars = 100000;
    const payload = extractedText && extractedText.length >= 50
      ? { text: extractedText.length > maxChars ? extractedText.substring(0, maxChars) : extractedText }
      : { inlineData: { mime_type: 'application/pdf', data: req.file.buffer.toString('base64') } };

    const aiResponseText = await callGeminiApiRest(apiKey, PARSE_PROMPT, payload);

    let parsed;
    try {
      let jsonStr = aiResponseText;
      const jsonMatch = aiResponseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseErr) {
      return res.status(500).json({
        success: false,
        message: 'AI processed the PDF but could not format the output. Please check the PDF format.',
      });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No multiple-choice questions found in the PDF.',
      });
    }

    const validQuestions = parsed.questions
      .filter(q => q.questionText && q.options && Array.isArray(q.options) && q.options.length >= 2)
      .map((q, idx) => {
        const rawAns = q.correctOption !== undefined ? q.correctOption : q.correctAnswer || q.answer;
        const normOpt = normalizeCorrectOption(rawAns, q.options);
        return {
          questionNumber: idx + 1,
          questionText: String(q.questionText).trim(),
          options: q.options.map(opt => String(opt).trim()),
          correctOption: normOpt,
          subject: q.subject || parsed.suggestedSubject || 'General',
          solution: q.solution || '',
        };
      });

    console.log(`✅ AI successfully parsed ${validQuestions.length} questions from PDF`);

    const hasAnswerKey = parsed.hasAnswerKey !== false && (validQuestions.some(q => q.correctOption > 0) || validQuestions.length < 5);

    res.json({
      success: true,
      message: `Successfully parsed ${validQuestions.length} questions from your PDF!`,
      data: {
        hasAnswerKey,
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
