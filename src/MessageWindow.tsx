import {useWindupString} from "windups";
import {Box, CircularProgress, IconButton, Typography} from "@mui/material";
import React, {FC, useEffect, useState} from "react";
import ForwardIcon from "@mui/icons-material/Forward";
import { SubSlice } from "./Director";

interface MessageWindupProps {
    message: string;
    options?: {};
}

function MessageWindup({message, options}: MessageWindupProps) {
    const [text] = useWindupString(message, options);
    return (
        <div style={{height: '100%', position: 'relative'}}>
            <Typography color='#00000000' style={{userSelect: 'none'}}>{message}</Typography>
            <div style={{position: 'absolute', top: '0px', left: '0px', zIndex: 1}}>
                <Typography color='primary'>{text}</Typography>
            </div>
        </div>
    );
}

interface MessageWindowProps {
    advance:  () => void;
    subSlice: () => SubSlice;
}

export const MessageWindow: FC<MessageWindowProps> = ({ advance, subSlice }) => {
    const [advancing, setAdvancing] = useState<boolean>(false);
    const [doneWinding, setDoneWinding] = useState<boolean>(false);
    const proceed = () => {
        if (doneWinding) {
            setAdvancing(true);
            setDoneWinding(true);
            advance();
        } else {
            setDoneWinding(true);
        }
    }

    useEffect(() => {
        setDoneWinding(false);
        setAdvancing(false);
    }, [subSlice()]);

    return (
        <Box sx={{
            p: 2,
            border: '1px dashed grey',
            backgroundColor: '#00000088',
            '&:hover': {backgroundColor: '#000000BB'}
        }}>
            <div>
                <Typography>Bwah? {subSlice()?.speakerId ?? ''}</Typography>
            </div>
            <div>
                <MessageWindup message={subSlice()?.body ?? ''} options={{pace: () => {return 3}, onFinished: () => {
                        setDoneWinding(true);}, skipped: false}} />
            </div>
            <div>
                {advancing ? (
                    <CircularProgress style={{float: 'right'}}/>
                ) : (
                    <IconButton style={{outline: 1, float: 'right'}} disabled={advancing} color={'primary'}
                                onClick={proceed}>
                        <ForwardIcon/>
                    </IconButton>
                )
                }
            </div>
        </Box>
    );
}
