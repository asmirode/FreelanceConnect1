import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './becomeseller.scss';
import newRequest from '../../utils/newRequest';

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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // debug: check whether server sees the auth cookie/token
    const checkServerAuth = async () => {
      try {
        const res = await newRequest.get('/auth/check');
        console.log('Server auth check:', res.data);
      } catch (err) {
        console.error('Error checking server auth:', err?.response || err);
      }
    };

    checkServerAuth();

    startNewChat();
  }, []);

  const startNewChat = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      setIsInitializing(true);
      
      const res = await newRequest.post('/chat/start');
      
      if (res.data.success) {
        setChatId(res.data.chatId);
        setMessages([res.data.message]);
        setAuthError(false);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      console.log('Error response:', error.response);
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true);
      } else {
        alert('Error starting chat. Please try again or login.');
        setAuthError(true);
      }
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

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

      if (res.data.readyToMatch) {
        setTimeout(() => getMatches(), 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true);
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
      
      const matchMessage = {
        role: 'bot',
        content: `Great! I found ${res.data.totalMatches} freelancers for you. Here are the top ${res.data.matches.length} matches:`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, matchMessage]);
    } catch (error) {
      console.error('Error getting matches:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (text) => {
    setInputMessage(text);
  };

  // Show loading while initializing
  if (isInitializing && !authError) {
    return (
      <div className="becomeseller">
        <div className="container">
          <div className="loading-container">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Initializing AI Assistant...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (authError) {
    return (
      <div className="becomeseller">
        <div className="container">
          <div className="auth-prompt">
            <h1>🔒 Authentication Required</h1>
            <p>Please login to use the AI Freelancer Matching feature</p>
            <div className="auth-actions">
              <button onClick={() => navigate('/login')} className="login-btn">
                Go to Login
              </button>
              <button onClick={() => navigate('/register')} className="register-btn">
                Create Account
              </button>
            </div>
            <Link to={'/'} className='back-link'>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="becomeseller">
      <div className="container">
        <div className="chatbot-header">
          <h1>AI Freelancer Matching</h1>
          <p>Tell me what you're looking for, and I'll find the perfect freelancer for you</p>
        </div>

        <div className="chat-container">
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'bot' ? 'AI' : 'You'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                  <div className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
          <div className="message bot">
            <div className="message-avatar">AI</div>
            <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

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

        {matches && matches.length > 0 && (
      <div className="matches-container">
        <h2>Matched Freelancers</h2>
            <div className="matches-grid">
              {matches.map((match, index) => (
                <div key={index} className="match-card">
                  <div className="match-header">
                    <img 
                      src={match.gig.cover || '/images/noavatar.jpg'} 
                      alt={match.gig.title}
                    />
                    <div className="match-score">
                      <span className="score-value">{match.score}</span>
                      <span className="score-label">Match Score</span>
                    </div>
                  </div>
                  <div className="match-content">
                    <h3>{match.gig.title}</h3>
                    <p className="match-desc">{match.gig.shortDesc}</p>
                    
                    <div className="match-reasons">
                      {match.matchReasons.map((reason, i) => (
                        <div key={i} className="reason">
                          {reason}
                        </div>
                      ))}
                    </div>

                    <div className="match-stats">
                      <div className="stat">
                        <span className="stat-value">⭐ {match.gig.totalStars && match.gig.starNumber ? (match.gig.totalStars / match.gig.starNumber).toFixed(1) : 'N/A'}</span>
                        <span className="stat-label">Rating</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">{match.gig.sales || 0}</span>
                        <span className="stat-label">Sales</span>
                      </div>
                      <div className="stat">
                        <span className="stat-value">${match.gig.price}</span>
                        <span className="stat-label">Starting at</span>
                      </div>
                    </div>

                    <button 
                      className="view-gig-btn"
                      onClick={() => navigate(`/gig/${match.gig._id}`)}
                    >
                      View Gig →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {requirements && requirements.skills && requirements.skills.length > 0 && (
          <div className="requirements-summary">
            <h3>📋 Your Requirements</h3>
            <div className="requirement-tags">
              {requirements.skills.map((skill, i) => (
                <span key={i} className="tag">{skill}</span>
              ))}
            </div>
            {requirements.budget && requirements.budget.max > 0 && (
              <p>💰 Budget: ${requirements.budget.min} - ${requirements.budget.max}</p>
            )}
            {requirements.timeline && requirements.timeline !== 'flexible' && (
              <p>⏰ Timeline: {requirements.timeline}</p>
            )}
          </div>
        )}

        <div className="chatbot-actions">
          <button onClick={startNewChat} className="new-chat-btn" disabled={loading}>
            Start New Search
          </button>
          <Link to={'/'} className='link back-link'>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BecomeSeller;