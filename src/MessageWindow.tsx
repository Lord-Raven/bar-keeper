import {useWindupString} from "windups";
import {Box, CircularProgress, IconButton, Typography} from "@mui/material";
import React, {FC, useEffect, useState} from "react";
import ForwardIcon from "@mui/icons-material/Forward";

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
    advance: () => void;
    message: string;
}

export const MessageWindow: FC<MessageWindowProps> = ({ message, advance }) => {
    const [advancing, setAdvancing] = useState<boolean>(false);
    const [doneWinding, setDoneWinding] = useState<boolean>(false);
    const proceed = () => {
        if (doneWinding) {
            console.log('setAdvancing');
            setAdvancing(true);
            advance();
        } else {
            console.log('setDoneWinding');
            setDoneWinding(true);
        }
    }

    useEffect(() => {
        console.log('change?');
        setDoneWinding(false);
        setAdvancing(false);
    }, [message]);

    return (
        <Box sx={{
            p: 2,
            border: '1px dashed grey',
            backgroundColor: '#00000088',
            '&:hover': {backgroundColor: '#000000BB'}
        }}>
            <MessageWindup message={message} options={{onFinished: () => {
                    setDoneWinding(true);}, skipped: doneWinding}} />
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
