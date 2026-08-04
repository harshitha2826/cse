"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/teacher.ts
const express_1 = require("express");
const teacherController_1 = require("../controllers/teacherController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
router.get('/:teacherId/credits', teacherController_1.getTeacherCredits);
exports.default = router;
