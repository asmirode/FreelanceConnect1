import express from 'express';
import { searchFreelancers } from '../controller/ai.controller.js';
import { verifyToken } from '../middelware/jwt.js';

const router = express.Router();

// Protected AI search endpoint - requires authentication
router.post('/searchFreelancer', verifyToken, searchFreelancers);

export default router;
