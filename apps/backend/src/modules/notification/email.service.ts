import transporter from '../../config/mail';
import logger from '../../utils/logger';

export class EmailService {
  private fromAddress = process.env.SMTP_FROM || 'noreply@healthcareplatform.com';
  private clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // ----------------------------------------------------
  // EMAIL VERIFICATION SENDER
  // ----------------------------------------------------
  public async sendVerificationEmail(
    toEmail: string,
    name: string,
    verificationToken: string
  ): Promise<void> {
    const verificationUrl = `${this.clientUrl}/verify-email?token=${verificationToken}`;
    const mailOptions = {
      from: `AI Healthcare Platform <${this.fromAddress}>`,
      to: toEmail,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0ea5e9;">Welcome to AI Healthcare Management</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering on our platform. Please confirm your email address by clicking the button below:</p>
          <div style="margin: 24px 0;">
            <a href="${verificationUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #64748b;">${verificationUrl}</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">This is an automated message. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Verification email sent to: ${toEmail}`);
    } catch (error) {
      logger.error(`Failed to send verification email to ${toEmail}:`, error);
      // Fail-safe mock log output during development
      logger.info(`[MOCK EMAIL] Verification Link: ${verificationUrl}`);
    }
  }

  // ----------------------------------------------------
  // OTP EMAIL SENDER
  // ----------------------------------------------------
  public async sendOTPEmail(toEmail: string, name: string, otp: string): Promise<void> {
    const mailOptions = {
      from: `AI Healthcare Platform <${this.fromAddress}>`,
      to: toEmail,
      subject: 'Your Login OTP Verification Code',
      html: `
        <div style="font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0ea5e9;">OTP Security Code</h2>
          <p>Hello ${name},</p>
          <p>You requested a login verification code. Please enter the following 6-digit OTP security code to complete your login:</p>
          <div style="margin: 24px 0; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 16px; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0ea5e9;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This security code is only valid for 10 minutes. Do not share this code with anyone.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">If you did not request this code, please secure your account immediately.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`OTP verification email sent to: ${toEmail}`);
    } catch (error) {
      logger.error(`Failed to send OTP email to ${toEmail}:`, error);
      // Fail-safe mock log output during development
      logger.info(`[MOCK EMAIL] OTP Security Code: ${otp}`);
    }
  }

  // ----------------------------------------------------
  // PASSWORD RESET EMAIL SENDER
  // ----------------------------------------------------
  public async sendPasswordResetEmail(
    toEmail: string,
    name: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${this.clientUrl}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: `AI Healthcare Platform <${this.fromAddress}>`,
      to: toEmail,
      subject: 'Reset Your Password Instructions',
      html: `
        <div style="font-family: 'Inter', sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0ea5e9;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to choose a new password:</p>
          <div style="margin: 24px 0;">
            <a href="${resetUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #64748b;">${resetUrl}</p>
          <p style="color: #64748b; font-size: 14px;">This link is valid for 1 hour. If you did not request a password reset, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">This is a system generated message.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to: ${toEmail}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${toEmail}:`, error);
      // Fail-safe mock log output during development
      logger.info(`[MOCK EMAIL] Password Reset Link: ${resetUrl}`);
    }
  }
}

export default new EmailService();
