import app from './app';
import { config } from './config/env';
import prisma from './config/database';

const startServer = async () => {
  try {

    await prisma.$connect();
    console.log('✅ Connected to the database successfully.');

    const port = config.PORT || 3000;
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port} in ${config.NODE_ENV} mode.`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('🛑 Database connection closed.');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('🛑 Database connection closed.');
  process.exit(0);
});