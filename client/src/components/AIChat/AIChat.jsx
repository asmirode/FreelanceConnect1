import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './aichat.scss';
import newRequest from '../../utils/newRequest';
import GigCard from '../GigCard/GigCard';

const AIChat = () => {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Initialize chat on mount
  useEffect(() => {
    const startNewChat = async () => {
      try {
        setError(null);
        const res = await newRequest.post('/chat/start');
        setChatId(res.data.chatId);
        setMessages([{ role: 'bot', content: res.data.message.content, timestamp: new Date() }]);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to start chat:', err);
        // Check if error is due to authentication
        if (err.response?.status === 401) {
          setError('You must be logged in to use the AI Freelancer Matcher. Please log in first.');
          setIsAuthenticated(false);
        } else {
          setError('Failed to start chat. Please try again.');
          setIsAuthenticated(true); // Assume authenticated for other errors
        }
      }
    };
    startNewChat();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, matches]);

  // Handle fullscreen effect
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [isFullScreen]);

  // Debug: log matches when they update so devs can inspect shapes in console
  useEffect(() => {
    if (matches && matches.length > 0) {
      // eslint-disable-next-line no-console
      console.debug('AIChat matches:', matches);
    }
  }, [matches]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId || loading || !isAuthenticated) return;

    const userMsg = input.trim();
    setInput('');
    setLoading(true);
    setError(null);

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);

    try {
      const res = await newRequest.post('/chat/message', { chatId, message: userMsg });
      
      // Add bot message
      setMessages(prev => [...prev, { role: 'bot', content: res.data.message.content, timestamp: new Date() }]);
      
      // Store matches
      if (res.data.matches && res.data.matches.length > 0) {
        setMatches(res.data.matches);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Handle authentication error
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setIsAuthenticated(false);
      } else {
        setError(err?.response?.data || err.message || 'Failed to send message');
      }
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I encountered an error processing your request.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`aichat-container ${isFullScreen ? 'fullscreen' : ''}`}>
      <div className="aichat-header">
        <h2>AI Freelancer Matcher</h2>
        <p>Describe the type of freelancer you need and I'll find the best matches for you.</p>
        <button 
          className="fullscreen-btn"
          onClick={() => setIsFullScreen(!isFullScreen)}
          title={isFullScreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullScreen ? '⛔' : '🔆'}
        </button>
      </div>

      {!isAuthenticated && (
        <div className="auth-required-message">
          <div className="auth-prompt">
            <h3>Login Required</h3>
            <p>You must be logged in to use the AI Freelancer Matcher.</p>
            <button onClick={() => navigate('/login')} className="login-btn">
              Go to Login
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <>
          <div className="aichat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className={`message-bubble ${msg.role}`}>
                  <p>{msg.content}</p>
                  <small className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</small>
                </div>
              </div>
            ))}

            {matches.length > 0 && (
              <div className="matches-section">
                <h3>Recommended Freelancers</h3>
                <div className="matches-list">
                  {matches.slice(0, 5).map((match, idx) => (
                    <div key={idx} className="match-card-wrapper">
                      <div className="score-overlay">
                        <span className="score-badge" style={{ backgroundColor: match.score > 80 ? '#27ae60' : match.score > 60 ? '#f39c12' : '#e74c3c' }}>
                          {match.score}% match
                        </span>
                      </div>

                      {/* If a gig object exists, render the GigCard (same as search results). */}
                      {match.gig && match.gig._id ? (
                        // pass seller data to avoid an extra protected user fetch
                        <GigCard item={match.gig} sellerOverride={match.seller} />
                      ) : (
                        /* Fallback: render a lightweight seller/freelancer card when gig is missing */
                        <div className="seller-fallback-card">
                          <div className="seller-info">
                            <img src={(match.seller && match.seller.img) || '/images/noavtar.jpeg'} alt="seller" />
                            <div className="seller-meta">
                              <h4>{(match.seller && match.seller.username) || 'Unknown Freelancer'}</h4>
                              {match.seller && match.seller.desc && <p className="seller-desc">{match.seller.desc}</p>}
                              <a className="view-profile" href={`/users/${match.seller?._id || ''}`}>View profile</a>
                            </div>
                          </div>
                        </div>
                      )}

                      {match.reasons && match.reasons.length > 0 && (
                        <div className="match-reasons">
                          <p><strong>Match Score:</strong> {match.score}%</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
            {loading && <div className="loading-message">Searching for matches...</div>}
            <div ref={messagesEndRef} />
          </div>

          <form className="aichat-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="E.g., 'I need a React developer for a 3-month project' or 'Looking for a UX designer with Figma experience'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? 'Searching...' : 'Send'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default AIChat;
