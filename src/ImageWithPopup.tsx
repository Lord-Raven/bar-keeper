import React from 'react';
import Popover from '@mui/material/Popover';
import {Box, Typography} from "@mui/material";

interface ImageWithPopupProps {
    src: string;
    alt: string;
    popupHeader: string;
    popupBody: string;
    popupSrc?: string;
    style?: {};
}

const ImageWithPopup: React.FC<ImageWithPopupProps> = ({ src, alt, popupHeader, popupBody, popupSrc, style }) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
        <div style={{height: '90%'}}>
            <img
                src={src}
                alt={alt}
                aria-owns={open ? `mouse-over-popover-${popupHeader}` : undefined}
                aria-haspopup="true"
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
                style={style ?? {height: '100%', width: 'auto', margin: '0 0px'}}
            />
        </div>
    );
};

export default ImageWithPopup;