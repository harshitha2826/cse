"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
// src/config/db.ts
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
try {
    dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
}
catch (e) {
    // ignore if custom DNS fails
}
let mongoMemoryServerInstance = null;
const connectDB = async () => {
    if (mongoose_1.default.connection.readyState === 1) {
        return; // Already connected
    }
    const MONGO_URI = process.env.MONGO_URI || '';
    if (MONGO_URI) {
        try {
            console.log('⏳ Connecting to MongoDB Atlas...');
            await mongoose_1.default.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
            console.log('🗄️  MongoDB Atlas connected successfully!');
            return;
        }
        catch (err) {
            console.warn('⚠️ Could not connect to MongoDB Atlas:', err.message);
            console.log('🔄 Falling back to local in-memory MongoDB database...');
            try {
                await mongoose_1.default.disconnect();
            }
            catch (_) { }
        }
    }
    // Fallback to MongoMemoryServer for zero-config local development
    try {
        if (!mongoMemoryServerInstance) {
            const { MongoMemoryServer } = await Promise.resolve().then(() => __importStar(require('mongodb-memory-server')));
            mongoMemoryServerInstance = await MongoMemoryServer.create();
        }
        const memoryUri = mongoMemoryServerInstance.getUri();
        await mongoose_1.default.connect(memoryUri);
        console.log('🗄️  Local in-memory MongoDB connected successfully!');
    }
    catch (memErr) {
        console.error('❌ Failed to connect to in-memory database:', memErr.message);
    }
};
exports.connectDB = connectDB;
exports.default = exports.connectDB;
