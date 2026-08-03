"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/messages.ts
const express_1 = require("express");
const messageController_1 = require("../controllers/messageController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
router.get('/:partnerId', messageController_1.getMessages);
router.post('/', messageController_1.sendMessage);
exports.default = router;
