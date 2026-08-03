"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = require("./config/db");
const auth_1 = __importDefault(require("./routes/auth"));
const skills_1 = __importDefault(require("./routes/skills"));
const swaps_1 = __importDefault(require("./routes/swaps"));
const messages_1 = __importDefault(require("./routes/messages"));
const Message_1 = __importDefault(require("./models/Message"));
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Ensure Database is connected for every request
app.use(async (req, res, next) => {
    if (mongoose_1.default.connection.readyState !== 1) {
        await (0, db_1.connectDB)();
    }
    next();
});
// Connect to MongoDB on startup
(0, db_1.connectDB)();
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/skills', skills_1.default);
app.use('/api/swaps', swaps_1.default);
app.use('/api/messages', messages_1.default);
// Socket.io Real-time Chat
io.on('connection', (socket) => {
    console.log('🔌 New client connected to Socket.io:', socket.id);
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`👤 Client ${socket.id} joined chat room: ${roomId}`);
    });
    socket.on('send_message', async (data) => {
        try {
            const { sender, receiver, senderName, content, swapRequestId, roomId } = data;
            const newMessage = new Message_1.default({
                sender,
                receiver,
                senderName: senderName || 'User',
                swapRequestId,
                content,
            });
            await newMessage.save();
            // Emit to room
            io.to(roomId || receiver).emit('receive_message', newMessage);
        }
        catch (err) {
            console.error('Socket send_message error:', err);
        }
    });
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
