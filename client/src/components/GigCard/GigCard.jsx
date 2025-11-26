import React from "react";
import './gigCard.scss'
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";

const GigCard = ({ item }) => {
    const { isLoading, error, data } = useQuery({
        queryKey: [`${item.userId}`],
        queryFn: () =>
            newRequest.get(`/users/${item.userId}`)
                .then((res) => {
                    return res.data;
                })
            })
    return ([
        <Link to={`/gig/${item._id}`} className="link">
            <div className="gigCard ">
                <img src={item.cover} alt="" />
                <div className="info">
                    {isLoading ? "loading" : error ? "something wrong" : <div className="user">
                        <img src={data.img || '/images/noavtar.jpeg'} alt="" />
                        <span>{data.username}</span>
                    </div>}
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                </div>
                <hr />
                <div className="details">
                    <div className="delivery">
                        <img src="/images/clock.png" alt="delivery" />
                        <span>{item.deliveryTime} days Delivery</span>
                    </div>
                    <div className="price">
                        <span>STARTING AT</span>
                        <h2>₹ {item.price}</h2>
                    </div>
                </div>
            </div>
        </Link>
    ]);
}
export default GigCard;