"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
exports.prisma = globalThis.__prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = exports.prisma;
}
async function connectDatabase() {
    const maxRetries = 5;
    const retryDelay = 5000; // 5 seconds
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await exports.prisma.$connect();
            console.log('✅ Database connected successfully');
            return;
        }
        catch (error) {
            console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, error);
            if (attempt === maxRetries) {
                console.error('❌ Max retry attempts reached. Database connection failed.');
                throw error; // Don't exit process, let caller handle it
            }
            console.log(`🔄 Retrying in ${retryDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}
async function disconnectDatabase() {
    await exports.prisma.$disconnect();
    console.log('🔌 Database disconnected');
}
