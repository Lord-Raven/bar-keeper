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
        <div style={{height: '10vh', display: 'flex', alignItems: 'center'}}>
            <img
                src={src}
                alt={alt}
                aria-owns={open ? `mouse-over-popover-${popupHeader}` : undefined}
                aria-haspopup="true"
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
                style={style ?? {height: '100%', width: 'auto', margin: '0 0px'}}
            />
            <Popover
                id={`mouse-over-popover-${popupHeader}`}
                sx={{
                    pointerEvents: 'none',
                    height: '10vh'
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
                <Box component="section" sx={{height: '9vh', display: 'flex', p: 2, border: '1px dashed grey'}}>
                    {popupSrc && (
                        <div style={{height: '100%', float: 'left'}}>
                            <img src={popupSrc} style={{height: '100%', width: 'auto', verticalAlign: 'center', objectFit: 'contain'}} alt={alt}/>
                        </div>
                    )}
                    <div>
                        <Typography><h4>{popupHeader}</h4>{popupBody}
                        </Typography>
                    </div>
                </Box>
            </Popover>
        </div>
    );
};

export default ImageWithPopup;