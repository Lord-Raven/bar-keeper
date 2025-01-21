import {Pace, WindupChildren} from "windups";
import {Box, CircularProgress, Icon, IconButton, Typography} from "@mui/material";
import {FC, useEffect, useState} from "react";
import ForwardIcon from "@mui/icons-material/Forward";
import {Stage} from "./Stage";
import {ChatNode} from "./ChatNode";
import {Cancel, CheckCircle} from "@mui/icons-material";
import { motion, Variants } from "framer-motion";
import {Emotion, Patron} from "./Patron";

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

const CHARACTER_HEIGHT: number = 100;
const SIZE_RATIO: number = 0.42857142857;
const getCharacterPosition = (index: number, amount: number) => {

    const start = 5;
    const end = 95;
    const period = (end - start) / amount;
    return start + period * index + (period / 2);
}

interface PatronImageProps {
    patron: Patron;
    emotion: Emotion;
    xPosition: number;
    isTalking: boolean;
}

const PatronImage: FC<PatronImageProps> = ({patron, emotion, xPosition, isTalking}) => {
    const variants: Variants = {
        talking: {color: '#FFFFFF', opacity: 1, x: `${xPosition - SIZE_RATIO}vw`, height: `${CHARACTER_HEIGHT + 2}vh`, filter: 'brightness(1)', zIndex: 12, transition: {x: {ease: "easeOut"}}},
        idle: {color: '#BBBBBB', opacity: 1, x: `${xPosition}vw`, height: `${CHARACTER_HEIGHT}vh`, filter: 'brightness(0.8)', zIndex: 11, transition: {x: {ease: "easeOut"}}},
    };

    const altText = `${patron.name} (${emotion})`

    return (
        <motion.div
            variants={variants}
            initial='idle'
            animate={isTalking ? 'talking' : 'idle'}
            className='important-overflow-visible'
            style={{position: 'absolute', bottom: '-35vh', width: 'auto', aspectRatio: '5 / 12', zIndex: 10}}>
            <img src={patron.imageUrls[emotion]} className='important-overflow-visible' style={{position: 'relative', width: '100%', height: '100%'}} alt={altText}/>
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
    }
    useEffect(() => {
        setDoneWinding(false);
        setAdvancing(false);
    }, [updateTime(), chatNode()]);

    return (
        <div className='important-overflow-visible' style={{position: 'relative', flexGrow: '1', left: '1%', width: '98%', alignContent: 'center', zIndex: 2}}>
            <motion.div layout>
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
                    zIndex: 50,
                    boxSizing: 'border-box',
                    '&:hover': {backgroundColor: '#000000BB'}
                }}>
                    <div style = {{width: '100%'}}>
                        <div>
                            <Typography variant="h5" color="#AAAAAA">{chatNode()?.speakerId ?? ''}</Typography>
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
            </motion.div>
            {chatNode()?.presentPatronIds.map((patronId, index) => {
                    if (stage().patrons[patronId]) {
                        const patron = stage().patrons[patronId];
                        const isTalking = patron.name.toLowerCase().includes(chatNode()?.speakerId?.toLowerCase() ?? 'nevereverever');
                        let emotion: Emotion = patron.emotion as Emotion ?? Emotion.neutral;
                        if (isTalking && chatNode()?.emotion) {
                            emotion = chatNode()?.emotion as Emotion ?? emotion;
                        }
                        const numberOfPatrons = Math.max(1, chatNode()?.presentPatronIds.length ?? 1);
                        const position = getCharacterPosition(index, numberOfPatrons) - (CHARACTER_HEIGHT * SIZE_RATIO) / 2
                        console.log(`getCharacterPosition(${index}, ${numberOfPatrons}) - (${CHARACTER_HEIGHT} * ${SIZE_RATIO}) / 2 = ${position}`);
                        return <PatronImage patron={patron}
                                            emotion = {emotion}
                                            xPosition={position}
                                            isTalking={isTalking}/>;
                    } else {
                        return <div></div>;
                    }
            })}
        </div>
    );
}
