// OTP service removed - using simple password-based authentication
module.exports = {
  generateOtpCode: () => '',
  sendOtpNotification: async () => {},
  normalizePhoneNumber: (phone) => phone,
};
