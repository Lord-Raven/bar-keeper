import {Pace, WindupChildren} from "windups";
import {CircularProgress, Icon, IconButton, Typography} from "@mui/material";
import React, {FC, useEffect, useState} from "react";
import {Stage} from "./Stage";
import {ChatNode} from "./ChatNode";
import {Cancel, CheckCircle, ArrowForward, ArrowBack} from "@mui/icons-material";
import { motion, Variants } from "framer-motion";
import {Emotion, Patron} from "./Patron";
import Box from "./Box";
import {GenerationUi} from "./GenerationUi";

interface MessageWindupProps {
    message: string;
    read: boolean;
    options: {};
}

interface TextWithQuotesProps { text: string; read: boolean; }

const TextWithQuotes: React.FC<TextWithQuotesProps> = ({ text, read}) => {
    const regex = /"([^"]*)"/g;
    const parts = text.split(regex);
    return (
        <span className={read ? "prose-read" : "prose-unread"}>
            {parts.map((part, index) => 
                index % 2 === 1 ? (
                    <span className={read ? "quote-read" : "quote-unread"} key={index}>
                        "{part}"
                    </span>
                ) : (
                    part
                )
            )} 
        </span>
    );
};

function MessageWindup({message, read, options}: MessageWindupProps) {

    return (
        <div style={{height: '100%', position: 'relative'}}>
            <Typography color='#00000000' style={{userSelect: 'none'}}>{message}</Typography>
            <div style={{position: 'absolute', top: '0px', left: '0px', zIndex: 10}}>
                <WindupChildren {...options}>
                    <Pace ms={3}>
                        <Typography>{TextWithQuotes({text: message, read})}</Typography>
                    </Pace>
                </WindupChildren>
            </div>
        </div>
    );
}

const CHARACTER_HEIGHT: number = 100;
const getCharacterPosition = (index: number, amount: number) => {
    const start = 5;
    const end = 95;
    const period = (end - start) / amount;
    return start + period * index + (period / 2);
}

const boxStyle = {
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
}

interface PatronImageProps {
    patron: Patron;
    emotion: Emotion;
    xPosition: number;
    isTalking: boolean;
}

const PatronImage: FC<PatronImageProps> = ({patron, emotion, xPosition, isTalking}) => {
    const variants: Variants = {
        talking: {color: '#FFFFFF', opacity: 1, x: `${xPosition}vw`, height: `${CHARACTER_HEIGHT + 2}vh`, filter: 'brightness(1)', zIndex: 12, transition: {x: {ease: "easeOut"}}},
        idle: {color: '#BBBBBB', opacity: 1, x: `${xPosition}vw`, height: `${CHARACTER_HEIGHT}vh`, filter: 'brightness(0.8)', zIndex: 11, transition: {x: {ease: "easeOut"}}},
    };

    const altText = `${patron.name} (${emotion})`

    return (
        <motion.div
            variants={variants}
            initial='idle'
            animate={isTalking ? 'talking' : 'idle'}
            className='important-overflow-visible'
            style={{position: 'absolute', bottom: '-30vh', width: 'auto', aspectRatio: '5 / 12', zIndex: 10}}>
            <img src={patron.imageUrls[emotion]} className='important-overflow-visible' style={{position: 'relative', width: '100%', height: '100%', transform: 'translate(-50%, 0)'}} alt={altText}/>
        </motion.div>
    );
};

interface MessageWindowProps {
    advance: () => void;
    reverse: () => void;
    chatNode: () => ChatNode|null;
    updateTime: () => number;
    stage: () => Stage;
}

export const MessageWindow: FC<MessageWindowProps> = ({ advance, reverse, chatNode, updateTime, stage }) => {
    const [advancing, setAdvancing] = useState<boolean>(false);
    const [doneWinding, setDoneWinding] = useState<boolean>(false);
    const [selectedBeverage, setSelectedBeverage] = useState<string|null>(chatNode()?.selectedBeverage ?? null);

    const handleBeverageClick = (name: string) => {
        if (stage().isBeverageDecision() && (stage().currentNode?.beverageCounts[name] ?? 1 > 0)) {
            setSelectedBeverage(name);
            stage().setLastBeverageServed(name);
        }
    };

    useEffect(() => {
        setSelectedBeverage(stage().currentNode?.selectedBeverage ?? null);
    }, [stage()]);

    const proceed = () => {
        if (doneWinding) {
            setAdvancing(true);
            setDoneWinding(true);
            advance();
        } else {
            setDoneWinding(true);
        }
    }
    const recede = () => {
        reverse();
        setDoneWinding(true);
    }
    useEffect(() => {
        setDoneWinding(false);
        setAdvancing(false);
    }, [updateTime(), chatNode()]);

    return (
        <div className='important-overflow-visible'>
            <div style={{position: 'relative', height: '8%'}}>
                <GenerationUi stage={stage}/>
                <Typography variant="h5" style={{float: 'right'}}>
                    Night {stage().night}
                </Typography>
            </div>
            <div
                 style={{
                     position: 'relative',
                     flexGrow: '1',
                     left: '1%',
                     width: '98%',
                     alignContent: 'center',
                     zIndex: 2
                 }}>
                    <Box layout sx={{...boxStyle, bottom: '17vh'}}>
                        <div style={{width: '100%'}}>
                            <div>
                                <Typography variant="h5" color="#AAAAAA">{chatNode()?.speakerId ?? ''}</Typography>
                            </div>
                            <div>
                                <MessageWindup message={chatNode()?.message ?? ''} read={chatNode()?.read ?? false}
                                               options={{
                                                   onFinished: () => {
                                                       setDoneWinding(true);
                                                   }, skipped: doneWinding
                                               }}/>
                            </div>
                            <div>
                                <IconButton style={{outline: 1, float: 'left'}}
                                            disabled={advancing || !chatNode() || !chatNode()?.parentId}
                                            color={'primary'}
                                            onClick={recede}>
                                    <ArrowBack/>
                                </IconButton>
                                {advancing ? (
                                    <CircularProgress style={{float: 'right'}}/>
                                ) : (stage().isBeverageDecision() ? (
                                        selectedBeverage ? (
                                            <IconButton style={{outline: 1, float: 'right'}} disabled={advancing}
                                                        color={'primary'}
                                                        onClick={proceed}>
                                                <CheckCircle/>
                                            </IconButton>
                                        ) : (
                                            <Icon style={{outline: 1, float: 'right'}} color={'warning'}>
                                                <Cancel/>
                                            </Icon>
                                        )
                                    ) : (
                                        <IconButton style={{outline: 1, float: 'right'}} disabled={advancing}
                                                    color={'primary'}
                                                    onClick={proceed}>
                                            <ArrowForward/>
                                        </IconButton>
                                    )
                                )
                                }
                            </div>
                        </div>
                    </Box>
                    <Box layout sx={{...boxStyle, height: '15vh'}}>
                        <div
                            style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-around'
                            }}>
                            {stage().beverages.map(beverage => beverage.render(() => {
                                return beverage.name == selectedBeverage
                            }, () => {
                                return stage().currentNode?.beverageCounts[beverage.name] ?? 1
                            }, handleBeverageClick))}
                        </div>
                    </Box>

                {chatNode()?.presentPatronIds.map((patronId, index) => {
                    if (stage().patrons[patronId]) {
                        const patron = stage().patrons[patronId];
                        const isTalking = patron.name.toLowerCase().includes(chatNode()?.speakerId?.toLowerCase() ?? 'nevereverever');
                        let emotion: Emotion = patron.emotion as Emotion ?? Emotion.neutral;
                        if (isTalking && chatNode()?.emotion) {
                            emotion = chatNode()?.emotion as Emotion ?? emotion;
                            patron.emotion = emotion;
                        }
                        const numberOfPatrons = Math.max(1, chatNode()?.presentPatronIds.length ?? 1);
                        const position = getCharacterPosition(index, numberOfPatrons);
                        return <PatronImage patron={patron}
                                            emotion={emotion}
                                            xPosition={position}
                                            isTalking={isTalking}/>;
                    } else {
                        return <div></div>;
                    }
                })}
            </div>
        </div>
    );
}
