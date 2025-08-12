"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const resend_1 = require("resend");
class EmailService {
    constructor() {
        this.resend = new resend_1.Resend(process.env.RESEND_API_KEY);
        this.fromEmail = process.env.FROM_EMAIL || 'noreply@gatenjia.com';
    }
    async sendEmail(emailData) {
        try {
            const result = await this.resend.emails.send({
                from: emailData.from || this.fromEmail,
                to: emailData.to,
                subject: emailData.subject,
                html: emailData.html,
            });
            console.log('📧 Email sent successfully:', result);
            return true;
        }
        catch (error) {
            console.error('❌ Email sending failed:', error);
            return false;
        }
    }
    // Welcome email for new users
    async sendWelcomeEmail(user) {
        const subject = 'Welcome to Gatenjia! 🎉';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Gatenjia!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your account has been created successfully</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName} ${user.lastName}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Welcome to Gatenjia! We're excited to have you on board. Your account has been created and you now have access to:
          </p>
          
          <ul style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            <li>💰 Send and receive money instantly</li>
            <li>📱 WhatsApp notifications for all transactions</li>
            <li>🔒 Secure and encrypted transfers</li>
            <li>📊 Real-time transaction history</li>
            <li>🌍 Global money transfers</li>
          </ul>
          
          <div style="background: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32;">
              <strong>🎁 Welcome Bonus:</strong> Your wallet has been credited with 100 G Coins ($100 USD) to get you started!
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Gatenjia. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
        </div>
      </div>
    `;
        return this.sendEmail({ to: user.email, subject, html });
    }
    // Money sent confirmation
    async sendMoneySentEmail(user, transaction, recipientEmail) {
        const subject = 'Money Sent Successfully 💸';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Money Sent Successfully!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your transfer has been completed</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName} ${user.lastName}!</h2>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">Transfer Details</h3>
            <p style="margin: 5px 0; color: #856404;"><strong>Amount:</strong> $${transaction.amount}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>To:</strong> ${recipientEmail}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>Description:</strong> ${transaction.description}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>Date:</strong> ${transaction.date}</p>
            ${transaction.reference ? `<p style="margin: 5px 0; color: #856404;"><strong>Reference:</strong> ${transaction.reference}</p>` : ''}
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your money has been sent successfully. The recipient will receive a notification and the funds will be available in their wallet immediately.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Transaction
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Gatenjia. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
        </div>
      </div>
    `;
        return this.sendEmail({ to: user.email, subject, html });
    }
    // Money received notification
    async sendMoneyReceivedEmail(user, transaction, senderEmail) {
        const subject = 'Money Received! 💰';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Money Received!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">You have received a transfer</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName} ${user.lastName}!</h2>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #155724;">Transfer Details</h3>
            <p style="margin: 5px 0; color: #155724;"><strong>Amount:</strong> $${transaction.amount}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>From:</strong> ${senderEmail}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Description:</strong> ${transaction.description}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Date:</strong> ${transaction.date}</p>
            ${transaction.reference ? `<p style="margin: 5px 0; color: #155724;"><strong>Reference:</strong> ${transaction.reference}</p>` : ''}
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Great news! You have received money in your Gatenjia wallet. The funds are now available for you to use.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #00b894; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Wallet
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Gatenjia. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
        </div>
      </div>
    `;
        return this.sendEmail({ to: user.email, subject, html });
    }
    // Money request notification
    async sendMoneyRequestEmail(user, transaction, requesterEmail) {
        const subject = 'Money Request from Gatenjia User 📱';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Money Request</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Someone is requesting money from you</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName} ${user.lastName}!</h2>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">Request Details</h3>
            <p style="margin: 5px 0; color: #856404;"><strong>Amount:</strong> $${transaction.amount}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>From:</strong> ${requesterEmail}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>Description:</strong> ${transaction.description}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>Date:</strong> ${transaction.date}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            A Gatenjia user has requested money from you. You can approve or reject this request by logging into your account.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #fdcb6e; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Review Request
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Gatenjia. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
        </div>
      </div>
    `;
        return this.sendEmail({ to: user.email, subject, html });
    }
    // Password change notification
    async sendPasswordChangeEmail(user, changeDate) {
        const subject = 'Password Changed - Security Alert 🔒';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e17055 0%, #d63031 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Password Changed</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Security alert for your account</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName} ${user.lastName}!</h2>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #721c24;">Security Alert</h3>
            <p style="margin: 5px 0; color: #721c24;"><strong>Action:</strong> Password changed</p>
            <p style="margin: 5px 0; color: #721c24;"><strong>Date:</strong> ${changeDate}</p>
            <p style="margin: 5px 0; color: #721c24;"><strong>Account:</strong> ${user.email}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your Gatenjia account password was recently changed. If this was you, no action is needed. If you didn't make this change, please contact our support team immediately.
          </p>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;">
              <strong>💡 Security Tip:</strong> Use a strong, unique password and never share it with anyone.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #e17055; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Gatenjia. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
        </div>
      </div>
    `;
        return this.sendEmail({ to: user.email, subject, html });
    }
    // OTP verification email
    async sendOTPEmail(user, otp, purpose) {
        const subject = `Verification Code - ${purpose} 🔐`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Verification Code</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Use this code to verify your ${purpose}</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName} ${user.lastName}!</h2>
          
          <div style="background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #1565c0;">Your Verification Code</h3>
            <div style="background: #fff; border: 2px dashed #2196f3; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #2196f3; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="margin: 0; color: #1565c0; font-size: 14px;">This code will expire in 10 minutes</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Please enter this verification code in the Gatenjia app to complete your ${purpose}. Do not share this code with anyone.
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Security Notice:</strong> Gatenjia staff will never ask for this code. If someone asks for it, please report it immediately.
            </p>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Gatenjia. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
        </div>
      </div>
    `;
        return this.sendEmail({ to: user.email, subject, html });
    }
    // Profile update notification
    async sendProfileUpdateEmail(user, updateType, updateDate) {
        const subject = 'Profile Updated Successfully ✅';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Profile Updated</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your account information has been updated</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName} ${user.lastName}!</h2>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #155724;">Update Details</h3>
            <p style="margin: 5px 0; color: #155724;"><strong>Type:</strong> ${updateType}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Date:</strong> ${updateDate}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Account:</strong> ${user.email}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your Gatenjia profile has been successfully updated. All changes have been applied to your account.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #00b894; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Profile
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Gatenjia. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
        </div>
      </div>
    `;
        return this.sendEmail({ to: user.email, subject, html });
    }
    // Funds added to wallet notification
    async sendFundsAddedEmail(user, amount, description, transactionId) {
        const subject = 'Funds Added to Your Wallet! 💰';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00b894 0%, #00a085 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Funds Added Successfully!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your wallet has been credited</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName} ${user.lastName}!</h2>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #155724;">Transaction Details</h3>
            <p style="margin: 5px 0; color: #155724;"><strong>Amount Added:</strong> ${amount} G Coins</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Description:</strong> ${description}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Transaction ID:</strong> ${transactionId}</p>
            <p style="margin: 5px 0; color: #155724;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Great news! Your wallet has been successfully credited with ${amount} G Coins. The funds are now available for you to use for transfers, payments, and other transactions.
          </p>
          
          <div style="background: #e8f5e8; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #2e7d32;">
              <strong>✅ Confirmed:</strong> Your transaction has been processed and the funds are now in your wallet.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #00b894; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Wallet
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Gatenjia. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
        </div>
      </div>
    `;
        return this.sendEmail({ to: user.email, subject, html });
    }
    // Failed transaction notification
    async sendFailedTransactionEmail(user, transaction, error) {
        const subject = 'Transaction Failed - Action Required ❌';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #e17055 0%, #d63031 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Transaction Failed</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your transfer could not be completed</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName} ${user.lastName}!</h2>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #721c24;">Transaction Details</h3>
            <p style="margin: 5px 0; color: #721c24;"><strong>Amount:</strong> $${transaction.amount}</p>
            <p style="margin: 5px 0; color: #721c24;"><strong>Description:</strong> ${transaction.description}</p>
            <p style="margin: 5px 0; color: #721c24;"><strong>Date:</strong> ${transaction.date}</p>
            <p style="margin: 5px 0; color: #721c24;"><strong>Error:</strong> ${error}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Unfortunately, your transaction could not be completed. The funds have not been deducted from your account. Please review the error details and try again.
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>💡 Tip:</strong> Common issues include insufficient funds, invalid recipient details, or network connectivity problems.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
               style="background: #e17055; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Try Again
            </a>
          </div>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Gatenjia. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
        </div>
      </div>
    `;
        return this.sendEmail({ to: user.email, subject, html });
    }
    // Money held notification
    async sendMoneyHeldEmail(user, amount, reason, holdDate) {
        const subject = 'Account Suspended - Funds Temporarily Held ⚠️';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fdcb6e 0%, #e17055 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Account Suspended</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your funds have been temporarily held</p>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName} ${user.lastName}!</h2>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #856404;">Suspension Details</h3>
            <p style="margin: 5px 0; color: #856404;"><strong>Amount Held:</strong> $${amount}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>Reason:</strong> ${reason}</p>
            <p style="margin: 5px 0; color: #856404;"><strong>Date:</strong> ${holdDate}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your Gatenjia account has been temporarily suspended and your funds are being held for security reasons. This is usually due to suspicious activity or compliance requirements.
          </p>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;">
              <strong>🔒 Important:</strong> Your funds are safe and will be released once the issue is resolved. Please contact our support team for assistance.
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We understand this may be inconvenient and we're working to resolve this as quickly as possible. Please check your email for updates or contact our support team.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">© 2024 Gatenjia. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">This email was sent to ${user.email}</p>
        </div>
      </div>
    `;
        return this.sendEmail({ to: user.email, subject, html });
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
