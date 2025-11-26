import React from "react";
import './gigs.scss';
import GigCard from '../../components/GigCard/GigCard'
import { useQuery } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";
import { useLocation } from "react-router-dom";

const Gigs = () => {
    const { search } = useLocation();
    const { isLoading, error, data } = useQuery({
        queryKey: ['gigs'],
        queryFn: () =>
            newRequest.get(`/gigs${search}`)
            .then((res) => {
                    return res.data;
             })
    });
    
    return ([
        <div className="gigs">
            <div className="container">
                <div className="cards">
                    {isLoading
                        ? <div className="loader"></div>
                        : error
                            ? <h4 style={{color:"red"}}>Something Gone Wrong</h4>
                            : data.length === 0 ?
                                <h4 style={{color:"#d9480f"}}> Gigs not found !</h4> :
                                data.map((gig) => <GigCard key={gig._id} item={gig} />)
                    }
                </div>
            </div>
        </div>
    ]);
}
export default Gigs;