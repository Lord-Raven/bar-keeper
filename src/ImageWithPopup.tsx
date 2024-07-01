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
            <Popover
                id={`mouse-over-popover-${popupHeader}`}
                sx={{
                    pointerEvents: 'none'
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
                <Box component="section" sx={{height: '10vh', p: 2, border: '1px dashed grey'}}>
                    <div style={{height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'flex-start'}}>
                        {popupSrc && (
                            <div style={{height: '100%', width: 'auto'}}>
                                <img src={popupSrc} style={{height: '100%', width: 'auto'}} alt={alt}/>
                            </div>
                        )}
                        <div style={{height: '100%'}}>
                            <Typography>
                                <h4>{popupHeader}</h4>
                                {popupBody}
                            </Typography>
                        </div>
                    </div>
                </Box>
            </Popover>
        </div>
    );
};

export default ImageWithPopup;