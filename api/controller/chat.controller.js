import { verifyToken } from '../middelware/jwt.js';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';
import { matchFreelancersByPrompt } from './ai.controller.js';
import { processUserMessage, getInitialGreeting } from '../utils/aiConversationGemini.js';

// Start a new chat (conversation) for the authenticated user with the AI assistant
export const startChat = async (req, res, next) => {
  try {
    const userId = req.userId;
    const chatId = `chat_${Date.now()}`;
    
    // Get initial greeting from AI
    let greeting = 'Hello! I am your AI matching assistant. Tell me what you need and I will find freelancers for you.';
    try {
      greeting = await getInitialGreeting();
    } catch (err) {
      console.error('Error getting AI greeting:', err);
      // Fall back to default greeting
    }

    // create conversation document. sellerId set to 'ai' to indicate assistant
    const conv = new Conversation({
      id: chatId,
      sellerId: 'ai',
      buyerId: userId,
      readBySeller: false,
      readByBuyer: true,
      lastMessage: greeting
    });
    await conv.save();

    const message = {
      role: 'bot',
      content: greeting,
      timestamp: new Date()
    };
    // store bot's initial message as a Message document (userId 'ai')
    const botMsg = new Message({ conversationId: chatId, userId: 'ai', desc: message.content });
    await botMsg.save();

    return res.status(200).json({ success: true, chatId, message });
  } catch (err) {
    next(err);
  }
}

// Receive a user message, process through AI, extract requirements, and match freelancers
export const sendMessage = async (req, res, next) => {
  try {
    const { chatId, message } = req.body;
    const userId = req.userId;
    if(!chatId) return res.status(400).json({ error: 'chatId is required' });

    // store user message
    const userMsg = new Message({ conversationId: chatId, userId, desc: message });
    await userMsg.save();

    // update conversation lastMessage
    await Conversation.findOneAndUpdate({ id: chatId }, { lastMessage: message, readBySeller: false, readByBuyer: true });

    // Get conversation history for context
    const previousMessages = await Message.find({ conversationId: chatId }).sort({ createdAt: 1 }).lean();
    const conversationHistory = previousMessages.map(msg => ({
      role: msg.userId === 'ai' ? 'assistant' : 'user',
      content: msg.desc
    }));

    // Process message through AI to understand needs and get response
    let aiResult = {
      message: 'I understand. Let me help you find the right freelancer.',
      requirements: null,
      readyToMatch: false
    };

    try {
      aiResult = await processUserMessage(message, conversationHistory);
      console.log('[CHAT] AI result:', { 
        hasMessage: !!aiResult.message, 
        hasRequirements: !!aiResult.requirements,
        readyToMatch: aiResult.readyToMatch 
      });
    } catch (err) {
      console.error('[CHAT] Error processing message through AI:', err.message);
      console.error('[CHAT] Full error:', err);
      aiResult.message = 'I had trouble understanding that. Let me search for freelancers based on your message.';
      // Even if AI fails, try to match based on the raw message
      aiResult.readyToMatch = true;
    }

    // Store bot's response
    const botMsg = new Message({ conversationId: chatId, userId: 'ai', desc: aiResult.message });
    await botMsg.save();

    // Always attempt to match freelancers based on the user's message
    // This ensures we show results even if AI hasn't fully understood requirements
    let matches = [];
    try {
      // Use requirements description if available, otherwise use the original message
      const searchPrompt = aiResult.requirements?.description || message;
      matches = await matchFreelancersByPrompt(searchPrompt, 10);
      
      // If we found matches, update the bot message to mention them
      if (matches.length > 0 && !aiResult.message.includes('found') && !aiResult.message.includes('match')) {
        aiResult.message += ` I found ${matches.length} freelancer${matches.length > 1 ? 's' : ''} that match your needs.`;
      } else if (matches.length === 0) {
        aiResult.message += ' I couldn\'t find exact matches, but let me know more details about what you need.';
      }
    } catch (matchErr) {
      console.error('Error matching freelancers:', matchErr);
      // Continue even if matching fails
    }

    // Store matches in database
    if (matches.length > 0) {
      const matchesMsg = new Message({ conversationId: chatId, userId: 'ai', desc: JSON.stringify({ type: 'matches', matches }) });
      await matchesMsg.save();
    }

    return res.status(200).json({
      message: { role: 'bot', content: aiResult.message },
      requirements: aiResult.requirements,
      readyToMatch: aiResult.readyToMatch,
      matches: matches // Always include matches array (empty if no matches found)
    });
  } catch (err) {
    next(err);
  }
}

export const getMatches = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    // Find the most recent message that contains matches for this conversation
    const matchDoc = await Message.findOne({ conversationId: chatId, desc: { $regex: '"type":"matches"' } }).sort({ createdAt: -1 }).lean();
    if(!matchDoc) return res.status(200).json({ totalMatches: 0, matches: [] });
    let matches = [];
    try{ matches = JSON.parse(matchDoc.desc).matches || []; } catch(e){ matches = []; }
    return res.status(200).json({ totalMatches: matches.length, matches });
  } catch (err) {
    next(err);
  }
}

export default {
  startChat,
  sendMessage,
  getMatches
}
