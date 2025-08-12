import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Start server first
    app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
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
