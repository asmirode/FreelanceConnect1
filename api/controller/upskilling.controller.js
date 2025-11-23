import axios from 'axios';
import createError from '../utils/createError.js';

// Mock course data for different domains
const coursesDatabase = {
  'Web Development': [
    {
      courseName: 'The Complete Web Developer Bootcamp 2024',
      platform: 'Udemy',
      duration: '50 hours',
      description: 'Learn full-stack web development with HTML, CSS, JavaScript, Node.js, and React. Build real-world projects.',
      keySkills: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'Databases']
    },
    {
      courseName: 'Web Design for Beginners',
      platform: 'Coursera',
      duration: '4 weeks',
      description: 'Master the principles of web design and create beautiful, responsive websites.',
      keySkills: ['UX/UI Design', 'Responsive Design', 'Web Standards', 'Accessibility']
    },
    {
      courseName: 'Advanced JavaScript Patterns',
      platform: 'Pluralsight',
      duration: '8 hours',
      description: 'Deep dive into advanced JavaScript concepts and design patterns used in production code.',
      keySkills: ['Advanced JavaScript', 'Design Patterns', 'Performance', 'Security']
    },
    {
      courseName: 'React Advanced Topics',
      platform: 'LinkedIn Learning',
      duration: '6 hours',
      description: 'Learn advanced React patterns including hooks, context, and performance optimization.',
      keySkills: ['React Hooks', 'State Management', 'Testing', 'Performance Optimization']
    },
    {
      courseName: 'Backend Development with Node.js',
      platform: 'Udemy',
      duration: '40 hours',
      description: 'Build scalable backend applications using Node.js and Express with databases.',
      keySkills: ['Node.js', 'Express', 'REST APIs', 'Databases', 'Authentication']
    }
  ],
  'Mobile App Development': [
    {
      courseName: 'React Native: Build Native Mobile Apps',
      platform: 'Udemy',
      duration: '55 hours',
      description: 'Learn to build iOS and Android apps using React Native and JavaScript.',
      keySkills: ['React Native', 'Mobile UI', 'State Management', 'APIs', 'Deployment']
    },
    {
      courseName: 'Flutter App Development Complete Guide',
      platform: 'Udemy',
      duration: '45 hours',
      description: 'Master Flutter to build beautiful cross-platform mobile applications.',
      keySkills: ['Flutter', 'Dart', 'UI Design', 'State Management', 'Firebase']
    },
    {
      courseName: 'iOS App Development with Swift',
      platform: 'Coursera',
      duration: '6 weeks',
      description: 'Learn to develop native iOS applications using Swift and Xcode.',
      keySkills: ['Swift', 'iOS Development', 'UIKit', 'Networking', 'Core Data']
    },
    {
      courseName: 'Android Development Master Course',
      platform: 'Udemy',
      duration: '50 hours',
      description: 'Complete guide to Android app development using Kotlin and Android Studio.',
      keySkills: ['Kotlin', 'Android Studio', 'Material Design', 'APIs', 'Testing']
    },
    {
      courseName: 'Mobile App Security & Performance',
      platform: 'Pluralsight',
      duration: '10 hours',
      description: 'Learn to build secure and performant mobile applications.',
      keySkills: ['Security', 'Performance Optimization', 'Data Protection', 'Testing']
    }
  ],
  'UI/UX Design': [
    {
      courseName: 'Complete UI/UX Design Course',
      platform: 'Udemy',
      duration: '35 hours',
      description: 'Learn user interface and user experience design from scratch.',
      keySkills: ['Wireframing', 'Prototyping', 'User Research', 'Visual Design', 'Usability']
    },
    {
      courseName: 'Figma Mastery: Web & App Design',
      platform: 'Skillshare',
      duration: '8 hours',
      description: 'Master Figma to design websites and mobile applications professionally.',
      keySkills: ['Figma', 'Component Design', 'Prototyping', 'Design Systems', 'Collaboration']
    },
    {
      courseName: 'User Research & User Testing',
      platform: 'Coursera',
      duration: '5 weeks',
      description: 'Learn techniques to research users and validate design decisions.',
      keySkills: ['User Research', 'User Testing', 'Analytics', 'Insights', 'Documentation']
    },
    {
      courseName: 'Design Systems & Component Libraries',
      platform: 'LinkedIn Learning',
      duration: '5 hours',
      description: 'Create scalable design systems and component libraries for large projects.',
      keySkills: ['Design Systems', 'Component Design', 'Documentation', 'Governance']
    },
    {
      courseName: 'Interaction Design & Motion',
      platform: 'Udemy',
      duration: '20 hours',
      description: 'Master interaction design and micro-animations to enhance user experiences.',
      keySkills: ['Interaction Design', 'Animation', 'Micro-interactions', 'Prototyping']
    }
  ],
  'Photography & Retouching': [
    {
      courseName: 'Photography Fundamentals & Composition',
      platform: 'Udemy',
      duration: '25 hours',
      description: 'Learn photography basics, composition, lighting, and camera settings.',
      keySkills: ['Composition', 'Lighting', 'Exposure', 'Camera Settings', 'Post-processing']
    },
    {
      courseName: 'Adobe Lightroom Mastery',
      platform: 'Skillshare',
      duration: '6 hours',
      description: 'Master Lightroom for efficient photo organization and editing workflows.',
      keySkills: ['Lightroom', 'Color Correction', 'Batch Editing', 'Organization', 'Presets']
    },
    {
      courseName: 'Photoshop for Retouching',
      platform: 'Udemy',
      duration: '30 hours',
      description: 'Learn advanced Photoshop techniques for professional photo retouching.',
      keySkills: ['Photoshop', 'Retouching', 'Color Grading', 'Compositing', 'Restoration']
    },
    {
      courseName: 'Portrait Photography Masterclass',
      platform: 'Coursera',
      duration: '4 weeks',
      description: 'Specialize in portrait photography with lighting and posing techniques.',
      keySkills: ['Portrait Photography', 'Lighting Setup', 'Posing', 'Client Relations']
    },
    {
      courseName: 'Advanced Color Grading & Retouching',
      platform: 'LinkedIn Learning',
      duration: '7 hours',
      description: 'Learn professional color grading and advanced retouching techniques.',
      keySkills: ['Color Grading', 'Advanced Retouching', 'LUTs', 'Skin Retouching']
    }
  ],
  'Graphic Design': [
    {
      courseName: 'Complete Graphic Design Course',
      platform: 'Udemy',
      duration: '40 hours',
      description: 'Learn design principles, typography, color theory, and professional design tools.',
      keySkills: ['Design Principles', 'Typography', 'Color Theory', 'Branding', 'Layout']
    },
    {
      courseName: 'Adobe Creative Suite Mastery',
      platform: 'Skillshare',
      duration: '12 hours',
      description: 'Master Adobe InDesign, Illustrator, and Photoshop for professional design work.',
      keySkills: ['InDesign', 'Illustrator', 'Photoshop', 'Print Design', 'Digital Design']
    },
    {
      courseName: 'Logo Design & Brand Identity',
      platform: 'Udemy',
      duration: '20 hours',
      description: 'Learn to create memorable logos and comprehensive brand identity systems.',
      keySkills: ['Logo Design', 'Branding', 'Visual Identity', 'Brand Guidelines', 'Design Thinking']
    },
    {
      courseName: 'Typography for Designers',
      platform: 'Coursera',
      duration: '5 weeks',
      description: 'Master typography principles and their application in modern design.',
      keySkills: ['Typography', 'Font Pairing', 'Hierarchy', 'Readability', 'Type Design']
    },
    {
      courseName: 'Print & Packaging Design',
      platform: 'LinkedIn Learning',
      duration: '8 hours',
      description: 'Learn to design print materials and packaging that stands out on shelves.',
      keySkills: ['Print Design', 'Packaging', 'Die-cutting', 'Color Separation', 'Production']
    }
  ],
  'Digital Marketing': [
    {
      courseName: 'Complete Digital Marketing Course',
      platform: 'Udemy',
      duration: '35 hours',
      description: 'Learn all aspects of digital marketing including SEO, social media, and analytics.',
      keySkills: ['SEO', 'SEM', 'Social Media Marketing', 'Email Marketing', 'Analytics']
    },
    {
      courseName: 'Google Analytics & Data Analysis',
      platform: 'Coursera',
      duration: '4 weeks',
      description: 'Master Google Analytics to measure and optimize marketing campaigns.',
      keySkills: ['Google Analytics', 'Data Analysis', 'Reporting', 'Optimization', 'Tracking']
    },
    {
      courseName: 'Social Media Marketing Strategies',
      platform: 'LinkedIn Learning',
      duration: '6 hours',
      description: 'Learn to create effective social media strategies for different platforms.',
      keySkills: ['Social Media Strategy', 'Content Creation', 'Community Management', 'Analytics']
    },
    {
      courseName: 'Content Marketing & SEO',
      platform: 'Udemy',
      duration: '25 hours',
      description: 'Master content creation and SEO strategies for organic traffic growth.',
      keySkills: ['Content Strategy', 'Keyword Research', 'SEO', 'Copywriting', 'Link Building']
    },
    {
      courseName: 'PPC Advertising & Conversion Optimization',
      platform: 'Skillshare',
      duration: '8 hours',
      description: 'Learn Google Ads, Facebook Ads, and conversion rate optimization techniques.',
      keySkills: ['Google Ads', 'Facebook Ads', 'CRO', 'A/B Testing', 'Campaign Management']
    }
  ]
};

export const testEndpoint = async (req, res, next) => {
  try {
    console.log('Test endpoint called');
    res.status(200).send({ message: 'Test endpoint working', domain: req.body.domain });
  } catch (error) {
    console.error('Test error:', error);
    next(error);
  }
};

export const getCourseSuggestions = async (req, res, next) => {
  try {
    const { domain } = req.body;
    console.log('=== getCourseSuggestions called ===');
    console.log('Domain:', domain);

    if (!domain) {
      console.log('No domain provided');
      return next(createError(400, 'Domain is required'));
    }

    // Get courses from database or return default
    const courses = coursesDatabase[domain] || coursesDatabase['Web Development'];

    console.log('Returning', courses.length, 'courses for domain:', domain);
    res.status(200).send({
      domain,
      courses,
      message: 'Courses suggested based on your domain'
    });

  } catch (error) {
    console.error('=== ERROR IN getCourseSuggestions ===');
    console.error('Error message:', error.message);
    next(createError(500, `Failed to generate course suggestions: ${error.message}`));
  }
};
