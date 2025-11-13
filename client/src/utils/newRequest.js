import axios from "axios";

//backend port number - ensure this matches API `PORT` in `api/.env`
// Use proxy in development (configured in package.json) or direct URL
const baseURL = process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL || 'http://localhost:3000/api/'
    : '/api'; // Use proxy in development

const newRequest=axios.create({
    baseURL: baseURL,
    withCredentials:true,
})

export default newRequest;