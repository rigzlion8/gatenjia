import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Backend running at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
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
