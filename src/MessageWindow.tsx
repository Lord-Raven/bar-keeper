import {useWindupString} from "windups";
import {Box, CircularProgress, IconButton, Typography} from "@mui/material";
import {FC, useEffect, useState} from "react";
import ForwardIcon from "@mui/icons-material/Forward";
import { Slice, SubSlice } from "./Director";
import { Stage } from "./Stage";

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
    slice: () => Slice;
    subSlice: () => SubSlice;
    stage: () => Stage;
}

export const MessageWindow: FC<MessageWindowProps> = ({ advance, slice, subSlice, stage }) => {
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
        <div>
            <Box sx={{
                p: 2,
                border: '1px dashed grey',
                backgroundColor: '#00000088',
                zIndex: 3,
                '&:hover': {backgroundColor: '#000000BB'}
            }}>
                <div>
                    <Typography variant="h6" color="#AAAAAA">{subSlice()?.speakerId ?? ''}</Typography>
                </div>
                <div>
                    <MessageWindup message={subSlice()?.body ?? ''} options={{pace: () => {return 3}, onFinished: () => {
                            setDoneWinding(true);}, skipped: doneWinding}} />
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
            <div style={{overflow: 'auto', display: 'flex', alignItems: 'flex-end', zIndex: 2, position: 'relative'}}> 
                {slice()?.presentPatronIds.map(patronId => {
                        if (stage().patrons[patronId]) {
                            if (patronId.toLowerCase().includes(subSlice().speakerId?.toLowerCase() ?? 'nevereverever')) {
                                return <div style={{position: 'relative'}}>Main3: {patronId}<img src={stage().patrons[patronId].imageUrl} style={{position: 'absolute', bottom: 0, height: '35vh', width: 'auto'}}/></div>;
                            } else {
                                return <div style={{position: 'relative'}}>Other3: {patronId}<img src={stage().patrons[patronId].imageUrl} style={{position: 'absolute', bottom: 0, height: '100%', width: 'auto', color: '#BBBBBB'}}/></div>;
                            }
                        } else {
                            return <div></div>;
                        }
                })}
            </div>
        </div>
    );
}
