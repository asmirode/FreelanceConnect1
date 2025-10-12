import { verifyToken } from '../middelware/jwt.js';
// Simple mock chat controller for dev/testing
export const startChat = async (req, res, next) => {
  try {
    // Return a mock chat session and initial bot message
    const chatId = `chat_${Date.now()}`;
    const message = {
      role: 'bot',
      content: 'Hello! I am your AI matching assistant. Tell me what you need and I will find freelancers for you.',
      timestamp: new Date()
    };
    return res.status(200).json({ success: true, chatId, message });
  } catch (err) {
    next(err);
  }
}

export const sendMessage = async (req, res, next) => {
  try {
    const { chatId, message } = req.body;
    // Simple echo + pretend processing delay
    const botMessage = {
      role: 'bot',
      content: `I received: "${message}". I can search for freelancers when you're ready.`,
      timestamp: new Date()
    };
    // For demo: if user message contains the word "match" return readyToMatch
    const readyToMatch = typeof message === 'string' && message.toLowerCase().includes('match');
    const requirements = { skills: ['example-skill'], budget: { min: 50, max: 500 }, timeline: 'flexible' };
    return res.status(200).json({ message: botMessage, readyToMatch, requirements });
  } catch (err) {
    next(err);
  }
}

export const getMatches = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    // Return mock matches
    const matches = [
      { score: 95, gig: { _id: 'g1', title: 'React Developer', shortDesc: 'Build UI', cover: '', totalStars: 45, starNumber: 10, sales: 12, price: 200 }, matchReasons: ['React', 'UI'] },
      { score: 88, gig: { _id: 'g2', title: 'Python Scraper', shortDesc: 'Web scraping', cover: '', totalStars: 30, starNumber: 8, sales: 7, price: 150 }, matchReasons: ['Python', 'Scraping'] }
    ];
    return res.status(200).json({ totalMatches: matches.length, matches });
  } catch (err) {
    next(err);
  }
}

// Export a middleware-wrapped route helper if needed (not used directly)
export default {
  startChat,
  sendMessage,
  getMatches
}
