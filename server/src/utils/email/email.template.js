export const emailTemplates = {
  otpVerification: (fullName, otp) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Verify Your Email</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background-color: #F8FAFC; font-family: 'Inter', Arial, sans-serif; }
            .wrapper { padding: 40px 16px; }
            .card { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,0.08); border: 1px solid #E2E8F0; }
            .header { background: linear-gradient(135deg, #2563EB 0%, #14B8A6 100%); padding: 40px 32px; text-align: center; }
            .header-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 28px; }
            .header h1 { color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
            .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 6px; }
            .body { padding: 36px 32px; }
            .greeting { font-size: 16px; color: #0F172A; font-weight: 600; margin-bottom: 12px; }
            .message { font-size: 14px; color: #475569; line-height: 1.8; margin-bottom: 28px; }
            .otp-container { background: #F8FAFC; border: 2px dashed #2563EB; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px; }
            .otp-label { font-size: 11px; color: #2563EB; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
            .otp-code { font-size: 40px; font-weight: 700; color: #2563EB; letter-spacing: 10px; font-family: 'Courier New', monospace; }
            .otp-expiry { font-size: 12px; color: #94A3B8; margin-top: 12px; }
            .divider { height: 1px; background: #E2E8F0; margin: 24px 0; }
            .warning { background: #FFF7ED; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #92400E; line-height: 1.6; }
            .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center; }
            .footer p { font-size: 12px; color: #94A3B8; line-height: 1.8; }
            .brand { font-weight: 700; color: #2563EB; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="card">
              <div class="header">
                <div class="header-icon">✉️</div>
                <h1>Email Verification</h1>
                <p>Confirm your identity to get started</p>
              </div>
              <div class="body">
                <p class="greeting">Hello, ${fullName} 👋</p>
                <p class="message">
                  Thank you for joining <strong>EduFlow</strong>! To complete your registration, please verify your email address using the OTP code below.
                </p>
                <div class="otp-container">
                  <div class="otp-label">Your Verification Code</div>
                  <div class="otp-code">${otp}</div>
                  <div class="otp-expiry">⏱ This code expires in <strong>5 minutes</strong></div>
                </div>
                <div class="divider"></div>
                <div class="warning">
                  🔒 <strong>Security Notice:</strong> Never share this code with anyone. EduFlow will never ask for your OTP via phone or chat.
                </div>
              </div>
              <div class="footer">
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <p style="margin-top: 12px;">&copy; 2026 <span class="brand">EduFlow</span>. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  welcomeEmail: (fullName) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Welcome to EduFlow</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background-color: #F8FAFC; font-family: 'Inter', Arial, sans-serif; }
            .wrapper { padding: 40px 16px; }
            .card { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,0.08); border: 1px solid #E2E8F0; }
            .header { background: linear-gradient(135deg, #2563EB 0%, #14B8A6 100%); padding: 48px 32px; text-align: center; }
            .header-emoji { font-size: 52px; margin-bottom: 16px; display: block; }
            .header h1 { color: #FFFFFF; font-size: 26px; font-weight: 700; letter-spacing: -0.3px; }
            .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 8px; }
            .body { padding: 36px 32px; }
            .greeting { font-size: 18px; color: #0F172A; font-weight: 700; margin-bottom: 14px; }
            .message { font-size: 14px; color: #475569; line-height: 1.8; margin-bottom: 28px; }
            .features { display: grid; gap: 12px; margin-bottom: 32px; }
            .feature-item { display: flex; align-items: flex-start; gap: 14px; padding: 16px; background: #F8FAFC; border-radius: 10px; border: 1px solid #E2E8F0; }
            .feature-icon { font-size: 22px; flex-shrink: 0; }
            .feature-text h4 { font-size: 14px; font-weight: 600; color: #0F172A; margin-bottom: 4px; }
            .feature-text p { font-size: 13px; color: #64748B; line-height: 1.5; }
            .cta-container { text-align: center; margin-bottom: 8px; }
            .cta-btn { display: inline-block; background: #2563EB; color: #FFFFFF; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; }
            .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center; }
            .footer p { font-size: 12px; color: #94A3B8; line-height: 1.8; }
            .brand { font-weight: 700; color: #2563EB; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="card">
              <div class="header">
                <span class="header-emoji">🎉</span>
                <h1>Welcome to EduFlow!</h1>
                <p>Your account is verified and ready to go</p>
              </div>
              <div class="body">
                <p class="greeting">Congratulations, ${fullName}! 🚀</p>
                <p class="message">
                  Your email has been successfully verified. You're now part of the <strong>EduFlow</strong> community — a place where learning meets opportunity. Here's what you can do next:
                </p>
                <div class="features">
                  <div class="feature-item">
                    <div class="feature-icon">📚</div>
                    <div class="feature-text">
                      <h4>Explore Courses</h4>
                      <p>Browse hundreds of courses across various categories.</p>
                    </div>
                  </div>
                  <div class="feature-item">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-text">
                      <h4>Track Your Progress</h4>
                      <p>Monitor your learning journey with detailed analytics.</p>
                    </div>
                  </div>
                  <div class="feature-item">
                    <div class="feature-icon">🏆</div>
                    <div class="feature-text">
                      <h4>Earn Certificates</h4>
                      <p>Complete courses and earn recognized certificates.</p>
                    </div>
                  </div>
                </div>
                <div class="cta-container">
                  <a href="#" class="cta-btn">Start Learning Now →</a>
                </div>
              </div>
              <div class="footer">
                <p>Need help? Contact us at <a href="mailto:support@eduflow.com" style="color:#2563EB;">support@eduflow.com</a></p>
                <p style="margin-top: 12px;">&copy; 2026 <span class="brand">EduFlow</span>. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  },

  forgotPasswordOtp: (fullName, otp) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
          <title>Reset Your Password</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background-color: #F8FAFC; font-family: 'Inter', Arial, sans-serif; }
            .wrapper { padding: 40px 16px; }
            .card { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15,23,42,0.08); border: 1px solid #E2E8F0; }
            .header { background: linear-gradient(135deg, #F59E0B 0%, #2563EB 100%); padding: 40px 32px; text-align: center; }
            .header-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 28px; }
            .header h1 { color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
            .header p { color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 6px; }
            .body { padding: 36px 32px; }
            .greeting { font-size: 16px; color: #0F172A; font-weight: 600; margin-bottom: 12px; }
            .message { font-size: 14px; color: #475569; line-height: 1.8; margin-bottom: 24px; }
            .steps { margin-bottom: 28px; }
            .step { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid #E2E8F0; }
            .step:last-child { border-bottom: none; }
            .step-num { width: 28px; height: 28px; background: #2563EB; border-radius: 50%; color: #FFFFFF; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .step-text { font-size: 13px; color: #475569; }
            .otp-container { background: #F8FAFC; border: 2px dashed #F59E0B; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px; }
            .otp-label { font-size: 11px; color: #F59E0B; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px; }
            .otp-code { font-size: 40px; font-weight: 700; color: #F59E0B; letter-spacing: 10px; font-family: 'Courier New', monospace; }
            .otp-expiry { font-size: 12px; color: #94A3B8; margin-top: 12px; }
            .divider { height: 1px; background: #E2E8F0; margin: 24px 0; }
            .warning { background: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 8px; padding: 14px 16px; font-size: 13px; color: #991B1B; line-height: 1.6; }
            .footer { background: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center; }
            .footer p { font-size: 12px; color: #94A3B8; line-height: 1.8; }
            .brand { font-weight: 700; color: #2563EB; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="card">
              <div class="header">
                <div class="header-icon">🔐</div>
                <h1>Password Reset Request</h1>
                <p>Use the code below to reset your password</p>
              </div>
              <div class="body">
                <p class="greeting">Hello, ${fullName} 👋</p>
                <p class="message">
                  We received a request to reset the password for your <strong>EduFlow</strong> account. Follow the steps below to complete the process.
                </p>
                <div class="steps">
                  <div class="step">
                    <div class="step-num">1</div>
                    <div class="step-text">Copy the OTP code below</div>
                  </div>
                  <div class="step">
                    <div class="step-num">2</div>
                    <div class="step-text">Enter it on the password reset page</div>
                  </div>
                  <div class="step">
                    <div class="step-num">3</div>
                    <div class="step-text">Set your new strong password</div>
                  </div>
                </div>
                <div class="otp-container">
                  <div class="otp-label">Password Reset Code</div>
                  <div class="otp-code">${otp}</div>
                  <div class="otp-expiry">⏱ This code expires in <strong>5 minutes</strong></div>
                </div>
                <div class="divider"></div>
                <div class="warning">
                  ⚠️ <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                </div>
              </div>
              <div class="footer">
                <p>Need help? Contact us at <a href="mailto:support@eduflow.com" style="color:#2563EB;">support@eduflow.com</a></p>
                <p style="margin-top: 12px;">&copy; 2026 <span class="brand">EduFlow</span>. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  },
};
