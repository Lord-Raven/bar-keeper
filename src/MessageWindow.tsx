import {Pace, WindupChildren} from "windups";
import {Box, Button, CircularProgress, IconButton, Typography} from "@mui/material";
import {FC, useEffect, useState} from "react";
import ForwardIcon from "@mui/icons-material/Forward";
import { Direction } from "./Director";
import { Stage } from "./Stage";
import {ChatNode} from "./ChatNode";

interface MessageWindupProps {
    message: string;
    options: {};
}

interface TextWithQuotesProps { text: string; }

const TextWithQuotes: React.FC<TextWithQuotesProps> = ({ text }) => {
    const regex = /"([^"]*)"/g;
    const parts = text.split(regex);
    return (
        <span> 
            {parts.map((part, index) => 
                index % 2 === 1 ? (
                    <span className="quoted-text" key={index}>
                        "{part}"
                    </span>
                ) : (
                    part
                )
            )} 
        </span>
    );
}; 

//const [text] = useWindupString(spannedMessage, options);

function MessageWindup({message, options}: MessageWindupProps) {

    return (
        <div style={{height: '100%', position: 'relative'}}>
            <Typography color='#00000000' style={{userSelect: 'none'}}>{message}</Typography>
            <div style={{position: 'absolute', top: '0px', left: '0px', zIndex: 10}}>
                <WindupChildren {...options}>
                    <Pace ms={3}>
                        <Typography color='primary'>{TextWithQuotes({text: message})}</Typography>
                    </Pace>
                </WindupChildren>
            </div>
        </div>
    );
}

interface MessageWindowProps {
    advance:  () => void;
    chatNode: () => ChatNode|null;
    stage: () => Stage;
}

export const MessageWindow: FC<MessageWindowProps> = ({ advance, chatNode, stage }) => {
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
    const proceedWith = (chatNode: ChatNode) => {
        setAdvancing(true);
        setDoneWinding(true);
        stage().advanceMessageChoice(chatNode);
    }

    useEffect(() => {
        setDoneWinding(false);
        setAdvancing(false);
    }, [chatNode()]);

    /*
                                    {chatNode()?.subSlices.map(subSlice => {
                                    return (
                                            <div style={{marginTop: '5px', marginBottom: '5px'}}>
                                                <Button variant="outlined" disabled={advancing} onClick = {() => {proceedWith(subSlice)}}>
                                                    <MessageWindup message={subSlice.body} options={{}} />
                                                </Button>
                                                <br/>
                                            </div>
                                        );
                                })}
                                <CircularProgress variant={advancing ? 'indeterminate' : 'determinate'} value={5} style={{float: 'right'}}/>
     */

    return (
        <div style={{position: 'relative', flexGrow: '1', left: '1%', width: '98%', alignContent: 'center'}}>
            <Box sx={{
                pl: 1,
                pr: 1,
                pb: 1,
                position: 'absolute',
                bottom: '1vh',
                left: '0%',
                width: '100%',
                border: '1px dashed grey',
                backgroundColor: '#00000088',
                overflow: 'visible',
                zIndex: 8,
                boxSizing: 'border-box',
                '&:hover': {backgroundColor: '#000000BB'}
            }}>
                <div style = {{width: '100%'}}>
                    {chatNode()?.direction === Direction.Choice ?
                        (
                            <div>

                            </div>
                        ) :
                        (
                            <div>
                                <div>
                                    <Typography variant="h6" color="#AAAAAA">{chatNode()?.speakerId ?? ''}</Typography>
                                </div>
                                <div>
                                    <MessageWindup message={chatNode()?.message ?? ''} options={{onFinished: () => {setDoneWinding(true);}, skipped: doneWinding}} />
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
            {chatNode()?.presentPatronIds.map((patronId, index) => {
                    if (stage().patrons[patronId]) {
                        if (patronId.toLowerCase().includes(chatNode()?.speakerId?.toLowerCase() ?? 'nevereverever')) {
                            return <img src={stage().patrons[patronId].imageUrl} style={{
                                position: 'absolute', bottom: '-16vh', 
                                left: ((index % 2) == 0) ? `${index * 30}vw` : 'auto', 
                                right: ((index % 2) == 1) ? `${(index - 1) * 30}vw` : 'auto',
                                zIndex: (index < 2 ? 7 : 6),
                                height: '77vh', width: 'auto'}}/>;
                        } else {
                            return <img src={stage().patrons[patronId].imageUrl} style={{
                                position: 'absolute', bottom: '-16vh', 
                                left: ((index % 2) == 0) ? `${index * 30 + 1}vw` : 'auto', 
                                right: ((index % 2) == 1) ? `${(index - 1) * 30 - 1}vw` : 'auto',
                                zIndex: (index < 2 ? 5 : 4),
                                filter: 'brightness(80%)',
                                height: '75vh', width: 'auto'}}/>;
                        }
                    } else {
                        return <div></div>;
                    }
            })}
        </div>
    );
}
