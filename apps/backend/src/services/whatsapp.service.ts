export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'transfer' | 'request' | 'approval' | 'rejection';
}

export class WhatsAppService {
  private apiKey: string;
  private phoneNumberId: string;
  private businessAccountId: string;

  constructor() {
    // These would come from environment variables in production
    this.apiKey = process.env.WHATSAPP_API_KEY || 'mock_key';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || 'mock_phone_id';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || 'mock_business_id';
  }

  async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      // In production, this would integrate with WhatsApp Business API
      // For now, we'll just log the message
      
      const formattedMessage = this.formatMessage(message);
      console.log('📱 WhatsApp Message:', {
        to: message.to,
        message: formattedMessage,
        type: message.type
      });

      // TODO: Replace with actual WhatsApp Business API call
      // const response = await fetch(`https://graph.facebook.com/v17.0/${this.phoneNumberId}/messages`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     messaging_product: 'whatsapp',
      //     to: message.to,
      //     type: 'text',
      //     text: { body: formattedMessage }
      //   })
      // });

      return true;
    } catch (error) {
      console.error('WhatsApp message failed:', error);
      return false;
    }
  }

  private formatMessage(message: WhatsAppMessage): string {
    switch (message.type) {
      case 'transfer':
        return `💰 You received a money transfer!\n\nAmount: $${message.message}\n\nThis transfer has been completed and added to your wallet.`;
      
      case 'request':
        return `📱 Money Request\n\nSomeone is requesting money from you.\n\nAmount: $${message.message}\n\nPlease log into your Gatenjia account to approve or reject this request.`;
      
      case 'approval':
        return `✅ Money Request Approved!\n\nYour money request has been approved and the funds have been transferred to your wallet.`;
      
      case 'rejection':
        return `❌ Money Request Rejected\n\nYour money request has been rejected. You can contact the sender for more details.`;
      
      default:
        return message.message;
    }
  }

  // Send transfer notification
  async sendTransferNotification(phoneNumber: string, amount: number, senderName: string): Promise<boolean> {
    return this.sendMessage({
      to: phoneNumber,
      message: `You received $${amount} from ${senderName}`,
      type: 'transfer'
    });
  }

  // Send money request notification
  async sendRequestNotification(phoneNumber: string, amount: number, requesterName: string): Promise<boolean> {
    return this.sendMessage({
      to: phoneNumber,
      message: `${requesterName} is requesting $${amount}`,
      type: 'request'
    });
  }

  // Send request approval notification
  async sendApprovalNotification(phoneNumber: string): Promise<boolean> {
    return this.sendMessage({
      to: phoneNumber,
      message: 'Your money request has been approved!',
      type: 'approval'
    });
  }

  // Send request rejection notification
  async sendRejectionNotification(phoneNumber: string, reason?: string): Promise<boolean> {
    return this.sendMessage({
      to: phoneNumber,
      message: `Your money request was rejected${reason ? `: ${reason}` : ''}`,
      type: 'rejection'
    });
  }
}

export const whatsappService = new WhatsAppService();
