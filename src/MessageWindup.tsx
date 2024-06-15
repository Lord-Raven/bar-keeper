import {useWindupString} from "windups";
import {Typography} from "@mui/material";
import React from "react";

interface MessageWindupProps {
    message: string;
}
export function MessageWindup({message}: MessageWindupProps) {
    const [text] = useWindupString(message);
    return (
        <div style={{height: '100%', position: 'relative'}}>
            <Typography color='#00000000'>{message}</Typography>
            <div style={{position: 'absolute', top: '0px', left: '0px', zIndex: 1, userSelect: 'none'}}>
                <Typography color='primary'>{text}</Typography>
            </div>
        </div>
    );
}