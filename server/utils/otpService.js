const nodemailer = require('nodemailer');

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

// Send OTP via Email / SMS or fallback to returning test code when credentials are not set
const sendOtpNotification = async (identifier, rawOtp, isEmail) => {
  const isProduction = process.env.NODE_ENV === 'production';

  console.log(`🔐 OTP CODE GENERATED FOR [${identifier}]: ${rawOtp}`);

  // 1. Email OTP Delivery (via Nodemailer / SendGrid / Gmail SMTP)
  if (isEmail) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"PrepPulse Verification" <${process.env.SMTP_FROM || smtpUser}>`,
          to: identifier,
          subject: `Your PrepPulse Verification Code: ${rawOtp}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #ffffff; border-radius: 10px;">
              <h2 style="color: #3b82f6;">PrepPulse Verification Code</h2>
              <p>Your 6-digit OTP verification code is:</p>
              <div style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #fbbf24; background: #1e293b; padding: 12px; border-radius: 8px; text-align: center; display: inline-block;">
                ${rawOtp}
              </div>
              <p style="margin-top: 15px; color: #94a3b8; font-size: 12px;">This code will expire in 10 minutes.</p>
            </div>
          `,
        });
        console.log(`✉️ Email OTP sent successfully to ${identifier}`);
        return { success: true, mode: 'smtp' };
      } catch (err) {
        console.error(`❌ SMTP delivery error to ${identifier}:`, err.message);
        if (isProduction) {
          throw new Error(`Failed to send Email OTP: ${err.message}`);
        }
      }
    }
  }

  // 2. SMS OTP Delivery via Twilio (with E.164 phone normalization)
  if (!isEmail) {
    const normalizedPhone = normalizePhoneNumber(identifier);
    const twilioSid = process.env.TWILIO_ACCOUNT_SID || process.env.SMS_API_KEY;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const twilio = require('twilio')(twilioSid, twilioToken);
        await twilio.messages.create({
          body: `Your PrepPulse verification code is: ${rawOtp}. Valid for 10 minutes.`,
          from: twilioFrom,
          to: normalizedPhone,
        });
        console.log(`📱 SMS OTP sent successfully to ${normalizedPhone}`);
        return { success: true, mode: 'twilio', normalizedPhone };
      } catch (err) {
        console.error(`❌ Twilio SMS delivery error to ${normalizedPhone}:`, err.message);
        if (isProduction) {
          throw new Error(`Failed to send SMS OTP: ${err.message}`);
        }
      }
    }
  }

  // Fallback for live testing / demo mode when credentials are not configured or failing
  return { success: true, mode: 'demo', rawOtp };
};

module.exports = {
  generateOtpCode,
  normalizePhoneNumber,
  sendOtpNotification,
};
