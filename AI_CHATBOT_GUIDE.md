# AI Freelancer Chatbot - Setup & Testing Guide

## Overview
The AI Freelancer Chatbot is a fully functional system that lets users:
1. Start an AI chat session
2. Describe the type of freelancer they need (natural language)
3. Get keyword-matched freelancer recommendations from your MongoDB database
4. View details (score, matched keywords, seller info, gig price, rating)
5. Click through to the full gig details

## Architecture

### Backend (API)
- **Endpoint**: `POST /api/chat/start` — Initialize a new chat session (requires auth)
- **Endpoint**: `POST /api/chat/message` — Send a user prompt, get back bot response + matches (requires auth)
- **Endpoint**: `GET /api/chat/matches/:chatId` — Retrieve stored matches for a conversation
- **Keyword extraction** (api/utils/aiHelper.js): Removes stopwords, normalizes text, extracts meaningful keywords
- **Matching algorithm** (api/controller/ai.controller.js): 
  - Runs MongoDB `$text` search on gig title, description, features, category
  - Combines text score with keyword match ratio
  - Returns top 10 best-matching freelancers (one gig per seller)

### Frontend (React)
- **Component**: `client/src/components/AIChat/AIChat.jsx` — Chat UI with message history and match cards
- **Route**: `/ai-chat` — Accessible from the navbar or direct navigation
- **Features**:
  - Real-time message display (user/bot alternating)
  - Match cards showing score %, seller name, price, rating, matched keywords
  - Color-coded score badges (green > 80%, orange 60-80%, red < 60%)
  - Auto-scroll to latest message
  - Error handling and loading states
  - Responsive design (mobile-friendly)

### Data Model
- **Conversation** (existing model): Stores chat session with `sellerId: 'ai'`, `buyerId: userId`
- **Message** (existing model): Stores user/bot messages and match results as JSON
- **Gig** (existing model): Indexed with text search on title, desc, features, cat, sortTitle, sortDesc

## How to Test Locally

### 1. Ensure Backend is Running
```bash
cd /Users/aakankshsen/Desktop/FreelanceC/api
npx nodemon server.js
```
Expected output:
```
database connected
Mongoose connection: connected
Server listening on port 3000
```

### 2. Ensure Frontend is Running
```bash
cd /Users/aakankshsen/Desktop/FreelanceC/client
npm start
```
React dev server will open at http://localhost:3001 (or ask if you want to use a different port).

### 3. Login
- Go to http://localhost:3001/login
- Enter a valid username and password from your database
- You'll be redirected to home

### 4. Access the AI Chatbot
- Navigate to http://localhost:3001/ai-chat
- Or add a "AI Matcher" link to the navbar (optional) — I can add that if needed

### 5. Test the Chatbot
Example prompts:
- "I need a senior React developer for a 3-month SPA project with Redux"
- "Looking for a UI/UX designer with Figma and Adobe XD experience"
- "I need a Python developer to build a web scraper"
- "Senior full-stack MERN engineer needed for startup MVP"

You should see:
- Bot's initial greeting
- Your message echoed back
- A "Matched Freelancers" section with up to 5 cards
- Each card shows: gig title, % match score, seller name, price, rating, matched keywords, "View Gig" button

### 6. Manual Curl Test (backend only, no UI)
If you want to test the endpoint directly:

```bash
# Start a chat (replace <TOKEN> with a valid JWT from login)
curl -X POST 'http://localhost:3000/api/chat/start' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>'

# Response:
# {"success":true,"chatId":"chat_1699999999999","message":{"role":"bot","content":"Hello! I am your AI matching assistant..."}}

# Send a message (replace chatId and token)
curl -X POST 'http://localhost:3000/api/chat/message' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{"chatId":"chat_1699999999999","message":"I need a React developer"}'

# Response includes bot message and matches array
# {"message":{"role":"bot","content":"I found 5 matching freelancers..."},"matches":[{score:95,reasons:["React","developer"],seller:{...},gig:{...}},...]}'
```

## Customization & Improvements

### 1. Add AI Chatbot Link to Navbar
If you want a button in the navbar to jump to /ai-chat, I can add it to `client/src/components/Navbar/Navbar.jsx`.

### 2. Improve Matching Quality (Optional)
- **Add OpenAI parsing** (requires OPENAI_KEY): Extract structured requirements (skills, budget, timeline) from prompt and use them to filter/rank gigs more accurately.
- **Add embeddings**: Compute embeddings for gig titles/descriptions and do semantic similarity (higher cost but better accuracy).
- Currently using lightweight keyword extraction + MongoDB text search (fast, free, good baseline).

### 3. Persist Chat History
- Currently chats are stored in MongoDB and can be retrieved. To show past chats in UI, I can add a page `/chat-history` that lists all user's past conversations and lets them reopen them.

### 4. Add Filters Post-Match
- After matches are shown, allow user to filter by price range, seller rating, delivery time, etc.

### 5. Add More Context to Matches
- Show seller's total reviews, response time, completion rate
- Show availability/status
- Show sample reviews from past clients

## Troubleshooting

### "Network Error" on sending message
- Ensure API is running on port 3000 and client is configured to call it
- Check browser DevTools → Network tab → POST /chat/message → see status and response

### No matches returned
- Check if your MongoDB has gigs with content in title, desc, features, cat fields
- Try simpler prompts (e.g., "React") to test text search
- Confirm Gig model has the text index (should be created automatically on first write)

### Chat won't start
- Ensure you're logged in (have valid JWT in localStorage)
- Check browser console for error messages
- Check server logs for 401 or other errors

### Messages stored but matches empty
- The text search might not have found anything
- Try adding more test gigs to your DB with diverse keywords
- Or implement OpenAI-based semantic search (I can add that)

## Environment Variables (api/.env)
```
PORT=3000  # Must match client's baseURL
MONGO=mongodb+srv://...  # Your MongoDB connection
JWT_KEY=...  # Secret for signing JWTs
NODE_ENV=development
```

## Files Modified / Created
- `api/controller/ai.controller.js` — Refactored to export `matchFreelancersByPrompt` function
- `api/controller/chat.controller.js` — Updated to persist conversations, messages, and call AI matching
- `client/src/components/AIChat/AIChat.jsx` — New React component for chat UI
- `client/src/components/AIChat/aichat.scss` — Styles for chat UI
- `client/src/App.js` — Added /ai-chat route
- `api/models/gig.model.js` — Added text index on searchable fields

## Next Steps
1. Test the chatbot end-to-end and provide feedback
2. If matches are poor quality, I can implement LLM-based semantic matching (requires OPENAI_KEY)
3. Add chat history UI to view/manage past conversations
4. Add filters, sorting, and more details to match results
5. Add navbar link or integrate AI chat into existing message/chat pages

Enjoy your AI chatbot! 🚀
