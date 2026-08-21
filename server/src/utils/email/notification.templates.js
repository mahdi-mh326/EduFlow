import { NOTIFICATION_TYPE } from "../../modules/notification/notification.constant.js";

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

const enrollmentConfirmation = (fullName, data) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#059669,#10B981);padding:40px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">Enrollment Successful</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        Congratulations! You have successfully enrolled in the course. We look forward to seeing you in class.
      </p>
    </td>
  </tr>
  ${footer("#059669")}
`);

const paymentSuccess = (fullName, data) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#059669,#10B981);padding:40px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">Payment Successful</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        Your payment of <strong>${data.amount} ${data.currency || "BDT"}</strong> was successful. Thank you for your purchase.
      </p>
      ${data.transactionId ? `<p style="margin:12px 0 0;font-size:13px;color:#64748B;font-family:Arial,sans-serif;">Transaction ID: ${data.transactionId}</p>` : ""}
    </td>
  </tr>
  ${footer("#059669")}
`);

const paymentFailed = (fullName, data) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#DC2626,#EF4444);padding:40px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">Payment Failed</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        Your payment of <strong>${data.amount} ${data.currency || "BDT"}</strong> could not be processed. Please try again or contact support.
      </p>
      ${data.transactionId ? `<p style="margin:12px 0 0;font-size:13px;color:#64748B;font-family:Arial,sans-serif;">Transaction ID: ${data.transactionId}</p>` : ""}
    </td>
  </tr>
  ${footer("#DC2626")}
`);

const newNotice = (fullName, data, message) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#1D4ED8,#2563EB);padding:40px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">New Notice</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        ${message || "A new notice has been published."}
      </p>
    </td>
  </tr>
  ${footer("#2563EB")}
`);

const liveSessionScheduled = (fullName, data) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#0F766E,#0EA5E9);padding:40px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">New Live Class Scheduled</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        A new live class has been scheduled for you. Please check the schedule and join on time.
      </p>
      ${data.scheduledDate ? `<p style="margin:12px 0 0;font-size:13px;color:#64748B;font-family:Arial,sans-serif;">Date: ${new Date(data.scheduledDate).toLocaleDateString()}</p>` : ""}
      ${data.startTime ? `<p style="margin:4px 0 0;font-size:13px;color:#64748B;font-family:Arial,sans-serif;">Start Time: ${data.startTime}</p>` : ""}
    </td>
  </tr>
  ${footer("#0F766E")}
`);

const liveSessionUpdated = (fullName, data) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#D97706,#F59E0B);padding:40px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">Live Class Updated</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        A live class you are enrolled in has been updated. Please review the latest details.
      </p>
    </td>
  </tr>
  ${footer("#D97706")}
`);

const liveSessionCancelled = (fullName, data) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#DC2626,#EF4444);padding:40px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">Live Class Cancelled</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        A live class has been cancelled. We apologize for any inconvenience.
      </p>
    </td>
  </tr>
  ${footer("#DC2626")}
`);

const newAssignment = (fullName, data) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#7C3AED,#A78BFA);padding:40px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">New Assignment</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        A new assignment has been published. Please check the details and submit before the deadline.
      </p>
      ${data.dueDate ? `<p style="margin:12px 0 0;font-size:13px;color:#64748B;font-family:Arial,sans-serif;">Due Date: ${new Date(data.dueDate).toLocaleDateString()}</p>` : ""}
    </td>
  </tr>
  ${footer("#7C3AED")}
`);

const newQuiz = (fullName, data) => wrap(`
  <tr>
    <td style="background:linear-gradient(135deg,#BE185D,#EC4899);padding:40px;text-align:center;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:700;font-family:Arial,sans-serif;">New Quiz</h1>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px;">
      <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0F172A;font-family:Arial,sans-serif;">Hello, ${fullName} &#128075;</p>
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.7;font-family:Arial,sans-serif;">
        A new quiz has been published. Prepare and attempt before the end date.
      </p>
      ${data.startDate ? `<p style="margin:12px 0 0;font-size:13px;color:#64748B;font-family:Arial,sans-serif;">Start Date: ${new Date(data.startDate).toLocaleDateString()}</p>` : ""}
      ${data.endDate ? `<p style="margin:4px 0 0;font-size:13px;color:#64748B;font-family:Arial,sans-serif;">End Date: ${new Date(data.endDate).toLocaleDateString()}</p>` : ""}
    </td>
  </tr>
  ${footer("#BE185D")}
`);

export const notificationEmailTemplates = {
  [NOTIFICATION_TYPE.ENROLLMENT_CREATED]: enrollmentConfirmation,
  [NOTIFICATION_TYPE.PAYMENT_SUCCESS]: paymentSuccess,
  [NOTIFICATION_TYPE.PAYMENT_FAILED]: paymentFailed,
  [NOTIFICATION_TYPE.NOTICE_CREATED]: newNotice,
  [NOTIFICATION_TYPE.LIVE_SESSION_SCHEDULED]: liveSessionScheduled,
  [NOTIFICATION_TYPE.LIVE_SESSION_UPDATED]: liveSessionUpdated,
  [NOTIFICATION_TYPE.LIVE_SESSION_CANCELLED]: liveSessionCancelled,
  [NOTIFICATION_TYPE.ASSIGNMENT_CREATED]: newAssignment,
  [NOTIFICATION_TYPE.QUIZ_CREATED]: newQuiz,
};
