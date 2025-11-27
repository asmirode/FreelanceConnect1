import axios from 'axios';
import createError from '../utils/createError.js';
import Gig from '../models/gig.model.js';
import User from '../models/user.model.js';

// In-memory storage for chat sessions (in production, use Redis or database)
const chatSessions = new Map();

// Extract requirements from conversation using Gemini
const extractRequirements = async (conversationHistory) => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  try {
    const conversationText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Buyer' : 'AI'}: ${msg.content}`)
      .join('\n');

    const prompt = `You are an expert at analyzing buyer requirements for freelance services. Extract the EXACT PRIMARY service the buyer needs.

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):

{
  "primaryService": "exact service name",
  "skills": ["skill1", "skill2"],
  "budget": {"min": 0, "max": 0},
  "timeline": "flexible",
  "keywords": ["keyword1", "keyword2"],
  "serviceCategory": "category"
}

CRITICAL RULES FOR primaryService:
1. "I need a website" → primaryService: "Website Development" (NOT "UI/UX Design", NOT "Design")
2. "I need a logo" → primaryService: "Logo Design" (NOT "Graphic Design", NOT "Branding")
3. "I need UI/UX design" → primaryService: "UI/UX Design" (NOT "Website Development")
4. "I need a mobile app" → primaryService: "Mobile App Development"
5. "I need content writing" → primaryService: "Content Writing"
6. "I need video editing" → primaryService: "Video Editing"

KEY DISTINCTIONS:
- "website" = Website Development (coding/building) NOT Design
- "logo" = Logo Design (visual design) NOT Development
- "UI/UX" = UI/UX Design (interface design) NOT Development
- "app" = Mobile App Development (coding) NOT Design
- "content" = Content Writing (text) NOT Design or Development

Fields:
- primaryService: EXACT service name matching what buyer said (e.g., "Website Development", "Logo Design", "UI/UX Design", "Mobile App Development", "Content Writing", "Video Editing")
- skills: ONLY specific technologies/tools mentioned (e.g., ["React", "Python", "Figma"])
- budget: {"min": number, "max": number} in USD, use 0 if not mentioned
- timeline: "urgent" | "1 week" | "2 weeks" | "1 month" | "flexible"
- keywords: Important terms from conversation (prioritize service-related)
- serviceCategory: "Web Development" | "Design" | "Mobile App" | "Writing" | "Video" | "Marketing" | "Programming"

Examples:
Input: "I need someone to build a website for my business"
Output: {"primaryService": "Website Development", "serviceCategory": "Web Development", "keywords": ["website", "web", "build", "development"], "skills": [], "budget": {"min": 0, "max": 0}, "timeline": "flexible"}

Input: "I need a logo designer"
Output: {"primaryService": "Logo Design", "serviceCategory": "Design", "keywords": ["logo", "designer", "design"], "skills": [], "budget": {"min": 0, "max": 0}, "timeline": "flexible"}

Input: "I need UI/UX design for my app"
Output: {"primaryService": "UI/UX Design", "serviceCategory": "Design", "keywords": ["ui", "ux", "design", "app"], "skills": [], "budget": {"min": 0, "max": 0}, "timeline": "flexible"}

Conversation:
${conversationText}

Return ONLY the JSON object:`;

    const modelsResponse = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`,
      { timeout: 10000 }
    );

    const availableModels = modelsResponse.data.models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));

    for (const modelName of availableModels) {
      try {
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

        const aiContent = geminiResponse.data.candidates[0].content.parts[0].text.trim();
        let cleanedContent = aiContent
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .replace(/^[^{]*/, '')
          .replace(/[^}]*$/, '')
          .trim();

        const requirements = JSON.parse(cleanedContent);
        return requirements;
      } catch (modelError) {
        console.log(`⚠️ Model ${modelName} failed:`, modelError.message);
        continue;
      }
    }
  } catch (error) {
    console.error('⚠️ Gemini API Error extracting requirements:', error.message);
  }

  return null;
};

// Get AI response using Gemini
const getAIResponse = async (conversationHistory, userMessage) => {
  if (!process.env.GEMINI_API_KEY) {
    return {
      role: 'bot',
      content: 'I understand you\'re looking for a freelancer. Could you tell me more about what you need? For example, what skills or services are you looking for?',
      timestamp: new Date()
    };
  }

  try {
    const systemPrompt = `You are a helpful AI assistant for FreelanceConnect, a platform connecting buyers with freelancers. Your role is to:
1. Have a friendly conversation with buyers
2. Understand what they're looking for (skills, budget, timeline, project details)
3. Ask clarifying questions if needed
4. Once you have enough information, acknowledge that you'll find matching freelancers

Keep responses conversational, helpful, and concise (2-3 sentences max).`;

    const conversationContext = conversationHistory
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.role === 'user' ? 'Buyer' : 'AI'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${conversationContext}\n\nBuyer: ${userMessage}\nAI:`;

    const modelsResponse = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`,
      { timeout: 10000 }
    );

    const availableModels = modelsResponse.data.models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));

    for (const modelName of availableModels) {
      try {
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: fullPrompt
              }]
            }]
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );

        const aiContent = geminiResponse.data.candidates[0].content.parts[0].text.trim();
        
        return {
          role: 'bot',
          content: aiContent,
          timestamp: new Date()
        };
      } catch (modelError) {
        console.log(`⚠️ Model ${modelName} failed:`, modelError.message);
        continue;
      }
    }
  } catch (error) {
    console.error('⚠️ Gemini API Error:', error.message);
  }

  // Fallback response
  return {
    role: 'bot',
    content: 'I understand you\'re looking for a freelancer. Could you tell me more about what you need?',
    timestamp: new Date()
  };
};

// Service category mapping for better matching
const serviceCategoryMap = {
  'web development': ['website', 'web', 'web development', 'web developer', 'website development', 'frontend', 'backend', 'full stack', 'fullstack'],
  'design': ['logo', 'logo design', 'ui', 'ux', 'ui/ux', 'ui ux', 'graphic design', 'designer', 'branding', 'visual design'],
  'mobile app': ['mobile app', 'mobile application', 'android', 'ios', 'react native', 'flutter', 'app development'],
  'programming': ['python', 'javascript', 'java', 'react', 'node', 'nodejs', 'developer', 'programming', 'coding'],
  'writing': ['content', 'content writing', 'copywriting', 'article', 'blog', 'writing', 'writer'],
  'video': ['video', 'video editing', 'video production', 'editing', 'video editor'],
  'marketing': ['seo', 'marketing', 'social media', 'digital marketing', 'advertising']
};

// Check if gig matches primary service category
const matchesPrimaryService = (gig, primaryService, serviceCategory) => {
  if (!primaryService && !serviceCategory) return { match: false, strength: 0 };
  
  const gigText = `${gig.title} ${gig.desc} ${gig.cat} ${gig.sortDesc || ''}`.toLowerCase();
  const primaryServiceLower = (primaryService || '').toLowerCase();
  const categoryLower = (serviceCategory || '').toLowerCase();
  
  // Exact primary service match (highest priority)
  if (primaryServiceLower && gigText.includes(primaryServiceLower)) {
    return { match: true, strength: 1.0 };
  }
  
  // Check category keywords
  if (categoryLower && serviceCategoryMap[categoryLower]) {
    const categoryKeywords = serviceCategoryMap[categoryLower];
    let matchedKeywords = 0;
    categoryKeywords.forEach(keyword => {
      if (gigText.includes(keyword.toLowerCase())) {
        matchedKeywords++;
      }
    });
    if (matchedKeywords > 0) {
      return { match: true, strength: Math.min(matchedKeywords / categoryKeywords.length, 0.9) };
    }
  }
  
  // Partial match on service category
  if (categoryLower && gigText.includes(categoryLower)) {
    return { match: true, strength: 0.6 };
  }
  
  return { match: false, strength: 0 };
};

// Match gigs based on requirements with accurate scoring
const matchGigs = async (requirements) => {
  try {
    if (!requirements) {
      return [];
    }

    const primaryService = requirements.primaryService || '';
    const serviceCategory = requirements.serviceCategory || '';
    const allSearchTerms = [
      ...(requirements.skills || []),
      ...(requirements.keywords || [])
    ].filter(term => term && term.trim().length > 0);

    if (allSearchTerms.length === 0 && !primaryService && !serviceCategory) {
      return [];
    }

    console.log('🔍 Searching gigs with:', { primaryService, serviceCategory, terms: allSearchTerms });

    // Build search query
    let searchConditions = [];
    let featureConditions = [];

    // Add keyword/skill search conditions
    if (allSearchTerms.length > 0) {
      searchConditions = allSearchTerms.map(term => ({
        $or: [
          { title: { $regex: term.trim(), $options: 'i' } },
          { desc: { $regex: term.trim(), $options: 'i' } },
          { cat: { $regex: term.trim(), $options: 'i' } },
          { sortDesc: { $regex: term.trim(), $options: 'i' } }
        ]
      }));

      featureConditions = allSearchTerms.map(term => ({
        features: { $regex: term.trim(), $options: 'i' }
      }));
    }

    // If we have primary service, search for it (this is critical)
    if (primaryService) {
      // Split primary service into words for better matching
      const serviceWords = primaryService.toLowerCase().split(/\s+/);
      serviceWords.forEach(word => {
        if (word.length > 2) { // Only search for words longer than 2 characters
          searchConditions.push({
            $or: [
              { title: { $regex: word, $options: 'i' } },
              { desc: { $regex: word, $options: 'i' } },
              { cat: { $regex: word, $options: 'i' } },
              { sortDesc: { $regex: word, $options: 'i' } }
            ]
          });
        }
      });
    }

    // If we have service category, also search for it
    if (serviceCategory) {
      const categoryWords = serviceCategory.toLowerCase().split(/\s+/);
      categoryWords.forEach(word => {
        if (word.length > 2) {
          searchConditions.push({
            $or: [
              { title: { $regex: word, $options: 'i' } },
              { desc: { $regex: word, $options: 'i' } },
              { cat: { $regex: word, $options: 'i' } }
            ]
          });
        }
      });
    }

    // Build the final query
    const queryConditions = [];
    if (searchConditions.length > 0) {
      queryConditions.push(...searchConditions);
    }
    if (featureConditions.length > 0) {
      queryConditions.push(...featureConditions);
    }

    let gigs = [];
    if (queryConditions.length > 0) {
      gigs = await Gig.find({
        $or: queryConditions
      }).limit(100);
    } else {
      // If no conditions, return empty (shouldn't happen, but safety check)
      console.log('⚠️ No search conditions, returning empty');
      return [];
    }

    console.log(`📊 Found ${gigs.length} potential gigs to score`);

    // Get seller information and calculate accurate scores
    const matches = await Promise.all(
      gigs.map(async (gig) => {
        try {
          const seller = await User.findById(gig.userId);
          
          // Check primary service match (CRITICAL - highest weight)
          const primaryMatch = matchesPrimaryService(gig, primaryService, serviceCategory);
          
          // If primary service doesn't match at all, significantly reduce score
          let baseScore = 0;
          let maxPossibleScore = 100;
          
          if (primaryService && !primaryMatch.match) {
            // Primary service mismatch - heavily penalize
            maxPossibleScore = 50; // Can't score above 50% if primary service doesn't match
          } else if (primaryMatch.match) {
            // Primary service matches - this is the foundation
            baseScore = primaryMatch.strength * 50; // Primary service match worth up to 50 points
          }
          
          const reasons = [];
          const allTerms = allSearchTerms.map(t => t.toLowerCase().trim());
          const gigText = `${gig.title} ${gig.desc} ${gig.cat} ${gig.sortDesc || ''}`.toLowerCase();
          const titleLower = gig.title.toLowerCase();
          const catLower = gig.cat.toLowerCase();
          
          let keywordScore = 0;
          let keywordMatches = 0;
          
          // Check for keyword matches with weighted scoring
          allTerms.forEach(term => {
            let termScore = 0;
            let termMatched = false;
            
            // Title match (most important for keywords)
            if (titleLower.includes(term)) {
              termScore += 15;
              termMatched = true;
              if (!reasons.includes('Title match')) reasons.push('Title match');
            }
            
            // Category match
            if (catLower.includes(term)) {
              termScore += 12;
              termMatched = true;
              if (!reasons.includes('Category match')) reasons.push('Category match');
            }
            
            // Description match
            if (gig.desc.toLowerCase().includes(term)) {
              termScore += 8;
              termMatched = true;
              if (!reasons.includes('Description match')) reasons.push('Description match');
            }
            
            // Features match
            if (gig.features && Array.isArray(gig.features)) {
              gig.features.forEach(feature => {
                if (feature.toLowerCase().includes(term)) {
                  termScore += 10;
                  termMatched = true;
                  if (!reasons.includes('Features match')) reasons.push('Features match');
                }
              });
            }
            
            if (termMatched) {
              keywordScore += termScore;
              keywordMatches++;
            }
          });
          
          // Normalize keyword score (max 30 points for perfect keyword matches)
          const keywordMatchRatio = allTerms.length > 0 ? keywordMatches / allTerms.length : 0;
          keywordScore = Math.min(keywordScore, 30) * keywordMatchRatio;
          
          // Budget match (if specified)
          let budgetScore = 0;
          if (requirements.budget && requirements.budget.max > 0) {
            const gigPrice = parseFloat(gig.price) || 0;
            if (gigPrice <= requirements.budget.max && gigPrice >= (requirements.budget.min || 0)) {
              budgetScore = 10;
              reasons.push('Budget match');
            } else if (gigPrice > requirements.budget.max * 1.5) {
              // Penalize if way over budget
              budgetScore = -5;
            }
          }
          
          // Calculate final score
          let finalScore = baseScore + keywordScore + budgetScore;
          
          // Apply max possible score cap
          finalScore = Math.min(finalScore, maxPossibleScore);
          
          // Ensure minimum score if there are any matches
          if (primaryMatch.match || keywordMatches > 0) {
            finalScore = Math.max(finalScore, 20); // Minimum 20% if there's any match
          } else {
            finalScore = 0; // No match at all
          }
          
          // Round to nearest integer
          finalScore = Math.round(finalScore);
          
          // Only return if score is meaningful (at least 25% to show more results)
          if (finalScore < 25) {
            return null;
          }
          
          return {
            gig: gig.toObject(),
            seller: seller ? {
              _id: seller._id,
              username: seller.username,
              img: seller.img,
              country: seller.country,
              isSeller: seller.isSeller
            } : null,
            score: finalScore,
            reasons: reasons.length > 0 ? reasons : ['Partial match']
          };
        } catch (err) {
          console.error('Error fetching seller for gig:', err);
          return null;
        }
      })
    );

    // Filter out nulls and low scores, then sort by score
    const validMatches = matches
      .filter(m => m !== null && m.score >= 25)
      .sort((a, b) => b.score - a.score);
    
    console.log(`✅ Found ${validMatches.length} valid matches (min 25% score)`);
    if (validMatches.length > 0) {
      console.log('Top matches:', validMatches.slice(0, 3).map(m => ({ 
        title: m.gig?.title || 'N/A', 
        score: m.score 
      })));
    } else {
      console.log('⚠️ No matches found. Requirements:', {
        primaryService: requirements.primaryService,
        serviceCategory: requirements.serviceCategory,
        skills: requirements.skills?.length || 0,
        keywords: requirements.keywords?.length || 0
      });
    }
    
    return validMatches.slice(0, 10); // Top 10 matches

  } catch (error) {
    console.error('Error matching gigs:', error);
    return [];
  }
};

// Start a new chat session
export const startChat = async (req, res, next) => {
  try {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const initialMessage = {
      role: 'bot',
      content: 'Hi! I\'m your AI assistant. I can help you find the perfect freelancer for your project. What are you looking for?',
      timestamp: new Date()
    };

    chatSessions.set(chatId, {
      messages: [initialMessage],
      requirements: null,
      userId: req.userId,
      createdAt: new Date()
    });

    res.status(200).send({
      success: true,
      chatId,
      message: initialMessage
    });
  } catch (error) {
    next(createError(500, 'Failed to start chat session'));
  }
};

// Send a message and get AI response
export const sendMessage = async (req, res, next) => {
  try {
    const { chatId, message } = req.body;

    if (!chatId || !message) {
      return next(createError(400, 'Chat ID and message are required'));
    }

    const session = chatSessions.get(chatId);
    if (!session) {
      return next(createError(404, 'Chat session not found'));
    }

    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    session.messages.push(userMessage);

    // Get AI response
    const aiResponse = await getAIResponse(session.messages, message);
    session.messages.push(aiResponse);

    // Extract requirements from conversation
    const requirements = await extractRequirements(session.messages);
    if (requirements) {
      session.requirements = requirements;
      console.log('📋 Extracted requirements:', requirements);
    }

    // Match gigs if we have requirements (primaryService, skills, or keywords)
    let matches = [];
    if (session.requirements && (
      session.requirements.primaryService ||
      (session.requirements.skills && session.requirements.skills.length > 0) ||
      (session.requirements.keywords && session.requirements.keywords.length > 0)
    )) {
      console.log('🔍 Matching gigs with requirements...', session.requirements);
      matches = await matchGigs(session.requirements);
      console.log(`✅ Found ${matches.length} matching gigs`);
    } else {
      // Try to extract basic keywords from the current message for quick matching
      const messageLower = message.toLowerCase();
      const commonKeywords = ['logo', 'design', 'website', 'web', 'app', 'developer', 'developer', 'python', 'react', 'node', 'mobile', 'android', 'ios', 'graphic', 'video', 'writing', 'translation', 'marketing', 'seo', 'content'];
      const foundKeywords = commonKeywords.filter(keyword => messageLower.includes(keyword));
      
      if (foundKeywords.length > 0) {
        console.log('🔍 Quick matching with keywords:', foundKeywords);
        const quickRequirements = {
          skills: foundKeywords,
          keywords: foundKeywords,
          budget: { min: 0, max: 0 },
          timeline: 'flexible'
        };
        matches = await matchGigs(quickRequirements);
        console.log(`✅ Found ${matches.length} quick matches`);
      }
    }

    res.status(200).send({
      message: aiResponse,
      requirements: session.requirements,
      matches: matches
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    next(createError(500, 'Failed to process message'));
  }
};

// Get matches for a chat session
export const getMatches = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const session = chatSessions.get(chatId);
    if (!session) {
      return next(createError(404, 'Chat session not found'));
    }

    let matches = [];
    if (session.requirements) {
      matches = await matchGigs(session.requirements);
    }

    res.status(200).send({
      matches,
      totalMatches: matches.length,
      requirements: session.requirements
    });
  } catch (error) {
    next(createError(500, 'Failed to get matches'));
  }
};

