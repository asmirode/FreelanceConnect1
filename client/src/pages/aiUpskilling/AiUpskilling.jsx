import React, { useState, useEffect } from 'react';
import './aiUpskilling.scss';
import newRequest from '../../utils/newRequest';

const AiUpskilling = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [domain, setDomain] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(user);
    
    if (user?.selectedDomain) {
      setDomain(user.selectedDomain);
      fetchCourseSuggestions(user.selectedDomain);
    }
  }, []);

  const fetchCourseSuggestions = async (selectedDomain) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching courses for domain:', selectedDomain);
      const response = await newRequest.post('/upskilling/courses', {
        domain: selectedDomain
      });
      console.log('Response received:', response.data);
      setCourses(response.data.courses);
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Error message:', err.message);
      setError('Failed to load course suggestions. Error: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='ai-upskilling'>
      <div className='ai-upskilling-container'>
        <h1>AI Upskilling</h1>
        <p>Personalized course recommendations based on your professional domain</p>
        
        <div className='ai-upskilling-content'>
          {!currentUser?.isSeller ? (
            <div className='ai-intro'>
              <h2>Become a Seller First</h2>
              <p>
                To get personalized course recommendations, you need to create a seller account first.
                This allows us to understand your professional domain and suggest relevant courses.
              </p>
            </div>
          ) : (
            <>
              <div className='ai-intro'>
                <h2>Recommended Courses for {domain}</h2>
                <p>
                  Based on your expertise in <strong>{domain}</strong>, here are carefully curated courses and certifications
                  to enhance your skills and stay competitive in your field.
                </p>
              </div>

              {loading && (
                <div className='loading'>
                  <p>🤖 AI is generating personalized course recommendations...</p>
                </div>
              )}

              {error && (
                <div className='error-message'>
                  <p>{error}</p>
                </div>
              )}

              {!loading && courses.length > 0 && (
                <div className='courses-container'>
                  {courses.map((course, index) => (
                    <div key={index} className='course-card'>
                      {course.rawResponse ? (
                        <div className='course-content'>
                          <p>{course.content}</p>
                        </div>
                      ) : (
                        <>
                          <h3>{course.courseName}</h3>
                          <div className='course-meta'>
                            <span className='platform'>📚 {course.platform}</span>
                            <span className='duration'>⏱️ {course.duration}</span>
                          </div>
                          <p className='description'>{course.description}</p>
                          <div className='skills'>
                            <strong>Key Skills:</strong>
                            <div className='skill-tags'>
                              {Array.isArray(course.keySkills) && course.keySkills.map((skill, i) => (
                                <span key={i} className='skill-tag'>{skill}</span>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!loading && courses.length === 0 && !error && (
                <button className='retry-btn' onClick={() => fetchCourseSuggestions(domain)}>
                  Generate Course Suggestions
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiUpskilling;
