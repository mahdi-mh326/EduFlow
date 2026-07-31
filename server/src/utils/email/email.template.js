export const emailTemplates = {
  otpVerification: (fullName, otp) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .otp-box { background-color: #fff; padding: 20px; text-align: center; margin: 20px 0; border: 2px solid #4CAF50; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>EduFlow - Email Verification</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName},</p>
              <p>Thank you for registering with EduFlow. Please verify your email address using the OTP below:</p>
              <div class="otp-box">
                <p>Your OTP is:</p>
                <div class="otp-code">${otp}</div>
              </div>
              <p>This OTP will expire in 5 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 EduFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  welcomeEmail: (fullName) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to EduFlow</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName},</p>
              <p>Welcome to EduFlow! Your account has been successfully verified.</p>
              <p>You can now log in and start exploring our platform.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 EduFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  forgotPasswordOtp: (fullName, otp) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .otp-box { background-color: #fff; padding: 20px; text-align: center; margin: 20px 0; border: 2px solid #FF9800; }
            .otp-code { font-size: 32px; font-weight: bold; color: #FF9800; letter-spacing: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
            </div>
            <div class="content">
              <p>Hello ${fullName},</p>
              <p>We received a request to reset your password. Use the OTP below to verify your identity:</p>
              <div class="otp-box">
                <p>Your OTP is:</p>
                <div class="otp-code">${otp}</div>
              </div>
              <p>This OTP will expire in 5 minutes.</p>
              <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 EduFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  },
};
