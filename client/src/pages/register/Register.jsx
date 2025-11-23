import React, { useState, useEffect } from "react";
import './resgister.scss';
import upload from "../../utils/upload";
import newRequest from "../../utils/newRequest";
import { useNavigate } from "react-router-dom";
const Register = () => {
  const [file, setFile] = useState(null);
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    img: "",
    country: "",
    isSeller: false,
    desc: "",
    selectedDomain: "",
    selectedSubdomain: ""
  });
  const [skills, setSkills] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [selectedSubdomain, setSelectedSubdomain] = useState("");

  const navigate = useNavigate();

  // Fetch skills from database
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await newRequest.get('/skills');
        setSkills(response.data);
      } catch (error) {
        console.log('Error fetching skills:', error);
      }
    };
    fetchSkills();
  }, []);

  const handlechange = (e) => {
    setUser(prev => {
      return { ...prev, [e.target.name]: e.target.value };
    })
  }

  const handleDomainChange = (e) => {
    const domain = e.target.value;
    setSelectedDomain(domain);
    setSelectedSubdomain("");
    setUser(prev => {
      return { ...prev, selectedDomain: domain, selectedSubdomain: "" };
    })
  }

  const handleSubdomainChange = (e) => {
    const subdomain = e.target.value;
    setSelectedSubdomain(subdomain);
    setUser(prev => {
      return { ...prev, selectedSubdomain: subdomain };
    })
  }

  const handleSeller = (e) => {
    setUser(prev => {
      return { ...prev, isSeller: e.target.checked };
    })
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    console.log('Current user state:', user);
    console.log('Selected domain:', selectedDomain);
    console.log('Selected subdomain:', selectedSubdomain);
    
    try {
      let url = "";
      if (file) {
        console.log('Uploading file...');
        url = await upload(file);
        console.log('File uploaded, URL:', url);
      }
      
      const registrationData = {
        ...user,
        img: url,
        skills: selectedSubdomain ? [selectedSubdomain] : []
      };
      console.log('Sending registration data:', registrationData);
      
      const response = await newRequest.post('/auth/register', registrationData);
      console.log('Registration response:', response);
      alert('Registration successful!');
      navigate('/');
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      alert('Registration failed: ' + (error.response?.data || error.message));
    }
  }


  return (
    <div className="register">
      <form onSubmit={handleSubmit} >
        <div className="left">
          <h1>Create a new account</h1>
          <label htmlFor="">Username</label>
          <input
            name="username"
            type="text"
            placeholder="johndoe"
            onChange={handlechange}
            required
          />
          <label htmlFor="">Email</label>
          <input
            name="email"
            type="email"
            placeholder="email"
            onChange={handlechange}
            required
          />
          <label htmlFor="">Password</label>
          <input
            name="password"
            type="password"
            onChange={handlechange}
            required
          />
          <label htmlFor="">Profile Picture</label>
          <input
            type="file"
            onChange={e => {
              setFile(e.target.files[0]);
            }}
          />
          <label htmlFor="">Country</label>
          <input
            name="country"
            type="text"
            placeholder="Usa"
            onChange={handlechange}
            required
          />
        </div>
        <div className="right">
          <h1>I want to become a seller</h1>
          <div className="toggle">
            <label htmlFor="">Activate the seller account</label>
            <label className="switch">
              <input type="checkbox"
                onChange={handleSeller} />
              <span className="slider round"></span>
            </label>
          </div>
          
          {user.isSeller && (
            <>
              <label htmlFor="">Select Your Domain</label>
              <select 
                value={selectedDomain} 
                onChange={handleDomainChange}
              >
                <option value="">-- Choose a Domain --</option>
                {skills.map(skill => (
                  <option key={skill._id} value={skill.domain}>
                    {skill.domain}
                  </option>
                ))}
              </select>

              {selectedDomain && (
                <>
                  <label htmlFor="">Select Your Skill</label>
                  <select 
                    value={selectedSubdomain} 
                    onChange={handleSubdomainChange}
                  >
                    <option value="">-- Choose a Skill --</option>
                    {skills.find(s => s.domain === selectedDomain)?.subdomains.map((subdomain, index) => (
                      <option key={index} value={subdomain}>
                        {subdomain}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </>
          )}

          <label htmlFor="">Phone Number</label>
          <input
            name="phone"
            type="text"
            placeholder="+1 234 567 89"
            onChange={handlechange}
          />
          <label htmlFor="">Description</label>
          <textarea
            placeholder="A short description of yourself"
            name="desc"
            id=""
            cols="30"
            rows="10"
            onChange={handlechange}
          ></textarea>
          <button type="submit">Register</button>
        </div>
      </form>
    </div>
  );
}
export default Register;