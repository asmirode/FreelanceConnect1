# AI Chatbot - Architecture & Data Flow

## System Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                            │
│                    (Port 3001)                                 │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │         AIChat.jsx Component                            │  │
│  │                                                         │  │
│  │  User Types: "I need a React developer"                │  │
│  │              ↓                                          │  │
│  │        Sends to Backend                                │  │
│  │              ↓                                          │  │
│  │  Receives matches with scores                          │  │
│  │              ↓                                          │  │
│  │  Displays in GigCard components                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────┬─────────────────────────────────────────────┘
                 │ HTTP POST /api/chat/message
                 │
                 ↓
┌────────────────────────────────────────────────────────────────┐
│                   EXPRESS.JS BACKEND                          │
│                    (Port 3000)                                │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │     chat.controller.js                                  │ │
│  │                                                         │ │
│  │  1. Receive user message                              │ │
│  │  2. Call matchFreelancersByPrompt()                   │ │
│  │  3. Save message to MongoDB                           │ │
│  │  4. Save matches to MongoDB                           │ │
│  │  5. Return matches to frontend                        │ │
│  └──────────────┬───────────────────────────────────────┘ │
│                 │                                          │
│                 ↓                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │     ai.controller.js                                    │ │
│  │  matchFreelancersByPrompt()                             │ │
│  │                                                         │ │
│  │  ┌────────────────────────────────────────────────┐    │ │
│  │  │ Step 1: Extract Keywords                       │    │ │
│  │  │ Input: "I need a React developer for web"     │    │ │
│  │  │ Output: ["react", "developer", "web"]         │    │ │
│  │  │ (Uses aiHelper.js)                            │    │ │
│  │  └────────────────────────────────────────────────┘    │ │
│  │                 ↓                                       │ │
│  │  ┌────────────────────────────────────────────────┐    │ │
│  │  │ Step 2: MongoDB $text Search                   │    │ │
│  │  │ Query: db.gigs.find({$text: {...}})          │    │ │
│  │  │ Result: 50+ gigs matching keywords             │    │ │
│  │  │ Each with textScore (0-100)                    │    │ │
│  │  └────────────────────────────────────────────────┘    │ │
│  │                 ↓                                       │ │
│  │  ┌────────────────────────────────────────────────┐    │ │
│  │  │ Step 3: Score & Filter                        │    │ │
│  │  │ For each gig:                                  │    │ │
│  │  │   Score = (textScore × 0.7) +                 │    │ │
│  │  │            (keywordRatio × 100 × 0.3)         │    │ │
│  │  │ Remove duplicates (group by seller)            │    │ │
│  │  │ Sort by score                                  │    │ │
│  │  │ Limit to top 10                                │    │ │
│  │  └────────────────────────────────────────────────┘    │ │
│  │                 ↓                                       │ │
│  │  Return: [                                              │ │
│  │    {                                                    │ │
│  │      score: 95,                                        │ │
│  │      reasons: ["react", "developer"],                  │ │
│  │      seller: {_id, username, email},                   │ │
│  │      gig: {title, desc, price, ...}                    │ │
│  │    },                                                  │ │
│  │    ...                                                 │ │
│  │  ]                                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────┬─────────────────────────────────────────────┘
                 │ Save to DB
                 ↓
┌────────────────────────────────────────────────────────────────┐
│               MONGODB (freelanceconnect)                       │
│                                                                │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐│
│  │   Gigs       │  │ Conversations    │  │  Messages        ││
│  │              │  │                  │  │                  ││
│  │ _id: ...     │  │ _id: ...         │  │ _id: ...         ││
│  │ userId: ... │  │ id: "chat_1234" │  │ conversationId.. ││
│  │ title: ...   │  │ sellerId: "ai"  │  │ userId: ...      ││
│  │ desc: ...    │  │ buyerId: ...    │  │ desc: "message"  ││
│  │ features: [] │  │ readBySeller.. │  │ createdAt: ...   ││
│  │ [TEXT INDEX] │  │ readByBuyer..  │  │                  ││
│  └──────────────┘  │ lastMessage... │  │ OR:              ││
│                    │ createdAt: ...  │  │                  ││
│                    │ updatedAt: ...  │  │ desc: '{         ││
│                    └──────────────────┘  │  "type":"matches"││
│                                          │  "matches":[...] ││
│  ┌──────────────┐  ┌──────────────────┐ │ }'              ││
│  │   Users      │  │  Reviews         │ │                  ││
│  │              │  │                  │ └──────────────────┘│
│  │ _id: ...     │  │ ...              │                     │
│  │ username..  │  │                  │                     │
│  │ email...    │  │                  │                     │
│  │ isSeller... │  │                  │                     │
│  └──────────────┘  └──────────────────┘                     │
│                                                                │
│  TEXT INDEX ON GIGS:                                         │
│  "title_text_desc_text_features_text_cat_text_sortTitle.. │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

```
STEP 1: User Sends Message
────────────────────────────────
Frontend:
  POST /api/chat/message
  Body: {
    chatId: "chat_1234567890",
    message: "I need a React developer"
  }

STEP 2: Backend Processes
──────────────────────────
a) Extract keywords: ["react", "developer"]
b) Build search text: "react developer"
c) MongoDB query: $text: { $search: "react developer" }
d) Score results
e) Group by seller
f) Return top 10

STEP 3: Backend Stores
──────────────────────
Save to Messages collection:
  {
    conversationId: "chat_...",
    userId: "user123",
    desc: "I need a React developer"
  }
  {
    conversationId: "chat_...",
    userId: "ai",
    desc: "I found 3 matching freelancers..."
  }
  {
    conversationId: "chat_...",
    userId: "ai",
    desc: '{"type":"matches","matches":[...]}'
  }

STEP 4: Backend Returns
──────────────────────
Response:
  {
    message: {
      role: "bot",
      content: "I found 3 matching freelancers..."
    },
    matches: [
      {
        score: 95,
        reasons: ["react", "developer"],
        seller: {
          _id: "user1",
          username: "john_react",
          isSeller: true
        },
        gig: {
          _id: "gig1",
          title: "React Developer - Build Custom Components",
          desc: "Expert React developer...",
          price: "75",
          cover: "https://...",
          rating: 4.9
        }
      },
      // More matches...
    ]
  }

STEP 5: Frontend Displays
─────────────────────────
1. Show bot message bubble
2. Map matches to GigCard components
3. Add score badge to each card
4. Display seller info, rating, price
```

## Keyword Extraction Process

```
INPUT: "I need someone to build a professional React web app"

PROCESS:
1. Lowercase: "i need someone to build a professional react web app"
2. Remove punctuation: "i need someone to build a professional react web app"
3. Split into words: ["i", "need", "someone", "to", "build", "a", "professional", "react", "web", "app"]
4. Remove stopwords (120+ common words):
   - Remove: "i", "need", "someone", "to", "a"
   - Keep: "build", "professional", "react", "web", "app"
5. Deduplicate: ["build", "professional", "react", "web", "app"]
6. Return: ["build", "professional", "react", "web", "app"]

STOPWORDS REMOVED:
i, me, my, myself, we, our, ours, ourselves, you, your, yours, yourself, yourselves,
he, him, his, himself, she, her, hers, herself, it, its, itself, they, them, their,
theirs, themselves, what, which, who, whom, why, how, all, each, every, both, few,
more, most, other, some, such, no, nor, not, only, same, so, than, too, very, s, t,
can, will, just, don, should, now, a, as, at, be, by, for, from, in, into, of, on,
or, to, with, is, am, are, being, have, has, having, do, does, doing, would, could,
ought, been, if, these, those, this, that
```

## Scoring Example

```
USER PROMPT: "I need a web developer with React and Node"
KEYWORDS EXTRACTED: ["web", "developer", "react", "node"]

GIG 1: "React Developer - Build Custom Components"
  Text Score: 55 (matched "react", "developer")
  Keywords Matched: 2/4 (react ✓, developer ✓, web ✗, node ✗)
  Keyword Ratio: 50%
  Final Score: (55 × 0.7) + (50 × 0.3) = 38.5 + 15 = 53.5

GIG 2: "Full Stack MERN Developer - React and Node.js"
  Text Score: 70 (matched "react", "node", "developer")
  Keywords Matched: 3/4 (react ✓, developer ✓, web ✗, node ✓)
  Keyword Ratio: 75%
  Final Score: (70 × 0.7) + (75 × 0.3) = 49 + 22.5 = 71.5 ⭐

GIG 3: "Node.js Backend Specialist - Express APIs"
  Text Score: 45 (matched "node", "developer" implicit)
  Keywords Matched: 2/4 (react ✗, developer ✗, web ✗, node ✓)
  Keyword Ratio: 25%
  Final Score: (45 × 0.7) + (25 × 0.3) = 31.5 + 7.5 = 39

GIG 4: "Graphic Designer - Logo & Branding"
  Text Score: 0 (no keyword matches)
  Keywords Matched: 0/4
  Keyword Ratio: 0%
  Final Score: 0 ✗

RANKING:
1. GIG 2: 71.5 ⭐⭐⭐
2. GIG 1: 53.5 ⭐⭐
3. GIG 3: 39 ⭐
4. GIG 4: 0 ✗
```

## Data Model Relationships

```
User (1) ──────→ (Many) Gigs
  |
  ├──→ Is Seller for → Gigs
  ├──→ Is Buyer for → Conversations (buyerId)
  └──→ Leaves → Reviews

Conversation (1) ──────→ (Many) Messages
  |
  ├── sellerId: "ai" (special value for AI assistant)
  ├── buyerId: userId (the user chatting)
  └── Messages[]:
      ├── User messages (userId = actual user)
      └── Bot messages (userId = "ai")

Gig (1) ────→ User (userId)
 |
 ├── Has text index on: title, desc, features, cat, sortTitle, sortDesc
 ├── Used by: AI matching algorithm
 └── Referenced in: Match results
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    App.js                                   │
│         (Main Router)                                        │
│                                                              │
│  Routes: /, /gigs, /gig/:id, /ai-chat, /login, etc.        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├─→ Home.jsx
                   ├─→ Gigs.jsx
                   ├─→ GigCard.jsx ←─────────────────────┐
                   ├─→ Login.jsx                         │
                   │                                      │
                   └─→ AIChat.jsx ◄──── Uses GigCard ────┘
                       │
                       ├─ useState: messages, matches, chatId
                       ├─ useEffect: startChat on mount
                       ├─ handleSendMessage()
                       │  └─→ newRequest POST /chat/message
                       │     └─→ Updates state with matches
                       └─ Renders:
                          ├─ Message bubbles
                          ├─ Input form
                          └─ GigCard components (for matches)

newRequest.js (Axios Config)
  │
  ├─ Base URL: http://localhost:3000/api/
  └─ Headers: Authorization, Content-Type
```

---

This architecture ensures:
- ✅ Efficient keyword extraction
- ✅ Fast MongoDB text search
- ✅ Accurate relevance scoring
- ✅ Persistent chat history
- ✅ Beautiful, consistent UI
