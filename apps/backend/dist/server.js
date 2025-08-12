"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const PORT = process.env.PORT || 4000;
async function startServer() {
    try {
        // Connect to database
        await (0, database_1.connectDatabase)();
        // Start server
        app_1.default.listen(PORT, () => {
            console.log(`🚀 Backend running at http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await (0, database_1.disconnectDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await (0, database_1.disconnectDatabase)();
    process.exit(0);
});
startServer();
