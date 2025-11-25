import React, { useState, useEffect } from "react";
import './resgister.scss';
import upload from "../../utils/upload";
import newRequest from "../../utils/newRequest";
import { useNavigate } from "react-router-dom";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon",
  "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
  "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
  "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa",
  "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

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
    
    // Validate required fields
    if (!user.username.trim()) {
      alert('Username is required');
      return;
    }
    if (!user.email.trim()) {
      alert('Email is required');
      return;
    }
    if (!user.password.trim()) {
      alert('Password is required');
      return;
    }
    if (!user.country.trim()) {
      alert('Country is required');
      return;
    }
    if (!user.desc.trim()) {
      alert('Description is required');
      return;
    }
    
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
          <label htmlFor="">Username <span style={{color: 'red'}}>*</span></label>
          <input
            name="username"
            type="text"
            placeholder="johndoe"
            onChange={handlechange}
            required
          />
          <label htmlFor="">Email <span style={{color: 'red'}}>*</span></label>
          <input
            name="email"
            type="email"
            placeholder="email"
            onChange={handlechange}
            required
          />
          <label htmlFor="">Password <span style={{color: 'red'}}>*</span></label>
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
          <label htmlFor="">Country <span style={{color: 'red'}}>*</span></label>
          <select
            name="country"
            onChange={handlechange}
            required
          >
            <option value="">-- Select a Country --</option>
            {COUNTRIES.map((country, index) => (
              <option key={index} value={country}>
                {country}
              </option>
            ))}
          </select>
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
          <label htmlFor="">Description <span style={{color: 'red'}}>*</span></label>
          <textarea
            placeholder="A short description of yourself"
            name="desc"
            id=""
            cols="30"
            rows="10"
            onChange={handlechange}
            required
          ></textarea>
          <button type="submit">Register</button>
        </div>
      </form>
    </div>
  );
}
export default Register;