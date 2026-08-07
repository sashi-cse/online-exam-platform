const nodemailer = require('nodemailer');
const https = require('https');

// Generate 6-digit random OTP string
const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Normalize mobile numbers to international E.164 format
const normalizePhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = `+91${cleaned}`; // Default to +91 country code for 10-digit mobile numbers
    } else {
      cleaned = `+${cleaned}`;
    }
  }
  return cleaned;
};

// Helper: Send Email via Resend API
const sendViaResend = (apiKey, from, to, subject, html) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      from: from || 'onboarding@resend.dev',
      to: [to],
      subject,
      html,
    });

    const req = https.request(
      'https://api.resend.com/emails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`Resend API Error (${res.statusCode}): ${body}`));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
};

// Send OTP via Email / SMS
const sendOtpNotification = async (identifier, rawOtp, isEmail) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Email OTP Delivery
  if (isEmail) {
    const resendKey = process.env.RESEND_API_KEY;
    const sendgridKey = process.env.SENDGRID_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;

    const emailSubject = `Your PrepPulse Verification Code: ${rawOtp}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 10px;">
        <h2 style="color: #3b82f6;">PrepPulse Verification Code</h2>
        <p>Your 6-digit OTP verification code is:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #fbbf24; background: #1e293b; padding: 12px; border-radius: 8px; text-align: center; display: inline-block;">
          ${rawOtp}
        </div>
        <p style="margin-top: 15px; color: #94a3b8; font-size: 12px;">This code will expire in 10 minutes. Do not share it with anyone.</p>
      </div>
    `;

    // Resend API
    if (resendKey) {
      try {
        await sendViaResend(resendKey, process.env.SMTP_FROM || process.env.RESEND_FROM, identifier, emailSubject, emailHtml);
        console.log(`✉️ Resend OTP email dispatched successfully to ${identifier}`);
        return { success: true, mode: 'resend' };
      } catch (err) {
        console.error(`❌ Resend email error to ${identifier}:`, err.message);
        throw new Error(`Failed to send email OTP via Resend: ${err.message}`);
      }
    }

    // SMTP (SendGrid / Nodemailer)
    if (smtpHost && smtpUser) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"PrepPulse Verification" <${process.env.SMTP_FROM || smtpUser}>`,
          to: identifier,
          subject: emailSubject,
          html: emailHtml,
        });
        console.log(`✉️ SMTP OTP email dispatched successfully to ${identifier}`);
        return { success: true, mode: 'smtp' };
      } catch (err) {
        console.error(`❌ SMTP delivery error to ${identifier}:`, err.message);
        throw new Error(`Failed to send email OTP via SMTP: ${err.message}`);
      }
    }

    throw new Error('Email service credentials (RESEND_API_KEY or SMTP_HOST/SMTP_USER) are not configured on server.');
  }

  // 2. SMS OTP Delivery via Twilio (E.164 formatted)
  if (!isEmail) {
    const normalizedPhone = normalizePhoneNumber(identifier);
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const twilio = require('twilio')(twilioSid, twilioToken);
        await twilio.messages.create({
          body: `Your PrepPulse verification code is: ${rawOtp}. Valid for 10 minutes.`,
          from: twilioFrom,
          to: normalizedPhone,
        });
        console.log(`📱 SMS OTP sent successfully via Twilio to ${normalizedPhone}`);
        return { success: true, mode: 'twilio', normalizedPhone };
      } catch (err) {
        console.error(`❌ Twilio SMS delivery error to ${normalizedPhone}:`, err.message);
        throw new Error(`Failed to send SMS OTP via Twilio: ${err.message}`);
      }
    }

    throw new Error('SMS service credentials (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_FROM_NUMBER) are not configured on server.');
  }

  return { success: true };
};

module.exports = {
  generateOtpCode,
  normalizePhoneNumber,
  sendOtpNotification,
};
