import express from 'express';
import {
  getAllSkills,
  getSkillByDomain,
  createSkill,
  updateSkill,
  deleteSkill
} from '../controller/skill.controller.js';

const router = express.Router();

// Public routes
router.get('/', getAllSkills);
router.get('/:domain', getSkillByDomain);

// Admin routes (you can add JWT verification middleware later if needed)
router.post('/', createSkill);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);

export default router;
