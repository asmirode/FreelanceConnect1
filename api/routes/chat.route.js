import express from 'express';
import { verifyToken } from '../middelware/jwt.js';
import { startChat, sendMessage, getMatches } from '../controller/chat.controller.js';

const router = express.Router();

// All chat routes require authentication
router.post('/start', verifyToken, startChat);
router.post('/message', verifyToken, sendMessage);
router.get('/matches/:chatId', verifyToken, getMatches);

export default router;

