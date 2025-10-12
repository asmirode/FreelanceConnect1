import express from 'express';
import { startChat, sendMessage, getMatches } from '../controller/chat.controller.js';
import { verifyToken } from '../middelware/jwt.js';

const router = express.Router();

// Protected chat endpoints
router.post('/start', verifyToken, startChat);
router.post('/message', verifyToken, sendMessage);
router.get('/matches/:chatId', verifyToken, getMatches);

export default router;
