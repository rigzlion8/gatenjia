import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  console.log('🚀 Starting Gatenjia backend server...');
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
  console.log(`📧 Resend API Key: ${process.env.RESEND_API_KEY ? 'Set' : 'Not set'}`);
  
  try {
    // Start server first
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`🌐 Server bound to all interfaces for Railway deployment`);
      console.log('✅ HTTP server started successfully');
    });
    
    // Verify server is listening
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
    
    server.on('listening', () => {
      console.log('🎯 Server is now listening and ready for connections');
    });
    
    // Try to connect to database with retries
    let dbConnected = false;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        console.log(`🗄️ Attempting database connection (${attempt}/5)...`);
        await connectDatabase();
        console.log('✅ Database connected successfully');
        dbConnected = true;
        break;
      } catch (dbError) {
        console.error(`⚠️ Database connection attempt ${attempt} failed:`, dbError);
        if (attempt < 5) {
          console.log(`🔄 Retrying in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database after 5 attempts');
      console.log('🔄 Server will continue running but database operations may fail');
    }
    
    console.log('🎉 Backend service is now fully operational');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
