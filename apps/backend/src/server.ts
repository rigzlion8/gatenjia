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
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });
  
  try {
    // Start server first
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`🌐 Server bound to all interfaces for Railway deployment`);
      console.log('✅ HTTP server started successfully');
    });
    
    // Verify server is listening
    server.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      console.error('❌ Error details:', {
        code: error?.code,
        errno: error?.errno,
        syscall: error?.syscall,
        address: error?.address,
        port: error?.port
      });
      process.exit(1);
    });
    
    server.on('listening', () => {
      console.log('🎯 Server is now listening and ready for connections');
    });
    
    // Keep server alive even if database connection fails
    server.on('close', () => {
      console.log('🔌 Server connection closed');
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
      console.log('⚠️  Health check will still work, but API endpoints may return errors');
    } else {
      console.log('🎉 Backend service is now fully operational');
    }
    
    // Ensure server stays alive
    console.log('🔄 Server is ready to accept requests');
    
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
  console.error('❌ Error details:', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    errno: error.errno
  });
  
  // Keep process alive for a bit to see logs
  setTimeout(() => {
    console.error('🛑 Exiting due to startup failure');
    process.exit(1);
  }, 5000);
});
