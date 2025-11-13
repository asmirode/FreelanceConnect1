import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * System prompt for the AI to understand user needs and extract requirements
 */
const SYSTEM_PROMPT = `You are an expert, friendly, and professional freelancer matching assistant for a freelance marketplace platform. Your role is to:

1. **Engage in natural, helpful conversations** - Be conversational, warm, and professional. Make users feel comfortable and understood.

2. **Understand project needs quickly** - Listen carefully to what users need and extract key information:
   - Skills/technologies required (e.g., React, Python, graphic design, UI/UX, web development, mobile apps, etc.)
   - Project type and scope
   - Any specific requirements or preferences

3. **Be proactive with matching** - If the user mentions ANY specific skills, technologies, or project types (like "React developer", "Python programmer", "UI/UX designer", "web developer", "logo designer", etc.), IMMEDIATELY extract those keywords and be ready to match.

4. **Response format** - ALWAYS respond with a JSON block at the end of your message in this exact format:
{
  "readyToMatch": true,
  "requirements": {
    "skills": ["extracted", "keywords", "from", "user", "message"],
    "description": "concise description of what the user needs"
  },
  "message": "Your friendly, conversational response here. Be natural and engaging."
}

**IMPORTANT RULES:**
- If the user mentions specific skills/technologies, ALWAYS set readyToMatch to true
- Extract ALL relevant keywords from the user's message
- Be conversational in your message - don't sound robotic
- Even if the message is vague, try to extract keywords and set readyToMatch to true
- Keep responses concise but friendly (2-3 sentences typically)
- Always end with the JSON block when you have extractable information

Example good response:
"Great! I understand you need a React developer for your project. Let me find the best React experts for you right away!

{
  "readyToMatch": true,
  "requirements": {
    "skills": ["react", "developer", "javascript"],
    "description": "React developer needed for web application"
  },
  "message": "Great! I understand you need a React developer for your project. Let me find the best React experts for you right away!"
}"`;

/**
 * Process user message through OpenAI and extract requirements
 * @param {string} userMessage - The user's message
 * @param {array} conversationHistory - Array of previous messages [{role, content}]
 * @returns {object} - {message: string, requirements: object, readyToMatch: boolean}
 */
export async function processUserMessage(userMessage, conversationHistory = []) {
  try {
    // Build messages array for OpenAI - include system prompt as first message
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for better quality at lower cost, or use 'gpt-4' for best quality
      max_tokens: 1024,
      temperature: 0.7, // Slightly creative but still focused
      messages: messages
    });

    const aiResponse = response.choices[0].message.content;

    // Try to extract JSON requirements from response
    let requirements = null;
    let readyToMatch = false;
    let cleanMessage = aiResponse;

    // Look for JSON block in the response (handle both single and multi-line JSON)
    // Try to find JSON that might be wrapped in code blocks or standalone
    let jsonMatch = aiResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/) || 
                    aiResponse.match(/```\s*(\{[\s\S]*?\})\s*```/) ||
                    aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const jsonString = jsonMatch[1] || jsonMatch[0]; // Use captured group or full match
        const parsed = JSON.parse(jsonString);
        if (parsed.requirements) {
          requirements = parsed.requirements;
          readyToMatch = parsed.readyToMatch || false;
          // Use the message from JSON if provided, otherwise use the full response
          cleanMessage = parsed.message || aiResponse.replace(jsonMatch[0], '').trim();
        }
      } catch (e) {
        // JSON parsing failed, use full response as message
        console.error('Failed to parse AI response JSON:', e);
        console.error('Response was:', aiResponse);
      }
    }

    return {
      message: cleanMessage,
      requirements,
      readyToMatch
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Get initial greeting message from AI
 */
export async function getInitialGreeting() {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for better quality at lower cost
      max_tokens: 256,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: 'Start a conversation to help me find the right freelancer for my project.'
        }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error getting initial greeting:', error);
    return 'Hello! I am your AI matching assistant. Tell me what you need and I will find freelancers for you.';
  }
}

export default {
  processUserMessage,
  getInitialGreeting
};
