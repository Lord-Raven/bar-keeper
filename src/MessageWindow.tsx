import {useWindupString} from "windups";
import {Box, Button, CircularProgress, IconButton, Typography} from "@mui/material";
import {FC, useEffect, useState} from "react";
import ForwardIcon from "@mui/icons-material/Forward";
import { Direction, Slice, SubSlice } from "./Director";
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
        <div style={{position: 'relative', flexGrow: '1'}}>
            <Box sx={{
                p: 2,
                border: '1px dashed grey',
                backgroundColor: '#00000088',
                overflow: 'visible',
                position: 'absolute',
                bottom: '0',
                left: '0',
                zIndex: 5,
                '&:hover': {backgroundColor: '#000000BB'}
            }}>
                <div style = {{width: '100%'}}>
                    {slice()?.direction === Direction.Choice ? 
                        (
                            <div>
                                {slice()?.subSlices.map(subSlice => {
                                    return (
                                            <div>
                                                <Button variant="outlined" disabled={advancing} onClick = {() => {stage().advanceMessageChoice(subSlice)}}>
                                                    <MessageWindup message={subSlice.body} options={{pace: () => {return 3}}} />
                                                </Button>
                                                <br/>
                                            </div>
                                        );
                                })}
                                <CircularProgress variant={advancing ? 'indeterminate' : 'indeterminate'} value={0} style={{float: 'right'}}/>
                            </div>
                        ) :
                        (
                            <div>
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
                            </div>
                        )
                    }
                </div>
            </Box>
            {slice()?.presentPatronIds.map((patronId, index) => {
                    if (stage().patrons[patronId]) {
                        if (patronId.toLowerCase().includes(subSlice().speakerId?.toLowerCase() ?? 'nevereverever')) {
                            return <img src={stage().patrons[patronId].imageUrl} style={{
                                position: 'absolute', bottom: 0, 
                                left: ((index % 2) == 0) ? `${index * 30}vw` : 'auto', 
                                right: ((index % 2) == 1) ? `${(index - 1) * 30}vw` : 'auto',
                                zIndex: (index < 2 ? 6 : 5),
                                height: '52vh', width: 'auto'}}/>;
                        } else {
                            return <img src={stage().patrons[patronId].imageUrl} style={{
                                position: 'absolute', bottom: 0, 
                                left: ((index % 2) == 0) ? `${index * 30 + 1}vw` : 'auto', 
                                right: ((index % 2) == 1) ? `${(index - 1) * 30 - 1}vw` : 'auto',
                                zIndex: (index < 2 ? 4 : 3),
                                filter: 'brightness(80%)',
                                height: '50vh', width: 'auto'}}/>;
                        }
                    } else {
                        return <div></div>;
                    }
            })}
        </div>
    );
}
