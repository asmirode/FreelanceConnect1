import Skill from '../models/skill.model.js';
import createError from '../utils/createError.js';

// Get all skills
export const getAllSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find({ isActive: true });
    res.status(200).send(skills);
  } catch (err) {
    next(err);
  }
};

// Get skill by domain
export const getSkillByDomain = async (req, res, next) => {
  try {
    const { domain } = req.params;
    const skill = await Skill.findOne({ domain, isActive: true });
    
    if (!skill) return next(createError(404, 'Skill domain not found'));
    
    res.status(200).send(skill);
  } catch (err) {
    next(err);
  }
};

// Create new skill
export const createSkill = async (req, res, next) => {
  try {
    const { domain, subdomains, description, icon } = req.body;

    // Validate required fields
    if (!domain || !subdomains || subdomains.length === 0) {
      return next(createError(400, 'Domain and subdomains are required'));
    }

    // Check if domain already exists
    const existingSkill = await Skill.findOne({ domain });
    if (existingSkill) {
      return next(createError(400, 'Skill domain already exists'));
    }

    const newSkill = new Skill({
      domain,
      subdomains,
      description: description || '',
      icon: icon || ''
    });

    await newSkill.save();
    res.status(201).send(newSkill);
  } catch (err) {
    next(err);
  }
};

// Update skill
export const updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { domain, subdomains, description, icon, isActive } = req.body;

    const skill = await Skill.findByIdAndUpdate(
      id,
      {
        domain: domain || undefined,
        subdomains: subdomains || undefined,
        description: description || undefined,
        icon: icon || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      },
      { new: true, runValidators: true }
    );

    if (!skill) return next(createError(404, 'Skill not found'));

    res.status(200).send(skill);
  } catch (err) {
    next(err);
  }
};

// Delete skill
export const deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;

    const skill = await Skill.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!skill) return next(createError(404, 'Skill not found'));

    res.status(200).send('Skill deleted successfully');
  } catch (err) {
    next(err);
  }
};
