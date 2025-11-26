import React from "react";
import './slide.scss';
import { Slider } from "infinite-react-carousel";

const Slide = ({children, slidesToShow, arrowsScroll}) => {
    // Ensure we have valid props and children
    const validChildren = React.Children.toArray(children).filter(child => child);
    
    if (!validChildren.length) {
        return null;
    }

    return ([
        <div className="slide">
            <div className="container">
                <Slider slidesToShow={slidesToShow || 1} arrowsScroll={arrowsScroll || 1}>
                    {validChildren}
                </Slider>
            </div>
        </div>
    ]);
}
export default Slide;