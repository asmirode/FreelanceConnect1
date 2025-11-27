import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './becomeseller.scss';
import newRequest from '../../utils/newRequest';
import GigCard from '../GigCard/GigCard';

const BecomeSeller = () => {
  const navigate = useNavigate();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState(null);
  const [requirements, setRequirements] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // NEW — fullscreen support
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    // Use browser fullscreen API for true fullscreen
    if (!isFullscreen) {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.log('Fullscreen error:', err);
          // Fallback to CSS fullscreen
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const messagesEndRef = useRef(null);
  const chatInitializedRef = useRef(false);
  const messagesContainerRef = useRef(null);
  const prevMatchesLengthRef = useRef(0);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? "smooth" : "auto",
        block: "end"
      });
    }
  };

  // Only scroll chat when new messages arrive (not on every render)
  const prevMessagesLengthRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && messages.length > 0) {
      prevMessagesLengthRef.current = messages.length;
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        scrollToBottom(true);
      }, 150);
    }
  }, [messages.length]); // Only depend on messages length, not the array itself

  // Scroll to recommendations when they appear (only once when they first appear)
  useEffect(() => {
    if (matches && matches.length > 0 && matches.length !== prevMatchesLengthRef.current) {
      prevMatchesLengthRef.current = matches.length;
      // Scroll to recommendations section after a delay
      setTimeout(() => {
        const recommendationsSection = document.querySelector('.recommended-gigs-section');
        if (recommendationsSection) {
          recommendationsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 800);
    }
  }, [matches?.length]);

  // Check user authentication from localStorage first
  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr && userStr !== 'null') {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        
        // Check if user is a seller - this page is for buyers only
        if (user.isSeller) {
          setAuthError(true);
          setIsInitializing(false);
          return;
        }
        
        // User is a buyer (not seller) - allow access
        setAuthError(false);
        setIsInitializing(false);
      } catch (err) {
        console.error('Error parsing user:', err);
        setAuthError(true);
        setIsInitializing(false);
      }
    } else {
      // No user logged in
      setAuthError(true);
      setIsInitializing(false);
    }
  }, []);

  // Initialize chat when currentUser is set and is a buyer
  useEffect(() => {
    if (currentUser && !currentUser.isSeller && !authError && !chatInitializedRef.current) {
      chatInitializedRef.current = true;
      startNewChat();
    }
  }, [currentUser, authError]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Allow ESC key to exit fullscreen
  useEffect(() => {
    const onKeyPress = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    };
    window.addEventListener("keydown", onKeyPress);
    return () => window.removeEventListener("keydown", onKeyPress);
  }, [isFullscreen]);

  const startNewChat = async () => {
    // Only proceed if user is logged in and is a buyer
    if (!currentUser || currentUser.isSeller) {
      return;
    }

    try {
      setLoading(true);
      setAuthError(false);
      chatInitializedRef.current = true;
      
      // Reset chat state for new chat
      setMatches(null);
      setRequirements(null);
      setChatId(null);

      const res = await newRequest.post('/chat/start');

      if (res.data.success) {
        setChatId(res.data.chatId);
        setMessages([res.data.message]);
        setAuthError(false);
      }
    } catch (error) {
      console.error('Error starting chat:', error);

      // If route doesn't exist (404), show a friendly message
      if (error.response?.status === 404) {
        setMessages([{
          role: 'bot',
          content: 'Welcome to AI Freelancer Matching! This feature is currently being set up. Please check back soon.',
          timestamp: new Date()
        }]);
        setLoading(false);
        return;
      }

      if (error.response?.status === 401 || error.response?.status === 403) {
        // Token might be expired, clear localStorage and show login
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        setAuthError(true);
      } else {
        // Other errors - show friendly message
        setMessages([{
          role: 'bot',
          content: 'Welcome! I\'m here to help you find the perfect freelancer. Tell me what you\'re looking for!',
          timestamp: new Date()
        }]);
      }
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    // Check if user is still authenticated
    if (!currentUser || currentUser.isSeller) {
      setAuthError(true);
      return;
    }

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await newRequest.post('/chat/message', {
        chatId,
        message: inputMessage
      });

      setMessages(prev => [...prev, res.data.message]);
      setRequirements(res.data.requirements);

      if (res.data.matches && res.data.matches.length > 0) {
        console.log('✅ Setting matches:', res.data.matches.length, 'matches found');
        setMatches(res.data.matches);

        const allMatchedKeywords = new Set();
        res.data.matches.forEach(match => {
          if (match.reasons) {
            match.reasons.forEach(k => allMatchedKeywords.add(k));
          }
        });

        if (allMatchedKeywords.size > 0) {
          const keywordsMsg = {
            role: 'bot',
            content: `Matched on: ${Array.from(allMatchedKeywords).join(', ')}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, keywordsMsg]);
        }
      } else {
        console.log('No matches found');
        setMatches([]);
      }
    } catch (error) {
      console.error('Error:', error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        // Token expired, clear and show login
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
        setAuthError(true);
      } else if (error.response?.status === 404) {
        // Route doesn't exist yet
        setMessages(prev => [...prev, {
          role: 'bot',
          content: 'I received your message! The AI matching feature is being set up. Please check back soon.',
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'bot',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date()
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getMatches = async () => {
    try {
      setLoading(true);
      const res = await newRequest.get(`/chat/matches/${chatId}`);
      setMatches(res.data.matches);

      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          content: `Great! I found ${res.data.totalMatches} freelancers for you.`,
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      if (error.response?.status === 401) {
        setAuthError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (text) => {
    setInputMessage(text);
  };

  if (isInitializing && !authError) {
    return (
      <div className="becomeseller">
        <div className="container">
          <div className="loading-container">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
            <p>Initializing AI Assistant...</p>
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    // Check if user is a seller (buyers only page)
    if (currentUser && currentUser.isSeller) {
      return (
        <div className="becomeseller">
          <div className="container">
            <div className="auth-prompt">
              <h1>🚫 Access Restricted</h1>
              <p>AI Matching is exclusively for buyers to find freelancers.</p>
              <p>As a seller, you can browse and manage your gigs from your dashboard.</p>
              <div className="auth-actions">
                <button onClick={() => navigate('/mygigs')} className="login-btn">Go to My Gigs</button>
                <button onClick={() => navigate('/')} className="register-btn">Back to Home</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // User not logged in
    return (
      <div className="becomeseller">
        <div className="container">
          <div className="auth-prompt">
            <h1>🔒 Authentication Required</h1>
            <p>Please login as a buyer to use AI Matching</p>
            <p>This feature helps buyers find the perfect freelancers for their projects.</p>
            <div className="auth-actions">
              <button onClick={() => navigate('/login')} className="login-btn">Login</button>
              <button onClick={() => navigate('/register')} className="register-btn">Register</button>
            </div>
            <Link to="/" className="back-link">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`becomeseller ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="container">

        {/* Header with fullscreen button */}
        <div className="chatbot-header">
          <div className="chatbot-header-left">
            <h1>AI Freelancer Matching</h1>
            <p>Tell me what you're looking for</p>
          </div>

          <div className="chatbot-header-actions">
            <button
              className={`fullscreen-toggle ${isFullscreen ? 'active' : ''}`}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? '✕' : '⤢'}
            </button>
          </div>
        </div>

        <div className="chat-container">
          <div className="messages" ref={messagesContainerRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'bot' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message bot">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && !loading && (
            <div className="quick-replies">
              <p>Quick suggestions:</p>
              <button onClick={() => handleQuickReply('I need a Python developer for web scraping')}>
                Python Developer
              </button>
              <button onClick={() => handleQuickReply('Looking for a React developer for my website')}>
                React Developer
              </button>
              <button onClick={() => handleQuickReply('Need a designer for my logo')}>
                Logo Designer
              </button>
              <button onClick={() => handleQuickReply('Want someone to build a mobile app')}>
                Mobile App Developer
              </button>
            </div>
          )}

          {/* Input */}
          <div className="message-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(e)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !inputMessage.trim()}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Requirements Summary with Recommended Gigs */}
        {requirements && (requirements.skills?.length > 0 || requirements.keywords?.length > 0 || requirements.primaryService) && (
          <div className="requirements-summary">
            <h3>📋 Your Requirements</h3>
            {requirements.primaryService && (
              <div style={{ marginBottom: '15px' }}>
                <p style={{ fontWeight: 500, color: '#1dbf73', fontSize: '16px' }}>
                  🎯 Primary Service: <span style={{ color: '#333' }}>{requirements.primaryService}</span>
                </p>
              </div>
            )}
            {(requirements.skills?.length > 0 || requirements.keywords?.length > 0) && (
            <div className="requirement-tags">
                {requirements.skills?.map((skill, i) => (
                  <span key={`skill-${i}`} className="tag">{skill}</span>
                ))}
                {requirements.keywords?.map((keyword, i) => (
                  <span key={`keyword-${i}`} className="tag">{keyword}</span>
              ))}
            </div>
            )}
            {requirements.budget && requirements.budget.max > 0 && (
              <p>💰 Budget: ${requirements.budget.min} - ${requirements.budget.max}</p>
            )}
            {requirements.timeline && requirements.timeline !== 'flexible' && (
              <p>⏰ Timeline: {requirements.timeline}</p>
            )}

            {/* Recommended Freelancers inside Requirements Section */}
            {matches && matches.length > 0 ? (
              <div className="recommended-gigs-section">
                <h4>🎯 Top Recommended Freelancers</h4>
                <p className="recommended-subtitle">Based on your requirements</p>
                <div className="recommended-gigs-cards">
                  {matches.map((match, index) => {
                    const gig = match.gig || match || {};
                    const seller = match.seller || {};
                    const score = match.score || 0;

                    if (!gig || !gig._id) {
                      return null;
                    }

                    return (
                      <div key={gig._id || index} className="recommended-gig-wrapper">
                        <div className="match-score-badge" style={{
                          backgroundColor:
                            score > 80
                              ? '#27ae60'
                              : score > 60
                              ? '#f39c12'
                              : '#e74c3c',
                        }}>
                          {score}% Match
                        </div>
                        <GigCard item={gig} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="recommended-gigs-section">
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No matches found yet. Keep chatting with the AI to get recommendations!
                </p>
              </div>
            )}
          </div>
        )}

        <div className="chatbot-actions">
          <button onClick={startNewChat} className="new-chat-btn" disabled={loading}>
            Start New Search
          </button>

          <Link to="/" className="link back-link">
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
};

export default BecomeSeller;