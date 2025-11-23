import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Skill from './models/skill.model.js';

dotenv.config();

const seedSkills = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log('Connected to MongoDB');

    // Clear existing skills (optional)
    await Skill.deleteMany({});
    console.log('Cleared existing skills');

    // Sample skills data
    const skillsData = [
      // SOFTWARE & TECHNOLOGY
      {
        domain: 'Web Development',
        subdomains: ['Frontend', 'Backend', 'Full-Stack', 'WordPress', 'Shopify']
      },
      {
        domain: 'Mobile App Development',
        subdomains: ['iOS', 'Android', 'React Native', 'Flutter', 'Cross-Platform']
      },
      {
        domain: 'Desktop Software Development',
        subdomains: ['C#', 'Java', 'Python', 'Electron', 'Windows Applications']
      },
      {
        domain: 'Full-Stack Development',
        subdomains: ['MERN', 'MEAN', 'LAMP', 'JAMstack', 'Serverless']
      },
      {
        domain: 'Game Development',
        subdomains: ['Unity', 'Unreal Engine', '2D Games', '3D Games', 'Game Design']
      },
      {
        domain: 'Cloud Computing',
        subdomains: ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes']
      },
      {
        domain: 'DevOps',
        subdomains: ['CI/CD', 'Infrastructure', 'Automation', 'Monitoring', 'Release Management']
      },
      {
        domain: 'AI & Machine Learning',
        subdomains: ['Deep Learning', 'NLP', 'Computer Vision', 'Neural Networks', 'TensorFlow']
      },
      {
        domain: 'Data Science',
        subdomains: ['Statistical Analysis', 'Predictive Modeling', 'Python', 'R', 'Tableau']
      },
      {
        domain: 'Data Engineering',
        subdomains: ['ETL', 'Data Pipelines', 'SQL', 'Spark', 'Data Warehousing']
      },
      {
        domain: 'Data Visualization',
        subdomains: ['Tableau', 'Power BI', 'Looker', 'Matplotlib', 'D3.js']
      },
      {
        domain: 'Blockchain & Crypto',
        subdomains: ['Smart Contracts', 'Solidity', 'Web3', 'DeFi', 'NFT Development']
      },
      {
        domain: 'Cybersecurity',
        subdomains: ['Penetration Testing', 'Security Audits', 'Compliance', 'Network Security', 'Incident Response']
      },
      {
        domain: 'QA / Testing',
        subdomains: ['Automated Testing', 'Manual Testing', 'Performance Testing', 'Security Testing', 'Test Automation']
      },

      // DESIGN & CREATIVE
      {
        domain: 'Graphic Design',
        subdomains: ['Logo Design', 'Branding', 'Print Design', 'Packaging', 'Infographics']
      },
      {
        domain: 'UI/UX Design',
        subdomains: ['Wireframing', 'Prototyping', 'User Research', 'Interaction Design', 'Information Architecture']
      },
      {
        domain: 'Video Editing & Animation',
        subdomains: ['Video Editing', 'Animation', 'Motion Graphics', 'Explainer Videos', 'Subtitle & Captioning']
      },
      {
        domain: 'Motion Graphics',
        subdomains: ['Character Animation', 'VFX', 'After Effects', 'Cinema 4D', 'Title Design']
      },
      {
        domain: '3D Design & Game Art',
        subdomains: ['3D Modeling', 'Texturing', 'Rigging', 'Character Design', 'Environment Design']
      },
      {
        domain: 'Photography & Retouching',
        subdomains: ['Product Photography', 'Portrait Photography', 'Photo Editing', 'Retouching', 'Background Removal']
      },
      {
        domain: 'Fashion & Apparel Design',
        subdomains: ['Clothing Design', 'Pattern Making', 'Fashion Illustration', 'Fabric Selection', 'Lookbook Design']
      },

      // WRITING & CONTENT
      {
        domain: 'Content Writing',
        subdomains: ['Blog Writing', 'Web Content', 'Articles', 'Social Media Content', 'Newsletter Writing']
      },
      {
        domain: 'Copywriting',
        subdomains: ['Sales Copy', 'Email Campaigns', 'Ad Copy', 'Landing Pages', 'Product Descriptions']
      },
      {
        domain: 'Creative Writing',
        subdomains: ['Fiction', 'Poetry', 'Storytelling', 'Scriptwriting', 'Screenwriting']
      },
      {
        domain: 'Technical Writing',
        subdomains: ['API Documentation', 'User Manuals', 'Technical Specifications', 'White Papers', 'Software Documentation']
      },
      {
        domain: 'Academic / Research Writing',
        subdomains: ['Essay Writing', 'Research Papers', 'Thesis Writing', 'Citation Management', 'Academic Editing']
      },
      {
        domain: 'Translation & Transcription',
        subdomains: ['Document Translation', 'Website Localization', 'Audio Transcription', 'Video Subtitles', 'Interpretation']
      },

      // DIGITAL MARKETING & SALES
      {
        domain: 'SEO',
        subdomains: ['On-Page SEO', 'Technical SEO', 'Link Building', 'Keyword Research', 'SEO Audits']
      },
      {
        domain: 'Paid Advertising / PPC',
        subdomains: ['Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Retargeting', 'Campaign Management']
      },
      {
        domain: 'Social Media Marketing',
        subdomains: ['Instagram Marketing', 'Facebook Marketing', 'TikTok Marketing', 'LinkedIn Marketing', 'Community Management']
      },
      {
        domain: 'Performance Marketing',
        subdomains: ['Conversion Rate Optimization', 'A/B Testing', 'Growth Hacking', 'Analytics', 'Attribution']
      },
      {
        domain: 'Brand Strategy',
        subdomains: ['Brand Development', 'Positioning', 'Brand Guidelines', 'Messaging Strategy', 'Market Research']
      },
      {
        domain: 'Email & SMS Marketing',
        subdomains: ['Email Campaigns', 'Automation', 'List Building', 'Segmentation', 'SMS Marketing']
      },
      {
        domain: 'Affiliate & Influencer Marketing',
        subdomains: ['Influencer Outreach', 'Affiliate Management', 'Partnership Development', 'Campaign Coordination']
      },
      {
        domain: 'Sales & Lead Generation',
        subdomains: ['Sales Funnel', 'Lead Qualification', 'Cold Outreach', 'Sales Strategy', 'Business Development']
      },

      // BUSINESS, FINANCE & MANAGEMENT
      {
        domain: 'Accounting & Bookkeeping',
        subdomains: ['Bookkeeping', 'Financial Statements', 'Payroll', 'Tax Preparation', 'QuickBooks']
      },
      {
        domain: 'Finance & Investment',
        subdomains: ['Financial Planning', 'Investment Analysis', 'Portfolio Management', 'Valuation', 'Business Valuation']
      },
      {
        domain: 'Tax & Legal',
        subdomains: ['Tax Consulting', 'Contract Review', 'Legal Compliance', 'Trademark', 'Intellectual Property']
      },
      {
        domain: 'Business Consulting',
        subdomains: ['Strategy Consulting', 'Business Planning', 'Market Analysis', 'Process Improvement', 'Operations Consulting']
      },
      {
        domain: 'Project & Operations Management',
        subdomains: ['Project Management', 'Agile/Scrum', 'Process Optimization', 'Supply Chain', 'Quality Assurance']
      },
      {
        domain: 'Ecommerce Management',
        subdomains: ['Store Setup', 'Product Listing', 'Inventory Management', 'Order Fulfillment', 'Marketplace Optimization']
      },

      // EDUCATION & TRAINING
      {
        domain: 'Academic Tutoring',
        subdomains: ['Math Tutoring', 'Science Tutoring', 'Language Tutoring', 'Test Preparation', 'Homework Help']
      },
      {
        domain: 'Language Training',
        subdomains: ['English', 'Spanish', 'French', 'Chinese', 'German', 'Business Language']
      },
      {
        domain: 'Corporate Training',
        subdomains: ['Leadership Training', 'Soft Skills', 'Compliance Training', 'Sales Training', 'Technical Training']
      },
      {
        domain: 'Skill-Based Training',
        subdomains: ['Software Training', 'Digital Skills', 'Coding Bootcamp', 'Design Training', 'Marketing Training']
      },
      {
        domain: 'Career Coaching',
        subdomains: ['Resume Writing', 'Interview Preparation', 'Career Transition', 'Job Search Strategy', 'LinkedIn Optimization']
      },

      // CUSTOMER SUPPORT & ADMIN
      {
        domain: 'Customer Support',
        subdomains: ['Email Support', 'Chat Support', 'Phone Support', 'Ticket Management', 'Customer Service']
      },
      {
        domain: 'Virtual Assistance',
        subdomains: ['Administrative Support', 'Scheduling', 'Email Management', 'Data Entry', 'Research']
      },
      {
        domain: 'CRM & Helpdesk Management',
        subdomains: ['Salesforce', 'HubSpot', 'Zendesk', 'Jira', 'Customer Database Management']
      },
      {
        domain: 'Data Entry',
        subdomains: ['Database Entry', 'Form Filling', 'Web Research', 'Lead List Building', 'Transcription']
      },

      // ENGINEERING & ARCHITECTURE
      {
        domain: 'Civil & Structural Engineering',
        subdomains: ['AutoCAD', 'Structural Analysis', 'Building Design', 'CAD Drawings', 'Blueprint Development']
      },
      {
        domain: 'Architecture & Interior Design',
        subdomains: ['Architectural Design', 'Interior Design', 'Space Planning', '3D Rendering', 'Revit']
      },
      {
        domain: 'Mechanical Engineering',
        subdomains: ['CAD Design', 'Product Design', 'Technical Drawing', 'SOLIDWORKS', 'Mechanical Analysis']
      },
      {
        domain: 'Electrical & Electronics Engineering',
        subdomains: ['Circuit Design', 'PCB Design', 'Electronics', 'Arduino', 'Firmware Development']
      },
      {
        domain: 'Construction Project Management',
        subdomains: ['Project Coordination', 'Budget Management', 'Scheduling', 'Site Supervision', 'Document Management']
      },

      // AUDIO, LIFESTYLE & OTHER
      {
        domain: 'Voiceover',
        subdomains: ['English Voiceover', 'Commercial VO', 'Audiobook Narration', 'Video VO', 'Multilingual VO']
      },
      {
        domain: 'Music & Audio Production',
        subdomains: ['Music Production', 'Sound Design', 'Audio Editing', 'Mixing & Mastering', 'Podcast Production']
      },
      {
        domain: 'Health & Fitness Coaching',
        subdomains: ['Personal Training', 'Nutrition Coaching', 'Fitness Programs', 'Wellness Coaching', 'Yoga Instruction']
      },
      {
        domain: 'Gaming Assistance / Coaching',
        subdomains: ['Gaming Coaching', 'Esports Training', 'Game Tutoring', 'Streaming Assistance', 'Gaming Content Creation']
      }
    ];

    // Insert skills
    const insertedSkills = await Skill.insertMany(skillsData);
    console.log(`Successfully inserted ${insertedSkills.length} skills`);

    // Verify insertion
    const count = await Skill.countDocuments();
    console.log(`Total skills in database: ${count}`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding skills:', error);
    process.exit(1);
  }
};

seedSkills();
