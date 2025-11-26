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

    const prompt = `Analyze this conversation between a buyer and an AI assistant about finding freelancers. Extract ALL relevant keywords, skills, services, and requirements mentioned by the buyer.

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):

{
  "skills": ["skill1", "skill2", "skill3"],
  "budget": {"min": 0, "max": 0},
  "timeline": "flexible",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}

Rules:
- skills: Array of technical skills, technologies, services, or tools mentioned (e.g., ["React", "Node.js", "Logo Design", "Web Development", "Python", "Mobile App"])
- budget: Object with min and max in USD (use 0 if not mentioned)
- timeline: "urgent", "1 week", "2 weeks", "1 month", "flexible" (default to "flexible")
- keywords: Array of ALL important keywords, services, technologies, and terms from the conversation (extract as many as possible, including variations like "logo", "logo design", "designer", "design", "website", "web", "app", "application", etc.)

IMPORTANT: Extract ALL keywords and skills mentioned. If someone says "I need a logo designer", extract: ["logo", "logo design", "designer", "design"]. If they say "React developer", extract: ["React", "developer", "web development", "frontend"].

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

// Match gigs based on requirements
const matchGigs = async (requirements) => {
  try {
    if (!requirements) {
      return [];
    }

    // Combine all search terms from skills and keywords
    const allSearchTerms = [
      ...(requirements.skills || []),
      ...(requirements.keywords || [])
    ].filter(term => term && term.trim().length > 0);

    if (allSearchTerms.length === 0) {
      return [];
    }

    console.log('🔍 Searching gigs with terms:', allSearchTerms);

    // Build search query - search for ANY of the terms in title, desc, or cat
    const searchConditions = allSearchTerms.map(term => ({
      $or: [
        { title: { $regex: term.trim(), $options: 'i' } },
        { desc: { $regex: term.trim(), $options: 'i' } },
        { cat: { $regex: term.trim(), $options: 'i' } },
        { sortDesc: { $regex: term.trim(), $options: 'i' } }
      ]
    }));

    // Also check features array
    const featureConditions = allSearchTerms.map(term => ({
      features: { $regex: term.trim(), $options: 'i' }
    }));

    // Search gigs - match if ANY term appears in title, desc, cat, or features
    const gigs = await Gig.find({
      $or: [
        ...searchConditions,
        ...featureConditions
      ]
    }).limit(50); // Get more results to score and filter

    // Get seller information for each gig
    const matches = await Promise.all(
      gigs.map(async (gig) => {
        try {
          const seller = await User.findById(gig.userId);
          
          // Calculate match score based on ALL search terms (skills + keywords)
          let score = 0;
          const reasons = [];
          const allTerms = [
            ...(requirements.skills || []),
            ...(requirements.keywords || [])
          ].map(t => t.toLowerCase().trim());

          // Check title match - higher weight for exact matches
          const titleLower = gig.title.toLowerCase();
          allTerms.forEach(term => {
            if (titleLower.includes(term)) {
              score += term.length > 5 ? 35 : 30; // Higher score for longer, more specific terms
              if (!reasons.includes('Title match')) reasons.push('Title match');
            }
          });

          // Check description match
          const descLower = gig.desc.toLowerCase();
          allTerms.forEach(term => {
            if (descLower.includes(term)) {
              score += 25;
              if (!reasons.includes('Description match')) reasons.push('Description match');
            }
          });

          // Check category match
          const catLower = gig.cat.toLowerCase();
          allTerms.forEach(term => {
            if (catLower.includes(term)) {
              score += 20;
              if (!reasons.includes('Category match')) reasons.push('Category match');
            }
          });

          // Check sortDesc match
          if (gig.sortDesc) {
            const sortDescLower = gig.sortDesc.toLowerCase();
            allTerms.forEach(term => {
              if (sortDescLower.includes(term)) {
                score += 20;
                if (!reasons.includes('Summary match')) reasons.push('Summary match');
              }
            });
          }

          // Check features match
          if (gig.features && Array.isArray(gig.features)) {
            gig.features.forEach(feature => {
              const featureLower = feature.toLowerCase();
              allTerms.forEach(term => {
                if (featureLower.includes(term)) {
                  score += 25;
                  if (!reasons.includes('Features match')) reasons.push('Features match');
                }
              });
            });
          }

          // Budget check (if specified)
          if (requirements.budget && requirements.budget.max > 0) {
            const gigPrice = parseFloat(gig.price) || 0;
            if (gigPrice <= requirements.budget.max && gigPrice >= (requirements.budget.min || 0)) {
              score += 15;
              if (!reasons.includes('Budget match')) reasons.push('Budget match');
            }
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
            score: Math.min(score, 100),
            reasons: reasons.length > 0 ? reasons : ['General match']
          };
        } catch (err) {
          console.error('Error fetching seller for gig:', err);
          return null;
        }
      })
    );

    // Filter out nulls and sort by score
    return matches
      .filter(m => m !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10 matches

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

    // Match gigs if we have requirements (skills or keywords)
    let matches = [];
    if (session.requirements && (
      (session.requirements.skills && session.requirements.skills.length > 0) ||
      (session.requirements.keywords && session.requirements.keywords.length > 0)
    )) {
      console.log('🔍 Matching gigs with requirements...');
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

