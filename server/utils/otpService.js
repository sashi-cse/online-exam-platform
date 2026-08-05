const nodemailer = require('nodemailer');

// Generate 6-digit random OTP string
const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Email / SMS or fallback to console in dev mode
const sendOtpNotification = async (identifier, rawOtp, isEmail) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Log to console ONLY in development environment
  if (!isProduction) {
    console.log(`\n======================================================`);
    console.log(`🔐 [DEV MODE ONLY] OTP CODE FOR [${identifier}]: ${rawOtp}`);
    console.log(`======================================================\n`);
  }

  // 1. Email OTP Delivery
  if (isEmail) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"PrepPulse Verification" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: identifier,
          subject: `Your PrepPulse Verification Code: ${rawOtp}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 10px;">
              <h2 style="color: #3b82f6;">PrepPulse Verification Code</h2>
              <p>Your 6-digit OTP verification code is:</p>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #fbbf24; background: #1e293b; padding: 12px; border-radius: 8px; text-align: center; display: inline-block;">
                ${rawOtp}
              </div>
              <p style="margin-top: 15px; color: #94a3b8; font-size: 12px;">This code will expire in 10 minutes. Do not share it with anyone.</p>
            </div>
          `,
        });
        console.log(`✉️ Email OTP sent successfully to ${identifier}`);
        return true;
      } catch (err) {
        if (isProduction) {
          throw new Error(`Email OTP delivery failed: ${err.message}`);
        }
        console.warn(`⚠️ SMTP delivery failed, but OTP logged to console in dev mode.`);
      }
    } else if (isProduction) {
      throw new Error('Email service credentials (SMTP_HOST/SMTP_USER) are not configured on server.');
    }
  }

  // 2. SMS OTP Delivery via Twilio
  if (!isEmail) {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        await twilio.messages.create({
          body: `Your PrepPulse verification code is: ${rawOtp}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: identifier,
        });
        console.log(`📱 SMS OTP sent successfully to ${identifier}`);
        return true;
      } catch (err) {
        if (isProduction) {
          throw new Error(`SMS OTP delivery failed: ${err.message}`);
        }
        console.warn(`⚠️ SMS delivery failed, but OTP logged to console in dev mode.`);
      }
    } else if (isProduction) {
      throw new Error('SMS service credentials (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN) are not configured on server.');
    }
  }

  return true;
};

module.exports = {
  generateOtpCode,
  sendOtpNotification,
};
