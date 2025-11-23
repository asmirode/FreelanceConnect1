import express from 'express';
import { getCourseSuggestions, testEndpoint } from '../controller/upskilling.controller.js';

const router = express.Router();

router.post('/test', testEndpoint);
router.post('/courses', getCourseSuggestions);

export default router;
