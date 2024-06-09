import React, { useState } from 'react';

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
        // Set a timeout to delay the popup display
        setTimeout(() => {
            setShowPopup(true);
        }, 500); // Adjust time as needed
    };

    const handleMouseLeave = () => {
        setShowPopup(false);
    };

    return (
        <div style={style ?? { margin: '0 5px' }}>
            <img
                src={src}
                alt={alt}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
            {showPopup && (
                <div style={{position: 'absolute'}}>
                    <b>{popupHeader}</b><br/>
                    {popupBody}
                </div>
            )}
        </div>
    );
};

export default ImageWithPopup;