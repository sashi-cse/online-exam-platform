# PrepPulse - Full-Stack MERN Online Exam & Test Booklet Platform

PrepPulse is a full-stack **Online Exam / Quiz Platform** built using MongoDB, Express.js, React.js, and Node.js with Tailwind CSS, KaTeX LaTeX math support, tab-switch proctoring, real-time OTP verification, and a NEET/JEE-style printable test booklet export engine.

---

## 🔑 Pre-Seeded Demo Credentials

The backend automatically seeds these standard accounts when first launched:

| Role | Email / Identifier | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@school.com` | `admin123` | Control Panel (`/admin/manage`), Manage Teachers & Students |
| **Teacher** | `teacher@school.com` or `9876543210` | `teacher123` | Exam Repository (`/admin`), Question Builder, Booklet Export |
| **Student** | `student@school.com` or `9123456789` | `student123` | Exam Portal (`/dashboard`), Test Engine, Score Breakdown |

---

## ⚙️ Production Environment Variables (Render Deployment)

Set these environment variables in your deployment dashboard settings (e.g., Render, Railway, or Heroku):

| Variable Name | Required? | Example / Description |
| :--- | :--- | :--- |
| `PORT` | Optional | `5000` (Defaults to 5000) |
| `NODE_ENV` | **Required** | `production` |
| `MONGODB_URI` | **Required** | `mongodb+srv://<user>:<password>@cluster.mongodb.net/online_exam_db` |
| `JWT_SECRET` | **Required** | `your_random_secure_jwt_secret_string_32_chars` |
| `SMTP_HOST` | Optional | `smtp.sendgrid.net` (For Email OTP delivery) |
| `SMTP_PORT` | Optional | `587` |
| `SMTP_USER` | Optional | `apikey` |
| `SMTP_PASS` | Optional | `your_sendgrid_api_key` |
| `TWILIO_ACCOUNT_SID` | Optional | `your_twilio_account_sid` (For SMS OTP delivery) |
| `TWILIO_AUTH_TOKEN` | Optional | `your_twilio_auth_token` |
| `TWILIO_PHONE_NUMBER` | Optional | `+18005550199` |

> ℹ️ *Note*: In local development (`NODE_ENV !== 'production'`), if `MONGODB_URI` is not set, an in-memory MongoDB database starts automatically. In production, `MONGODB_URI` and `JWT_SECRET` are strictly enforced to prevent data loss or security issues.

---

## 🚀 Local Development Setup

1. Install server and client dependencies:
   ```bash
   npm run install:all
   ```

2. Start the application locally:
   ```bash
   # Runs backend (port 5000) & frontend (port 3000) concurrently
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser.
