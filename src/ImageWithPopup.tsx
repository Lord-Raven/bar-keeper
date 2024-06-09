import React from 'react';
import Popover from '@mui/material/Popover';

interface ImageWithPopupProps {
    src: string;
    alt: string;
    popupHeader: string;
    popupBody: string;
    style?: {};
}

const ImageWithPopup: React.FC<ImageWithPopupProps> = ({ src, alt, popupHeader, popupBody, style }) => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        console.log('handlePopoverOpen');
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
        console.log('handlePopoverClose');
    };

    const open = Boolean(anchorEl);

    return (
        <div style={{display: 'flex', alignItems: 'center', color: '#ffffff', backgroundColor: '#111111'}}>
            <img
                src={src}
                alt={alt}
                aria-owns={open ? `mouse-over-popover-${popupHeader}` : undefined}
                aria-haspopup="true"
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
                style={style ?? {margin: '0 5px'}}
            />
            <Popover
                id={`mouse-over-popover-${popupHeader}`}
                sx={{
                    pointerEvents: 'none',
                }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
                style={{backgroundColor: '#111111'}}
            >
                <div style={{color: '#ffffff'}}><h4>{popupHeader}</h4><br/>{popupBody}</div>
            </Popover>
        </div>
    );
};

export default ImageWithPopup;