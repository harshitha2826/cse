"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
// src/config/db.ts
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Ensure environment variables are loaded
dotenv_1.default.config();
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
try {
    dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
}
catch (e) {
    // ignore if custom DNS fails
}
const connectDB = async () => {
    if (mongoose_1.default.connection.readyState === 1) {
        return; // Already connected
    }
    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Harshitha:Harshi26@cluster0.bbjpxts.mongodb.net/skillbridge?retryWrites=true&w=majority&appName=Cluster0';
    console.log('⏳ Connecting to MongoDB Atlas...');
    await mongoose_1.default.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('🗄️  MongoDB Atlas connected successfully!');
};
exports.connectDB = connectDB;
exports.default = exports.connectDB;
