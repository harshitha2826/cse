"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/skills.ts
const express_1 = require("express");
const skillController_1 = require("../controllers/skillController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get('/', skillController_1.getSkills);
router.post('/', authMiddleware_1.authenticateToken, skillController_1.createSkill);
router.post('/:id/learn', authMiddleware_1.authenticateToken, skillController_1.learnSkill);
router.delete('/:id', authMiddleware_1.authenticateToken, skillController_1.deleteSkill);
exports.default = router;
