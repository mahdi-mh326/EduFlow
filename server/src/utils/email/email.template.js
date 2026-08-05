const BASE_URL = "https://app.eduflow.com/login";
const SUPPORT_EMAIL = "support@eduflow.com";
const YEAR = new Date().getFullYear();

const footer = (accentColor = "#2563EB") => `
  <tr>
    <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 40px;text-align:center;">
      <p style="margin:0 0 4px;font-size:20px;font-weight:800;letter-spacing:-0.5px;color:${accentColor};font-family:Arial,sans-serif;">EduFlow</p>
      <p style="margin:0 0 4px;font-size:12px;color:#94A3B8;font-family:Arial,sans-serif;">Questions? <a href="mailto:${SUPPORT_EMAIL}" style="color:${accentColor};text-decoration:none;">${SUPPORT_EMAIL}</a></p>
      <p style="margin:0;font-size:12px;color:#CBD5E1;font-family:Arial,sans-serif;">&copy; ${YEAR} EduFlow. All rights reserved.</p>
    </td>
  </tr>`;

const credRow = (label, value) => `
  <tr>
    <td style="padding:12px 24px;border-bottom:1px solid #F1F5F9;">
      <p style="margin:0 0 2px;font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.8px;font-family:Arial,sans-serif;">${label}</p>
      <p style="margin:0;font-size:14px;font-weight:700;color:#0F172A;font-family:'Courier New',Courier,monospace;word-break:break-all;">${value}</p>
    </td>
  </tr>`;

const ctaButton = (label, color) => `
  <tr>
    <td style="padding:8px 40px 32px;text-align:center;">
      <a href="${BASE_URL}" style="display:inline-block;background:${color};color:#FFFFFF;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;font-family:Arial,sans-serif;">${label}</a>
      <p style="margin:10px 0 0;font-size:12px;color:#94A3B8;font-family:Arial,sans-serif;">${BASE_URL}</p>
    </td>
  </tr>`;

const securityNotice = () => `
  <tr>
    <td style="padding:0 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-left:4px solid #F97316;border-radius:8px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#9A3412;font-family:Arial,sans-serif;">&#128274; Security Notice</p>
          <p style="margin:0 0 4px;font-size:13px;color:#92400E;font-family:Arial,sans-serif;">&#8226; This is a <strong>temporary password</strong> &mdash; change it on first login.</p>
          <p style="margin:0 0 4px;font-size:13px;color:#92400E;font-family:Arial,sans-serif;">&#8226; Never share your credentials with anyone, including EduFlow staff.</p>
          <p style="margin:0;font-size:13px;color:#92400E;font-family:Arial,sans-serif;">&#8226; EduFlow will <strong>never</strong> ask for your password via email or phone.</p>
        </td></tr>
      </table>
    </td>
  </tr>`;

const wrap = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
</head>
<body style="margin:0;padding:0;background:#F1F5F9;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
          ${content}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/* ============================================================
   1. OTP VERIFICATION  —  Blue
============================================================ */
const otpVerification = (fullName, otp) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#1D4ED8,#2563EB);padding:40px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:28px;">&#9993;</div>
      <h1 style="margin:0 0 6px;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">Verify Your Email</h1>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;font-family:Arial,sans-serif;">Enter the code below to confirm your identity</p>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px 8px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        Thank you for joining <strong>EduFlow</strong>. Use the verification code below to confirm your email address.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFF6FF;border:2px dashed #2563EB;border-radius:12px;">
        <tr>
          <td style="padding:28px;text-align:center;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">Your Verification Code</p>
            <p style="margin:0 0 10px;font-size:42px;font-weight:700;color:#1D4ED8;letter-spacing:12px;font-family:'Courier New',Courier,monospace;">${otp}</p>
            <p style="margin:0;font-size:12px;color:#64748B;font-family:Arial,sans-serif;">&#9201; Expires in <strong>5 minutes</strong></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:6px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#92400E;font-family:Arial,sans-serif;">&#128274; <strong>Security:</strong> Never share this code. EduFlow will never ask for your OTP via phone or chat.</p>
        </td></tr>
      </table>
    </td>
  </tr>
  ${footer("#2563EB")}
`);

/* ============================================================
   2. WELCOME EMAIL (Student)  —  Green
============================================================ */
const welcomeEmail = (fullName) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#059669,#10B981);padding:44px 40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:14px;">&#127881;</div>
      <h1 style="margin:0 0 6px;color:#FFFFFF;font-size:24px;font-weight:700;font-family:Arial,sans-serif;">Welcome to EduFlow!</h1>
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;font-family:Arial,sans-serif;">Your account is verified and ready to go</p>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px 8px;">
      <p style="margin:0 0 8px;font-size:17px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Congratulations, ${fullName}! &#127881;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        Your email has been verified. You are now part of the <strong>EduFlow</strong> community &mdash; a place where learning meets opportunity.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 40px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px 18px;margin-bottom:10px;">
            <p style="margin:0 0 4px;font-size:15px;">&#128218; <strong style="color:#0F172A;font-family:Arial,sans-serif;">Explore Courses</strong></p>
            <p style="margin:0;font-size:13px;color:#475569;font-family:Arial,sans-serif;">Browse courses across various categories and start learning today.</p>
          </td>
        </tr>
        <tr><td style="height:10px;"></td></tr>
        <tr>
          <td style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px 18px;">
            <p style="margin:0 0 4px;font-size:15px;">&#127942; <strong style="color:#0F172A;font-family:Arial,sans-serif;">Earn Certificates</strong></p>
            <p style="margin:0;font-size:13px;color:#475569;font-family:Arial,sans-serif;">Complete courses and earn recognized certificates to boost your career.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ${ctaButton("Start Learning Now &rarr;", "#059669")}
  ${footer("#059669")}
`);

/* ============================================================
    3. TEACHER WELCOME  —  Blue/Teal
 ============================================================ */
 const teacherWelcome = (fullName, employeeId, email, temporaryPassword) => wrap(`
   <tr>
     <td style="background:linear-gradient(135deg,#0F766E,#0EA5E9);padding:40px;text-align:center;">
       <p style="margin:0 0 14px;display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:100px;padding:5px 16px;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:1.2px;text-transform:uppercase;font-family:Arial,sans-serif;">&#127979; EduFlow Faculty</p>
       <div style="width:72px;height:72px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);border-radius:50%;margin:0 auto 16px;line-height:72px;font-size:32px;">&#127891;</div>
       <h1 style="margin:0 0 6px;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">Welcome, ${fullName}!</h1>
       <p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;font-family:Arial,sans-serif;">Your teacher account is ready</p>
     </td>
   </tr>
   <tr>
     <td style="padding:32px 40px 8px;">
       <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
       <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
         You have been added to the <strong>EduFlow</strong> teaching faculty. Below are your login credentials &mdash; please log in and change your password immediately.
       </p>
     </td>
   </tr>
   <tr>
     <td style="padding:20px 40px 8px;">
       <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Login Credentials</p>
       <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
         <tr><td style="background:linear-gradient(90deg,#0F766E,#0EA5E9);padding:12px 20px;">
           <p style="margin:0;font-size:13px;font-weight:600;color:#FFFFFF;font-family:Arial,sans-serif;">&#128274; Secure Account Details</p>
         </td></tr>
         ${credRow("Employee ID", employeeId)}
         ${credRow("Login Email", email)}
         ${credRow("Temporary Password", temporaryPassword)}
       </table>
     </td>
   </tr>
   ${ctaButton("Log In to EduFlow &rarr;", "#0F766E")}
   ${securityNotice()}
   ${footer("#0F766E")}
 `);

/* ============================================================
    3b. TEACHER INVITATION  —  Blue/Teal with OTP
 ============================================================ */
 const teacherInvitation = (fullName, employeeId, email, temporaryPassword, otp) => wrap(`
   <tr>
     <td style="background:linear-gradient(135deg,#0F766E,#0EA5E9);padding:40px;text-align:center;">
       <p style="margin:0 0 14px;display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:100px;padding:5px 16px;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:1.2px;text-transform:uppercase;font-family:Arial,sans-serif;">&#127979; EduFlow Faculty</p>
       <div style="width:72px;height:72px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);border-radius:50%;margin:0 auto 16px;line-height:72px;font-size:32px;">&#127973;</div>
       <h1 style="margin:0 0 6px;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">Welcome, ${fullName}!</h1>
       <p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;font-family:Arial,sans-serif;">You have been invited to EduFlow</p>
     </td>
   </tr>
   <tr>
     <td style="padding:32px 40px 8px;">
       <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
       <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
         An administrator has invited you to join the <strong>EduFlow</strong> teaching faculty. Use the credentials below to log in and verify your email address.
       </p>
     </td>
   </tr>
   <tr>
     <td style="padding:20px 40px 8px;">
       <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Login Credentials</p>
       <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
         <tr><td style="background:linear-gradient(90deg,#0F766E,#0EA5E9);padding:12px 20px;">
           <p style="margin:0;font-size:13px;font-weight:600;color:#FFFFFF;font-family:Arial,sans-serif;">&#128274; Secure Account Details</p>
         </td></tr>
         ${credRow("Employee ID", employeeId)}
         ${credRow("Login Email", email)}
         ${credRow("Temporary Password", temporaryPassword)}
       </table>
     </td>
   </tr>
   <tr>
     <td style="padding:20px 40px 8px;">
       <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Email Verification</p>
       <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFF6FF;border:2px dashed #2563EB;border-radius:10px;overflow:hidden;">
         <tr><td style="background:linear-gradient(90deg,#2563EB,#1D4ED8);padding:12px 20px;">
           <p style="margin:0;font-size:13px;font-weight:600;color:#FFFFFF;font-family:Arial,sans-serif;">&#128274; Your Verification Code</p>
         </td></tr>
         ${credRow("Verification OTP", otp)}
       </table>
     </td>
   </tr>
   <tr>
     <td style="padding:0 40px 32px;">
       <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:6px;">
         <tr><td style="padding:14px 16px;">
           <p style="margin:0;font-size:13px;color:#92400E;font-family:Arial,sans-serif;">&#128274; <strong>Next Steps:</strong> Log in with the temporary password above, then enter the OTP to verify your email. You will be prompted to change your password on first login.</p>
         </td></tr>
       </table>
     </td>
   </tr>
   ${ctaButton("Log In to EduFlow &rarr;", "#0F766E")}
   ${securityNotice()}
   ${footer("#0F766E")}
 `);

/* ============================================================
   4. ADMIN WELCOME  —  Purple/Indigo
============================================================ */
const adminWelcome = (fullName, email, temporaryPassword) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#6D28D9,#4F46E5);padding:40px;text-align:center;">
      <p style="margin:0 0 14px;display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:100px;padding:5px 16px;font-size:11px;font-weight:700;color:#FFFFFF;letter-spacing:1.2px;text-transform:uppercase;font-family:Arial,sans-serif;">&#9881; EduFlow Administration</p>
      <div style="width:72px;height:72px;background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.25);border-radius:50%;margin:0 auto 16px;line-height:72px;font-size:32px;">&#128737;</div>
      <h1 style="margin:0 0 6px;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">Welcome, ${fullName}!</h1>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:14px;font-family:Arial,sans-serif;">Your admin account is ready</p>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px 8px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        You have been granted <strong>Administrator</strong> access on <strong>EduFlow</strong>. Your account was created by the Super Admin. Use the credentials below to log in.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 40px 8px;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1.2px;font-family:Arial,sans-serif;">Login Credentials</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
        <tr><td style="background:linear-gradient(90deg,#6D28D9,#4F46E5);padding:12px 20px;">
          <p style="margin:0;font-size:13px;font-weight:600;color:#FFFFFF;font-family:Arial,sans-serif;">&#128274; Secure Account Details</p>
        </td></tr>
        ${credRow("Login Email", email)}
        ${credRow("Temporary Password", temporaryPassword)}
      </table>
    </td>
  </tr>
  ${ctaButton("Log In to EduFlow &rarr;", "#6D28D9")}
  ${securityNotice()}
  ${footer("#6D28D9")}
`);

/* ============================================================
   5. FORGOT PASSWORD OTP  —  Amber/Orange
============================================================ */
const forgotPasswordOtp = (fullName, otp) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#D97706,#F59E0B);padding:40px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;margin:0 auto 16px;line-height:64px;font-size:28px;">&#128272;</div>
      <h1 style="margin:0 0 6px;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">Password Reset</h1>
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;font-family:Arial,sans-serif;">Use the code below to reset your password</p>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px 8px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        We received a request to reset your <strong>EduFlow</strong> password. Enter the code below on the reset page.
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFBEB;border:2px dashed #F59E0B;border-radius:12px;">
        <tr>
          <td style="padding:28px;text-align:center;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#D97706;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,sans-serif;">Password Reset Code</p>
            <p style="margin:0 0 10px;font-size:42px;font-weight:700;color:#D97706;letter-spacing:12px;font-family:'Courier New',Courier,monospace;">${otp}</p>
            <p style="margin:0;font-size:12px;color:#64748B;font-family:Arial,sans-serif;">&#9201; Expires in <strong>5 minutes</strong></p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FEF2F2;border-left:4px solid #EF4444;border-radius:6px;">
        <tr><td style="padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:#991B1B;font-family:Arial,sans-serif;">&#9888; <strong>Didn&rsquo;t request this?</strong> Ignore this email &mdash; your password will remain unchanged.</p>
        </td></tr>
      </table>
    </td>
  </tr>
  ${footer("#D97706")}
`);

export const emailTemplates = {
  otpVerification,
  welcomeEmail,
  teacherWelcome,
  adminWelcome,
  forgotPasswordOtp,
};
