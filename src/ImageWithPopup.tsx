import React from 'react';
import Popover from '@mui/material/Popover';
import {Typography} from "@mui/material";

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
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
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
                    backgroundColor: '#111111',
                    bgcolor: '#111111'
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
            >
                <Typography sx={{p: 2, backgroundColor: '#111111', bgcolor: '#111111', color: '#ffffff'}}>
                    <h4>{popupHeader}</h4>{popupBody}
                </Typography>
            </Popover>
        </div>
    );
};

export default ImageWithPopup;