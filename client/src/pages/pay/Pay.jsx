import React, { useEffect, useState } from "react";
import "./pay.scss";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import newRequest from "../../utils/newRequest";
import { useParams } from "react-router-dom";
import CheckoutForm from "../../components/checkOutForm/CheckOutForm";
const stripePromise = loadStripe(
  "pk_test_51SCFhSFWqdJT7A9r0713u4OzrDUyajPiEZfUQs9LXV87xMQhUjZEMSSl73Ry5ox6Cr69bQXh0RHkbtxI0H6SznXH00VZPWJJR6"
  );

const Pay = () => {
  const [clientSecret, setClientSecret] = useState("");
   const [options, setOptions] = useState(null); 

  const { id } = useParams();

  useEffect(() => {
    const makeRequest = async () => {
      try {
        const res = await newRequest.post(
          `/orders/create-payment-intent/${id}`
        );
        const secret = res.data.clientSecret;
        setClientSecret(secret);
        
        // Create options object only once to prevent mutation
        setOptions({
          clientSecret: secret,
          appearance: {
            theme: 'stripe',
          },
        });
      } catch (err) {
        console.log(err);
      }
    };
    makeRequest();
  }, [id]);


  return <div className="pay">
    {clientSecret && options && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
  </div>;
};

export default Pay;