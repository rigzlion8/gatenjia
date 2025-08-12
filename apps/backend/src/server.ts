import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  console.log('🚀 Starting Gatenjia backend server...');
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
  
  try {
    // Start server first
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`🌐 Server bound to all interfaces for Railway deployment`);
      console.log('✅ HTTP server started successfully');
    });
    
    // Try to connect to database (don't fail if it doesn't work)
    try {
      await connectDatabase();
      console.log('✅ Database connected successfully');
    } catch (dbError) {
      console.error('⚠️ Database connection failed, but server is running:', dbError);
      console.log('🔄 Database connection will be retried on first request');
    }
  } catch (error) {
    console.error('Failed to start server:', error);
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

startServer();
