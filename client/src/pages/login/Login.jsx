import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './login.scss';
import newRequest from "../../utils/newRequest";
const Login = () => {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)

    const navigate=useNavigate();

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            const res=await newRequest.post('/auth/login',{username,password});
            // store full response data (server returns user info and accessToken)
            localStorage.setItem("currentUser",JSON.stringify(res?.data || {}));
            navigate('/');
        } catch (err) {
            // err.response may be undefined on network errors; handle safely
            console.error('Login error:', err);
            console.error('Error details:', {
                message: err?.message,
                response: err?.response,
                code: err?.code,
                config: err?.config
            });
            
            let message = 'Login failed';
            if (err?.response?.data) {
                // Server returned an error response
                message = typeof err.response.data === 'string' 
                    ? err.response.data 
                    : err.response.data.message || JSON.stringify(err.response.data);
            } else if (err?.message) {
                // Network or other error
                if (err.message.includes('Network Error') || err.code === 'ECONNREFUSED') {
                    message = 'Cannot connect to server. Please make sure the backend is running on port 3000.';
                } else {
                    message = err.message;
                }
            }
            setError(message);
        }

    }
    return ([
        <div className="login">
            <form onSubmit={handleSubmit}>
                <h1>Sign in</h1>
                <label htmlFor="">Username</label>
                <input
                    type="text"
                    name="username"
                    placeholder="johndoe"
                    onChange={e => setUsername(e.target.value)}
                />
                <label htmlFor="">Password</label>
                <input
                    type="password"
                    name="password"
                    onChange={e => setPassword(e.target.value)}
                />
                <button type="submit">Login</button>
                { error && <div style={{color: 'red', marginTop: '10px'}}>{error}</div>}
            </form>
        </div>
    ]);
}
export default Login;