const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `"LearnHub" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Welcome email template
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to LearnHub!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center;">Welcome to LearnHub!</h1>
        <p>Hi ${user.name},</p>
        <p>Thank you for joining LearnHub! We're excited to have you as part of our learning community.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Browse our course catalog</li>
          <li>Complete your profile</li>
          <li>Start learning with your first course</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/courses"
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Browse Courses
          </a>
        </div>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Happy learning!</p>
        <p>The LearnHub Team</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Course enrollment confirmation
  async sendEnrollmentConfirmation(user, course) {
    const subject = `You're enrolled in ${course.title}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center;">Enrollment Confirmed!</h1>
        <p>Hi ${user.name},</p>
        <p>You have successfully enrolled in <strong>${course.title}</strong>.</p>
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${course.title}</h3>
          <p style="color: #6b7280; margin: 0;">${course.description}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/learn/${course._id}"
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Start Learning
          </a>
        </div>
        <p>You can access your course anytime from your dashboard.</p>
        <p>Happy learning!</p>
        <p>The LearnHub Team</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Course completion certificate
  async sendCertificate(user, course) {
    const subject = `Congratulations! You completed ${course.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a; text-align: center;">🎉 Congratulations!</h1>
        <p>Hi ${user.name},</p>
        <p>You have successfully completed <strong>${course.title}</strong>!</p>
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h2 style="margin: 0;">Certificate of Completion</h2>
          <p style="margin: 10px 0 0 0;">This certifies that</p>
          <h3 style="margin: 10px 0; font-size: 24px;">${user.name}</h3>
          <p style="margin: 0;">has successfully completed</p>
          <h3 style="margin: 10px 0; font-size: 20px;">${course.title}</h3>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Date: ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/certificates"
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Certificate
          </a>
        </div>
        <p>Share your achievement with your network and continue your learning journey!</p>
        <p>The LearnHub Team</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Password reset email
  async sendPasswordReset(user, resetToken) {
    const subject = 'Reset Your LearnHub Password';
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center;">Password Reset Request</h1>
        <p>Hi ${user.name},</p>
        <p>You requested to reset your password for your LearnHub account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>The LearnHub Team</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Instructor course approval
  async sendCourseApproval(instructor, course, status) {
    const subject = `Course ${status}: ${course.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${status === 'approved' ? '#16a34a' : '#dc2626'}; text-align: center;">
          Course ${status.charAt(0).toUpperCase() + status.slice(1)}
        </h1>
        <p>Hi ${instructor.name},</p>
        <p>Your course <strong>${course.title}</strong> has been ${status}.</p>
        ${status === 'approved' ? `
          <p>Your course is now live and students can enroll!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/courses/${course.slug}"
               style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              View Course
            </a>
          </div>
        ` : `
          <p>Please review the feedback and resubmit your course for approval.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/instructor/courses/${course._id}/edit"
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Edit Course
            </a>
          </div>
        `}
        <p>Thank you for being part of the LearnHub community!</p>
        <p>The LearnHub Team</p>
      </div>
    `;

    return this.sendEmail(instructor.email, subject, html);
  }
}

module.exports = new EmailService();