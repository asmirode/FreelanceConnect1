import React, { useState, useEffect } from 'react';
import './aiUpskilling.scss';
import newRequest from '../../utils/newRequest';

const AiUpskilling = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(user);

    // Get user skills from either skills array or selectedDomain
    const userSkills = Array.isArray(user?.skills) && user.skills.length > 0
      ? user.skills
      : (user?.selectedDomain ? [user.selectedDomain] : []);

    setSkills(userSkills);

    // Auto-fetch if user is seller and has skills
    if (user?.isSeller && userSkills.length > 0) {
      fetchCourseSuggestions(userSkills);
    }
  }, []);

  const fetchCourseSuggestions = async (selectedSkills) => {
    setLoading(true);
    setError(null);
    setCourses([]);
    
    try {
      console.log('Fetching AI course recommendations for skills:', selectedSkills);
      
      const response = await newRequest.post('/upskilling/courses', {
        skills: selectedSkills
      });
      
      console.log('AI recommendations received:', response.data);
      setCourses(response.data.courses || []);
      
    } catch (err) {
      console.error('Error fetching course suggestions:', err);
      
      let errorMessage = 'Failed to load AI course suggestions. ';
      
      if (err.response?.status === 429) {
        errorMessage += 'Rate limit exceeded. Please try again in a few minutes.';
      } else if (err.response?.status === 500) {
        errorMessage += 'AI service temporarily unavailable. Please try again later.';
      } else if (err.response?.data) {
        errorMessage += err.response.data;
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (skills.length > 0) {
      fetchCourseSuggestions(skills);
    }
  };

  return (
    <div className='ai-upskilling'>
      <div className='ai-upskilling-container'>
        <div className='header'>
          <h1>🤖 AI-Powered Upskilling</h1>
          <p>Get personalized course recommendations powered by artificial intelligence</p>
        </div>

        <div className='ai-upskilling-content'>
          {!currentUser?.isSeller ? (
            <div className='ai-intro'>
              <h2>Become a Seller First</h2>
              <p>
                To get AI-powered course recommendations, you need to create a seller account and add your skills.
              </p>
              <p>
                Our AI will analyze your skills and suggest the best courses to help you grow professionally.
              </p>
            </div>
          ) : !skills || skills.length === 0 ? (
            <div className='ai-intro'>
              <h2>Add Your Skills</h2>
              <p>
                Please add your skills to your profile to get personalized AI course recommendations.
              </p>
            </div>
          ) : (
            <>
              <div className='ai-intro'>
                <h2>AI Recommendations for: {skills.join(', ')}</h2>
                <p>
                  Our AI has analyzed your skills and curated these courses to enhance your expertise.
                </p>
              </div>

              {loading && (
                <div className='loading'>
                  <div className='loading-spinner'></div>
                  <p>🤖 AI is generating personalized course recommendations...</p>
                  <p className='loading-subtext'>This may take a few seconds</p>
                </div>
              )}

              {error && (
                <div className='error-message'>
                  <p>❌ {error}</p>
                  <button className='retry-btn' onClick={handleRetry}>
                    🔄 Retry
                  </button>
                </div>
              )}

              {!loading && !error && courses.length > 0 && (
                <>
                  <div className='results-header'>
                    <h3>✨ {courses.length} AI-Recommended Courses</h3>
                  </div>
                  <div className='courses-container'>
                    {courses.map((course) => (
                      <div key={course.id} className='course-card'>
                        <div className='course-header'>
                          <h3>{course.courseName}</h3>
                        </div>
                        <div className='course-meta'>
                          <span className='platform'>📚 {course.platform}</span>
                          <span className='duration'>⏱️ {course.duration}</span>
                        </div>
                        <p className='description'>{course.description}</p>
                        <div className='skills'>
                          <strong>Key Skills You'll Learn:</strong>
                          <div className='skill-tags'>
                            {Array.isArray(course.keySkills) && course.keySkills.map((skill, i) => (
                              <span key={i} className='skill-tag'>
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className='regenerate-section'>
                    <button className='regenerate-btn' onClick={handleRetry}>
                      🔄 Generate New Recommendations
                    </button>
                  </div>
                </>
              )}

              {!loading && !error && courses.length === 0 && (
                <div className='no-results'>
                  <p>No course recommendations yet.</p>
                  <button className='retry-btn' onClick={handleRetry}>
                    🚀 Generate AI Recommendations
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiUpskilling;
// filepath: c:\Users\HP\OneDrive\Desktop\Ly project code\FreelanceConnect1\client\src\pages\aiUpskilling\AiUpskilling.jsx
