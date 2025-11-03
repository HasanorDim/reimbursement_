// reimbursement-backend/src/utils/sendEmail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Send email using Nodemailer with CC support
 * @param {string} to - Primary recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @param {string|string[]} cc - Optional CC recipients (single email or array)
 */
export async function sendEmail(to, subject, html, cc = null) {
  try {
    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD in .env');
    }

    // Create transporter based on email service
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5,
    });

    // Email options
    const mailOptions = {
      from: {
        name: 'ERNIt Back System',
        address: process.env.EMAIL_USER
      },
      to: to,
      subject: subject,
      html: html,
    };

    // Add CC if provided
    if (cc) {
      if (Array.isArray(cc)) {
        // Filter out empty strings and join
        mailOptions.cc = cc.filter(email => email && email.trim()).join(', ');
      } else if (typeof cc === 'string' && cc.trim()) {
        mailOptions.cc = cc;
      }
      
      if (mailOptions.cc) {
        console.log(`📧 CC: ${mailOptions.cc}`);
      }
    }

    // Send email with timeout
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout after 30 seconds')), 30000)
      )
    ]);

    console.log(`📧 Email sent successfully to ${to}`);
    if (mailOptions.cc) {
      console.log(`   CC sent to: ${mailOptions.cc}`);
    }
    console.log(`   Message ID: ${info.messageId}`);
    
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    
    // More detailed error logging
    if (error.code === 'EAUTH') {
      console.error('❌ Authentication failed. Check your EMAIL_USER and EMAIL_PASSWORD in .env');
      console.error('💡 For Gmail, use an App Password: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ESOCKET' || error.code === 'ECONNRESET') {
      console.error('❌ Connection failed. Check your internet connection and email service settings');
      console.error('💡 Make sure EMAIL_SERVICE is set correctly (gmail/outlook)');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('❌ Connection timeout. Your email service may be blocked or slow');
    }
    
    throw error;
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig() {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error("❌ Email configuration missing:");
      console.log("   EMAIL_USER:", process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
      console.log("   EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
      console.log("   EMAIL_SERVICE:", process.env.EMAIL_SERVICE || 'gmail (default)');
      console.log("\n📝 Setup instructions:");
      console.log("1. Set EMAIL_USER in your .env file");
      console.log("2. Set EMAIL_PASSWORD (use App Password for Gmail)");
      console.log("3. Set EMAIL_SERVICE ('gmail' or 'outlook')");
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.verify();
    console.log("✅ Email configuration is valid and ready to send emails");
    console.log(`   Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
    console.log(`   User: ${process.env.EMAIL_USER}`);
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error.message);
    
    if (error.code === 'EAUTH') {
      console.error("\n❌ Authentication Failed!");
      console.log("📝 For Gmail:");
      console.log("   1. Enable 2-Step Verification: https://myaccount.google.com/security");
      console.log("   2. Generate App Password: https://myaccount.google.com/apppasswords");
      console.log("   3. Use the 16-character app password in EMAIL_PASSWORD");
      console.log("\n📝 For Outlook:");
      console.log("   1. Use your regular Outlook password");
      console.log("   2. Set EMAIL_SERVICE=outlook");
    }
    
    return false;
  }
}