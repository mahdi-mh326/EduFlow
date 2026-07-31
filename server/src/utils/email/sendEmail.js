import { BrevoClient } from "@getbrevo/brevo";
import env from "../../config/env.js";
import logger from "../../shared/logger.js";

const brevo = new BrevoClient({ apiKey: env.brevoApiKey });

const sendEmail = async ({ to, subject, html }) => {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: "EduFlow", email: env.emailFrom },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error(`Failed to send email: ${error.message}`);
    throw error;
  }
};

export default sendEmail;
