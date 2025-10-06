import { useLocation, useNavigate } from 'react-router-dom';
import './success.scss'
import { useEffect } from 'react';
import newRequest from '../../utils/newRequest';

const Success = () => {
    const { search } = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(search);
    const payment_intent = params.get('payment_intent');
    
    useEffect(() => {
        const makeRequest = async () => {
            try {
                await newRequest.put('/orders', { payment_intent });
                setTimeout(() => {
                    navigate("/orders");
                }, 5000);
            } catch (error) {
                console.log(error);
            }
        }
        makeRequest();
    }, [navigate, payment_intent]);

    return (
        <div className="success">
            <div className="cm">
                <img src="/images/successfully-done.gif" alt="" />
            </div>
            <div className='success-message'>
                Payment successful! You are being redirected to the order page.
            </div>
            <span className='close'>Please do not close this page</span>
        </div>
    );
}

export default Success;
// filepath: c:\Users\HP\OneDrive\Desktop\Ly project code\fiverr-clone\client\src\pages\success\Success.jsx