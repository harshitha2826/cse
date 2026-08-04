"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/swaps.ts
const express_1 = require("express");
const swapController_1 = require("../controllers/swapController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
router.get('/', swapController_1.getUserSwaps);
router.post('/', swapController_1.createSwapRequest);
router.patch('/:id/status', swapController_1.updateSwapStatus);
router.patch('/:id/progress', swapController_1.updateLearnerProgress);
exports.default = router;
