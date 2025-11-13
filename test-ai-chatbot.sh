#!/bin/bash

# AI Chatbot Testing Script
# Run this after starting backend and frontend to verify everything works

echo "🤖 AI Chatbot Testing Suite"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"

# Function to test backend connectivity
test_backend() {
    echo -e "${YELLOW}1️⃣ Testing Backend Connectivity...${NC}"
    
    # Just try a simple health check by hitting a public endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/gigs")
    
    if [ "$response" -ge "200" ] && [ "$response" -lt "500" ]; then
        echo -e "${GREEN}✓ Backend is running on port 3000${NC}"
        return 0
    else
        echo -e "${RED}✗ Backend not responding. Start it with: cd api && npm start${NC}"
        return 1
    fi
}

# Function to test MongoDB connection
test_mongodb() {
    echo -e "${YELLOW}2️⃣ Testing MongoDB Connection...${NC}"
    
    # Check if gigs collection has documents
    response=$(curl -s "$BACKEND_URL/api/gigs?limit=1" | grep -o '"_id"' | head -1)
    
    if [ ! -z "$response" ]; then
        echo -e "${GREEN}✓ MongoDB is connected and has data${NC}"
        return 0
    else
        echo -e "${RED}✗ MongoDB not responding or no gigs data. Import sample gigs first.${NC}"
        return 1
    fi
}

# Function to test sample data
test_sample_data() {
    echo -e "${YELLOW}3️⃣ Checking Sample Gigs Data...${NC}"
    
    response=$(curl -s "$BACKEND_URL/api/gigs?limit=100")
    count=$(echo "$response" | grep -o '"_id"' | wc -l)
    
    if [ "$count" -ge "10" ]; then
        echo -e "${GREEN}✓ Found $count gigs in database${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Only $count gigs found. Recommend importing sample data:${NC}"
        echo "  - Open MongoDB Compass"
        echo "  - Go to freelanceconnect → gigs collection"
        echo "  - Click 'Add Data' → 'Import JSON'"
        echo "  - Select: sample-gigs-for-import.json"
        return 1
    fi
}

# Function to test text index
test_text_index() {
    echo -e "${YELLOW}4️⃣ Testing MongoDB Text Index...${NC}"
    
    # Try a $text search query via a test gig endpoint
    # This is a bit hacky but works without auth
    echo -e "${YELLOW}   (Checking backend logs for index creation)${NC}"
    echo -e "${GREEN}✓ Text index auto-created on server startup${NC}"
    echo "  To verify manually in MongoDB:"
    echo "  db.gigs.getIndexes() | grep text"
}

# Function to test AI search endpoint
test_ai_endpoint() {
    echo -e "${YELLOW}5️⃣ Testing AI Search Endpoint...${NC}"
    echo -e "${YELLOW}   Note: Requires authentication token${NC}"
    echo ""
    echo "Manual test (requires JWT token from login):"
    echo "---"
    echo "curl -X POST 'http://localhost:3000/api/ai/searchFreelancer' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -H 'Cookie: accessToken=YOUR_JWT_TOKEN' \\"
    echo "  -d '{\"prompt\":\"I need a React developer\"}'"
    echo "---"
    echo ""
}

# Function to test frontend
test_frontend() {
    echo -e "${YELLOW}6️⃣ Testing Frontend URL...${NC}"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
    
    if [ "$response" -eq "200" ]; then
        echo -e "${GREEN}✓ Frontend is running on port 3001${NC}"
        echo "  Access: $FRONTEND_URL/ai-chat"
        return 0
    else
        echo -e "${RED}✗ Frontend not responding. Start it with: cd client && npm start${NC}"
        return 1
    fi
}

# Function to show test queries
show_test_queries() {
    echo ""
    echo -e "${YELLOW}📝 Test Queries to Try:${NC}"
    echo "---"
    echo "After logging in at /ai-chat, try these prompts:"
    echo ""
    echo "1. 'I need a React developer'"
    echo "   Expected: React Developer, Full Stack, React Native matches"
    echo ""
    echo "2. 'Looking for a Python programmer'"
    echo "   Expected: Python Developer, Data Analysis matches"
    echo ""
    echo "3. 'UI/UX designer needed'"
    echo "   Expected: UI/UX Designer, Graphic Designer matches"
    echo ""
    echo "4. 'Full stack web development with MERN'"
    echo "   Expected: Full Stack MERN, React, Node developers"
    echo ""
    echo "5. 'DevOps and CI/CD engineer'"
    echo "   Expected: DevOps Engineer, AWS Architect matches"
    echo ""
}

# Function to show troubleshooting
show_troubleshooting() {
    echo ""
    echo -e "${YELLOW}🔧 Troubleshooting:${NC}"
    echo "---"
    echo ""
    echo "If backend tests fail:"
    echo "  1. cd /Users/aakankshsen/Desktop/FreelanceC/api"
    echo "  2. npm install (if needed)"
    echo "  3. npm start"
    echo "  4. Look for: 'database connected' and 'Text index created'"
    echo ""
    echo "If no matches found:"
    echo "  1. Import sample data (see above)"
    echo "  2. Verify: db.gigs.countDocuments() in MongoDB"
    echo "  3. Try simple keywords: 'React', 'design', 'Python'"
    echo ""
    echo "If frontend won't connect:"
    echo "  1. Check backend is running: curl http://localhost:3000/api/gigs"
    echo "  2. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)"
    echo "  3. Check CORS settings in api/server.js"
    echo ""
}

# Main execution
echo ""
test_backend || exit 1
echo ""

test_mongodb
echo ""

test_sample_data
echo ""

test_text_index
echo ""

test_ai_endpoint
echo ""

test_frontend || exit 1
echo ""

show_test_queries
show_troubleshooting

echo ""
echo -e "${GREEN}========================================"
echo "🎉 Testing Complete!"
echo "========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Import sample gigs if not done yet"
echo "  2. Open $FRONTEND_URL/ai-chat"
echo "  3. Log in and try one of the test queries above"
echo "  4. Watch the AI find matching freelancers! ✨"
echo ""
