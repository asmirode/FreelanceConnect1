import axios from 'axios';
import createError from '../utils/createError.js';

// Fallback courses database
const coursesDatabase = {
  "Full-Stack Development": [
    {
      courseName: "The Complete Web Developer Bootcamp 2024",
      platform: "Udemy",
      duration: "50 hours",
      description: "Master HTML, CSS, JavaScript, Node, React, MongoDB and more!",
      keySkills: ["HTML/CSS", "JavaScript", "React", "Node.js", "MongoDB"]
    },
    {
      courseName: "Full Stack Open 2024",
      platform: "University of Helsinki",
      duration: "12 weeks",
      description: "Deep dive into modern web development with React, Redux, Node.js, MongoDB, GraphQL and TypeScript",
      keySkills: ["React", "Redux", "Node.js", "MongoDB", "GraphQL", "TypeScript"]
    },
    {
      courseName: "The Odin Project - Full Stack JavaScript",
      platform: "The Odin Project",
      duration: "Self-paced",
      description: "Free full curriculum for learning web development",
      keySkills: ["JavaScript", "React", "Node.js", "Express", "PostgreSQL"]
    },
    {
      courseName: "Node.js, Express & MongoDB Bootcamp",
      platform: "Udemy",
      duration: "42 hours",
      description: "Master Node by building a real-world RESTful API",
      keySkills: ["Node.js", "Express", "MongoDB", "REST API", "JWT"]
    },
    {
      courseName: "Advanced React and Redux",
      platform: "Udemy",
      duration: "24 hours",
      description: "Master React Router, Webpack, Redux, and more",
      keySkills: ["React", "Redux", "Webpack", "Testing", "Hooks"]
    }
  ],
  "Web Development": [
    {
      courseName: "Modern JavaScript From The Beginning",
      platform: "Udemy",
      duration: "21 hours",
      description: "Learn and build projects with pure JavaScript",
      keySkills: ["JavaScript", "ES6+", "DOM", "Async/Await", "APIs"]
    }
  ]
};

export const testEndpoint = async (req, res, next) => {
  try {
    console.log('Test endpoint called');
    res.status(200).send({ message: 'Test endpoint working', payload: req.body });
  } catch (error) {
    console.error('Test error:', error);
    next(error);
  }
};

export const getCourseSuggestions = async (req, res, next) => {
  try {
    const { skills } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      console.error('❌ Invalid skills input:', skills);
      return next(createError(400, 'Skills array is required and cannot be empty'));
    }

    console.log('🚀 Fetching course suggestions for skills:', skills);

    // Try Gemini AI
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('🤖 Listing available models first...');
        
        // First, list available models
        const modelsResponse = await axios.get(
          `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`,
          { timeout: 10000 }
        );

        const availableModels = modelsResponse.data.models
          .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
          .map(m => m.name.replace('models/', ''));

        console.log('✅ Available models:', availableModels.join(', '));

        // Try each available model
        for (const modelName of availableModels) {
          try {
            console.log(`📤 Trying model: ${modelName}...`);
            
            const skillsList = skills.join(', ');
            const prompt = `As an expert career advisor, suggest exactly 5 high-quality online courses for someone with these skills: ${skillsList}

Return ONLY a JSON array in this exact format (no markdown, no explanation):
[
  {
    "courseName": "Course Title",
    "platform": "Udemy or Coursera or edX",
    "duration": "X hours",
    "description": "Brief 2-3 sentence description",
    "keySkills": ["skill1", "skill2", "skill3"]
  }
]`;

            const geminiResponse = await axios.post(
              `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
              {
                contents: [{
                  parts: [{
                    text: prompt
                  }]
                }]
              },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
              }
            );

            console.log(`✅ Success with model: ${modelName}`);

            // Extract and parse
            const aiContent = geminiResponse.data.candidates[0].content.parts[0].text.trim();
            
            let cleanedContent = aiContent
              .replace(/```json\s*/g, '')
              .replace(/```\s*/g, '')
              .replace(/^[^[{]*/, '')
              .replace(/[^}\]]*$/, '')
              .trim();

            let courses = JSON.parse(cleanedContent);
            if (!Array.isArray(courses)) courses = [courses];

            console.log(`✅ Gemini returned ${courses.length} courses`);

            const normalizedCourses = courses.slice(0, 5).map((course, index) => ({
              id: `gemini-${Date.now()}-${index}`,
              courseName: course.courseName || course.title || 'Untitled Course',
              platform: course.platform || 'Online Platform',
              duration: course.duration || 'Self-paced',
              description: course.description || 'No description',
              keySkills: Array.isArray(course.keySkills) ? course.keySkills : []
            }));

            return res.status(200).send({
              skills,
              courses: normalizedCourses,
              message: `🤖 AI-generated recommendations using ${modelName}`,
              source: `Google Gemini AI (${modelName})`
            });

          } catch (modelError) {
            console.log(`⚠️ Model ${modelName} failed:`, modelError.response?.data?.error?.message || modelError.message);
            continue; // Try next model
          }
        }

        console.log('⚠️ All available models failed');

      } catch (geminiError) {
        console.error('⚠️ Gemini API Error:', geminiError.message);
      }
    }

    // Fallback to cached
    console.log('📦 Using cached courses...');
    const primarySkill = skills[0];
    const courses = coursesDatabase[primarySkill] || coursesDatabase["Full-Stack Development"] || [];
    
    const normalizedCourses = courses.map((course, index) => ({
      id: `cache-${Date.now()}-${index}`,
      ...course
    }));

    console.log(`✅ Returning ${normalizedCourses.length} cached courses`);

    return res.status(200).send({
      skills,
      courses: normalizedCourses,
      message: 'Curated course recommendations based on your skills',
      source: 'Expert-Curated Database'
    });

  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    next(createError(500, `Failed to fetch suggestions: ${error.message}`));
  }
};
// filepath: c:\Users\HP\OneDrive\Desktop\Ly project code\FreelanceConnect1\api\controller\upskilling.controller.js
