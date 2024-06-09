import React, { useState } from 'react';
import {Popover} from '@mui/material';

interface ImageWithPopupProps {
    src: string;
    alt: string;
    popupHeader: string;
    popupBody: string;
    style?: {};
}

const ImageWithPopup: React.FC<ImageWithPopupProps> = ({ src, alt, popupHeader, popupBody, style }) => {
    const [showPopup, setShowPopup] = useState(false);

    const handleMouseEnter = () => {
        console.log('handleMouseEnter');
        // Set a timeout to delay the popup display
        setTimeout(() => {
            setShowPopup(true);
        }, 200); // Adjust time as needed
    };

    const handleMouseLeave = () => {
        console.log('handleMouseLeave');
        setShowPopup(false);
    };

    return (
        <div style={{display: 'flex', alignItems: 'center'}}>
            <img
                src={src}
                alt={alt}
                onMouseOver={handleMouseEnter}
                onMouseOut={handleMouseLeave}
                style={style ?? {margin: '0 5px'}}
            />
            <Popover
                id={popupHeader}
                open={showPopup}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <b>{popupHeader}</b> - {popupBody}
            </Popover>
        </div>
    );
};

export default ImageWithPopup;