import {useWindupString} from "windups";
import {Typography} from "@mui/material";
import React from "react";

interface MessageWindupProps {
    message: string;
}
export function MessageWindup({message}: MessageWindupProps) {
    const [text] = useWindupString(message);
    return <Typography color='primary'>{text}</Typography>;
}