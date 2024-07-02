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
                <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'flex-start', height: '12vh', p: '1', border: '1px dashed grey'}}>
                    {popupSrc && (
                        <Box component='img' src={popupSrc} alt={alt} sx={{height: '100%', width: 'auto', objectFit: 'cover'}}/>
                    )}
                    <Box sx={{p: '1', display: 'flex', flexGrow: '1', flexDirection: 'column', maxWidth: '70%'}}>
                        <Typography variant='h5'>{popupHeader}</Typography>
                        <Typography>{popupBody}</Typography>
                    </Box>
                </Box>
            </Popover>
        </div>
    );
};

export default ImageWithPopup;