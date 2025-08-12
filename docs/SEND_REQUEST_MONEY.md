# Send/Request Money Features

## Overview
This document describes the implementation of money transfer and request features in the Gatenjia application, including WhatsApp integration for notifications.

## Features Implemented

### 1. Send Money
- **Location**: `/send-money` page
- **Functionality**: Transfer funds to other users
- **Features**:
  - User search by name or email
  - Amount input with validation
  - Description field
  - WhatsApp notification option
  - Real-time balance checking
  - Transaction history

### 2. Request Money
- **Location**: `/request-money` page
- **Functionality**: Request funds from other users
- **Features**:
  - User search by name or email
  - Amount and reason input
  - WhatsApp notification option
  - Pending requests tracking
  - Approval/rejection workflow

### 3. WhatsApp Integration
- **Service**: `WhatsAppService` class
- **Features**:
  - Transfer notifications
  - Money request notifications
  - Approval/rejection notifications
  - Mock implementation (ready for WhatsApp Business API)
  - Error handling without failing transactions

### 4. Backend API Endpoints

#### User Search
- `GET /api/auth/search-users?q={query}` - Search for users by name/email

#### Money Transfers
- `POST /api/wallet/transfer` - Send money to another user
- `POST /api/wallet/request-money` - Request money from another user
- `GET /api/wallet/pending-requests` - Get pending money requests
- `POST /api/wallet/approve-request/:requestId` - Approve a money request
- `POST /api/wallet/reject-request/:requestId` - Reject a money request

## Database Schema

### New Models
- **MoneyRequest**: Tracks money requests between users
- **User.phoneNumber**: Added for WhatsApp integration

### MoneyRequest Fields
- `requesterId`: Who is requesting money
- `fromUserId`: Who is being asked for money
- `amount`: Requested amount
- `description`: Reason for request
- `status`: PENDING, APPROVED, REJECTED, CANCELLED
- `viaWhatsApp`: Whether to send WhatsApp notifications
- `senderPhone`: Phone number for WhatsApp
- `rejectionReason`: Reason if rejected

## Frontend Components

### Send Money Page
- User search with autocomplete
- Amount input with validation
- Description field
- WhatsApp toggle with phone input
- Transfer confirmation
- Success/error handling

### Request Money Page
- User search with autocomplete
- Amount and reason input
- WhatsApp toggle with phone input
- Request submission
- Pending requests display

### Dashboard Integration
- Quick action buttons link to new pages
- Enhanced transaction display
- Better error handling and loading states

## WhatsApp Integration

### Current Implementation
- Mock service that logs messages
- Ready for WhatsApp Business API integration
- Environment variables for configuration
- Error handling without failing transactions

### Production Setup
To enable real WhatsApp notifications:

1. Set up WhatsApp Business API account
2. Configure environment variables:
   ```
   WHATSAPP_API_KEY=your_api_key
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
   WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
   ```
3. Replace mock implementation in `WhatsAppService`

### Message Types
- **Transfer**: Notification about received money
- **Request**: Notification about money request
- **Approval**: Confirmation of approved request
- **Rejection**: Notification of rejected request

## Security Features

### Authentication
- All endpoints require valid JWT tokens
- User can only access their own data
- Admin endpoints require admin role

### Validation
- Amount must be positive
- User must have sufficient funds
- Required fields validation
- User existence verification

### Transaction Safety
- Database transactions for consistency
- Rollback on errors
- Audit trail with transaction history

## Error Handling

### Frontend
- User-friendly error messages
- Loading states
- Retry mechanisms
- Form validation

### Backend
- Comprehensive error logging
- Graceful degradation
- WhatsApp failures don't break transfers
- Input validation and sanitization

## Testing

### Manual Testing
1. Create two user accounts
2. Test money transfer between users
3. Test money request workflow
4. Verify WhatsApp notifications (check console logs)
5. Test error scenarios (insufficient funds, invalid users)

### API Testing
- Test all endpoints with valid/invalid tokens
- Test with insufficient funds
- Test with non-existent users
- Test WhatsApp integration

## Future Enhancements

### Planned Features
- Bulk transfers
- Scheduled transfers
- Transfer limits and daily caps
- Enhanced WhatsApp templates
- Push notifications
- Email notifications

### Technical Improvements
- Real-time updates with WebSockets
- Better error handling
- Performance optimization
- Mobile app integration
- Multi-currency support

## Deployment Notes

### Database Migration
Run Prisma migrations to create new tables:
```bash
cd apps/backend
npm run db:migrate
```

### Environment Variables
Ensure all required environment variables are set in production:
- Database connection
- JWT secrets
- WhatsApp API credentials
- CORS origins

### Monitoring
- Monitor transaction success rates
- Track WhatsApp notification delivery
- Monitor API response times
- Set up alerts for failures

## Support

For issues or questions about these features:
1. Check the backend logs for errors
2. Verify database connectivity
3. Test API endpoints individually
4. Check WhatsApp service configuration
5. Review transaction logs in database
