# PrepPulse - Full-Stack MERN Online Exam & NEET Test Booklet Platform

PrepPulse is a full-stack **Online Exam / Quiz Platform** built using MongoDB, Express.js, React.js, and Node.js with Tailwind CSS, KaTeX LaTeX math support, tab-switch proctoring, instant synchronous server-side grading, and a printable NEET/JEE test booklet export engine.

---

## 🌟 Core Features

### 1. Teacher / Admin Console
- **Exam Builder**: Create/edit exams with title, duration, test booklet code, and customizable positive (`+4`) and negative (`-1`) marking scheme.
- **LaTeX Question Builder**: Add multiple-choice questions (Physics, Chemistry, Botany, Zoology, General) with live KaTeX LaTeX equation rendering ($v = 3\sqrt{x}$, $\frac{a}{b}$, $\text{CO}_2$).
- **Step-by-Step Worked Solutions**: Store step-by-step solutions for every question, shown to students after test submission.
- **Class Analytics**: View total submissions, class average, highest score, lowest score, pass rate (≥40%), and individual student attempt records with tab-switch warning logs.
- **NEET Printable Test Booklet PDF Engine**: Generate proctor-ready test booklets with cover page, candidate input box, continuous 2-column question layout, answer key grid, and hints & solutions section.

### 2. Student Exam Portal
- **Distraction-Free Exam Engine**: Full-screen prompt on entry, fixed countdown timer, auto-submit when time expires.
- **Tab Visibility / Proctoring**: Warns and logs every browser tab switch or window blur event.
- **Continuous Question Palette**: Navigate between questions, mark for review, filter by subject.
- **Background Auto-Save**: Automatically saves candidate progress every 15 seconds.
- **Instant Server-Side Evaluation**: Immediate synchronous score calculation (+4 for correct, -1 for incorrect, 0 for unattempted) and detailed solution breakdown.

---

## 🔑 Pre-Seeded Credentials

The backend automatically seeds demo accounts on first run:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Teacher / Admin** | `admin@exam.com` | `admin123` |
| **Student** | `student@exam.com` | `student123` |

---

## 🚀 Quick Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (Optional — built-in **`mongodb-memory-server`** automatically triggers if local MongoDB is not running, guaranteeing zero-setup execution!)

### Installation

1. Install root, server, and client dependencies:
```bash
# Install dependencies in server
cd server
npm install

# Install dependencies in client
cd ../client
npm install
```

2. Start the application:
```bash
# Terminal 1: Run Backend Server (Port 5000)
cd server
npm start

# Terminal 2: Run Frontend Client (Port 3000)
cd client
npm run dev
```

3. Open your browser at `http://localhost:3000`. Use the **"One-Click Demo Logins"** on the login page to quickly test as Admin or Student!
