import nodemailer from 'nodemailer';
import logger from '../utils/logger';

// Create a mail transporter (Mailtrap/SMTP/SendGrid)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    logger.warn('Nodemailer SMTP configuration failed. Emails will log to system console instead:', error);
  } else {
    logger.info('Nodemailer SMTP transporter ready.');
  }
});

export default transporter;
