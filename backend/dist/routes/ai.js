"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/ai.ts
const express_1 = require("express");
const aiController_1 = require("../controllers/aiController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post('/doubt', authMiddleware_1.authenticateToken, aiController_1.askDoubt);
exports.default = router;
