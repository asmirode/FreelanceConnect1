import React from "react";
import './message.scss';
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";

const Message = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  
  const { isLoading, error, data } = useQuery({
    queryKey: ["messages"],
    queryFn: () =>
      newRequest.get(`/messages/${id}`).then((res) => {
        return res.data;
      }),
  });

  // Fetch conversation details to get recipient ID
  const { data: conversationData } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () =>
      newRequest.get(`/conversations/single/${id}`).then((res) => {
        return res.data;
      }),
  });

  // Get recipient ID from conversation
  const recipientId = conversationData ? (currentUser.isSeller ? conversationData.buyerId : conversationData.sellerId) : null;

  // Fetch recipient user data
  const { data: recipientData } = useQuery({
    queryKey: ["recipient", recipientId],
    queryFn: () =>
      newRequest.get(`/users/${recipientId}`).then((res) => {
        return res.data;
      }),
    enabled: !!recipientId,
  });

  const { data: currentUserData } = useQuery({
    queryKey: ["seller"],
    queryFn: () =>
      newRequest.get(`/users/${currentUser._id}`).then((res) => {
        return res.data;
      }),
  });

  const mutation = useMutation({
    mutationFn: (message) => {
      return newRequest.post(`/messages`, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["messages"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      conversationId: id,
      desc: e.target[0].value,
    });
    e.target[0].value = " ";
  };

  return (
    <div className="message">
      <div className="container">
        <div className="header">
          <div className="recipientInfo">
            {recipientData && (
              <>
                <img src={recipientData.img || '/images/noavtar.jpeg'} alt="recipient" />
                <div className="info">
                  <span className="name">{recipientData.username}</span>
                  <span className="role">{recipientData.isSeller ? "Seller" : "Buyer"}</span>
                </div>
              </>
            )}
          </div>
        </div>
        {isLoading ? "Loading" : error ? "something went wrong" : 
        <div className="messages">
          {data.map((m) => (
            <div className={m.userId === currentUser._id ? "owner item" : "item"} key={m._id}>
              <img
                src={m.userId === currentUser._id ? (currentUserData?.img || '/images/noavtar.jpeg') : (recipientData?.img || '/images/noavtar.jpeg')}
                alt="profile"
              />
              <div className="messageContent">
                <p>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>}
        <hr />
        <form className="write" onSubmit={handleSubmit}>
          <textarea name="" id="" placeholder="write a message" cols="30" rows="10"></textarea>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
};

export default Message;