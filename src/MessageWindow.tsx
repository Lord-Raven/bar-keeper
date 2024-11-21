import {Pace, WindupChildren} from "windups";
import {Box, CircularProgress, Icon, IconButton, Typography} from "@mui/material";
import {FC, useEffect, useState} from "react";
import ForwardIcon from "@mui/icons-material/Forward";
import {Stage} from "./Stage";
import {ChatNode} from "./ChatNode";
import {Cancel, CheckCircle} from "@mui/icons-material";
import { motion, Variants } from "framer-motion";

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

const CHARACTER_WIDTH: number = 28;
const getCharacterPosition = (index: number, amount: number) => {

    if (amount % 2 == 1 && index == 0) {
        // odd number and this is the middle one; put it in the middle
        return 50;
    } else {
        return 50 + (0.5 - (index % 2)) * (100 / amount) * Math.ceil((index - (amount % 2) + 1) / 2);
    }
}

interface PatronImageProps {
    imgUrl: string;
    xPosition: number;
    isTalking: boolean;
}

const PatronImage: FC<PatronImageProps> = ({imgUrl, xPosition, isTalking}) => {
    const variants: Variants = {
        talking: {color: '#FFFFFF', opacity: 1, x: `${xPosition}vw`, width: `${CHARACTER_WIDTH + 2}vw`},
        idle: {color: '#BBBBBB', opacity: 1, x: `${xPosition}vw`, width: `${CHARACTER_WIDTH}vw`, filter: 'brightness(0.8)'}
    };

    return (
        <motion.div
            variants={variants}
            initial='idle'
            animate={isTalking ? 'talking' : 'idle'}
            style={{position: 'absolute', y: '0vh', maxWidth: '100%', height: 'auto', aspectRatio: '4 / 7' }}>
            <img src={imgUrl} style={{width: '100%', height: '100%'}} alt='Patron Image'/>
        </motion.div>
    );
};

interface MessageWindowProps {
    advance:  () => void;
    chatNode: () => ChatNode|null;
    updateTime: () => number;
    stage: () => Stage;
}

export const MessageWindow: FC<MessageWindowProps> = ({ advance, chatNode, updateTime, stage }) => {
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
        console.log('done with proceed()');
    }

    useEffect(() => {
        console.log('useEffect2 in MessageWindow');
        setDoneWinding(false);
        setAdvancing(false);
    }, [updateTime()]);

    useEffect(() => {
        console.log('useEffect in MessageWindow');
        setDoneWinding(false);
        setAdvancing(false);
    }, [chatNode()]);

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
                    <div>
                        <Typography variant="h6" color="#AAAAAA">{chatNode()?.speakerId ?? ''}</Typography>
                    </div>
                    <div>
                        <MessageWindup message={chatNode()?.message ?? ''} options={{onFinished: () => {setDoneWinding(true);}, skipped: doneWinding}} />
                    </div>
                    <div>
                        {advancing ? (
                                <CircularProgress style={{float: 'right'}}/>
                            ) : (stage().isBeverageDecision() ? (
                                stage().lastBeverageServed.length == 0 ? (
                                        <Icon style={{outline: 1, float: 'right'}} color={'warning'}>
                                            <Cancel/>
                                        </Icon>
                                    ) : (
                                        <IconButton style={{outline: 1, float: 'right'}} disabled={advancing} color={'primary'}
                                                    onClick={proceed}>
                                            <CheckCircle/>
                                        </IconButton>
                                    )
                                ) : (
                                    <IconButton style={{outline: 1, float: 'right'}} disabled={advancing} color={'primary'}
                                            onClick={proceed}>
                                        <ForwardIcon/>
                                    </IconButton>
                                )
                            )
                        }
                    </div>
                </div>
            </Box>
            {chatNode()?.presentPatronIds.map((patronId, index) => {
                    if (stage().patrons[patronId]) {
                        return <PatronImage imgUrl={stage().patrons[patronId].imageUrl}
                                            xPosition={getCharacterPosition(index, chatNode()?.presentPatronIds.length ?? 1) - CHARACTER_WIDTH / 2}
                                            isTalking={patronId.toLowerCase().includes(chatNode()?.speakerId?.toLowerCase() ?? 'nevereverever')}/>;



                        /*if (patronId.toLowerCase().includes(chatNode()?.speakerId?.toLowerCase() ?? 'nevereverever')) {
                            return <img src={stage().patrons[patronId].imageUrl} style={{
                                position: 'absolute', bottom: '-16vh',
                                left: `${getCharacterPosition(index, chatNode()?.presentPatronIds.length ?? 1) - CHARACTER_WIDTH / 2 - 1}vw`,
                                zIndex: (index < 2 ? 7 : 6),
                                height: 'auto', width: `${CHARACTER_WIDTH + 2}vw`}}/>;
                        } else {
                            return <img src={stage().patrons[patronId].imageUrl} style={{
                                position: 'absolute', bottom: '-16vh', 
                                left: `${getCharacterPosition(index, chatNode()?.presentPatronIds.length ?? 1) - CHARACTER_WIDTH / 2}vw`,
                                zIndex: (index < 2 ? 5 : 4),
                                filter: 'brightness(80%)',
                                height: 'auto', width: `${CHARACTER_WIDTH}vw`}}/>;
                        }*/
                    } else {
                        return <div></div>;
                    }
            })}
        </div>
    );
}
