import {Pace, WindupChildren} from "windups";
import {CircularProgress, colors, Icon, IconButton, Typography} from "@mui/material";
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
            style={{position: 'absolute', bottom: '-30vh', width: 'auto', aspectRatio: '5 / 12', zIndex: 10}}>
            <img src={patron.imageUrls[emotion]} style={{position: 'relative', width: '100%', height: '100%', transform: 'translate(-50%, 0)'}} alt={altText}/>
        </motion.div>
    );
};

interface MessagePopupProps {
    message: string;
}

const MessagePopup: FC<MessagePopupProps> = ({message}) => {
    const variants: Variants = {
        hidden: {x: '-100vw', opacity: 0},
        visible: {x: 0, opacity: 1},
        exit: {x: '100vw', opacity: 0},
    };

    return (
        <motion.div
            initial="hidden"
            animate={message ? 'visible' : 'hidden'}
            exit="exit"
            variants={variants}
            transition={{type: 'spring', stiffness: 300, damping: 30}}
            style={{
                width: '100vw',
                height: '20vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                backgroundColor: '#000000BB',
                bottom: '40vh',
                left: 0,
            }}
        >
            <div
                style={{color: 'white', padding: '2vh'}}
            >
                {message}
            </div>

        </motion.div>
    );
};

interface MessageWindowProps {
    advance: () => Promise<void>;
    reverse: () => Promise<void>;
    stage: () => Stage;
    setOnMenu: (onMenu: boolean) => void;
}

export const MessageWindow: FC<MessageWindowProps> = ({ advance, reverse, stage, setOnMenu }) => {
    const [advancing, setAdvancing] = useState<boolean>(false);
    const [doneWinding, setDoneWinding] = useState<boolean>(false);
    const [selectedBeverage, setSelectedBeverage] = useState<string|null>(stage().currentNode?.selectedBeverage ?? null);
    const [chatNode, setChatNode] = useState<ChatNode|null>(stage().currentNode ?? null);

    const handleBeverageClick = (name: string) => {
        console.log('handleBeverageClick');
        console.log(stage().currentNode?.beverageCounts);
        console.log(name);
        if (stage().isBeverageDecision() && (stage().currentNode?.beverageCounts[name] ?? 1 > 0)) {
            setSelectedBeverage(name);
            stage().setLastBeverageServed(name);
        }
    };

    const proceed = () => {
        if (doneWinding) {
            setAdvancing(true);
            setDoneWinding(true);
            advance().then(() => {setChatNode(stage().currentNode)});
        } else {
            setDoneWinding(true);
        }
    }

    const recede = () => {
        reverse().then(() => {setChatNode(stage().currentNode)});
    }

    useEffect(() => {
        setChatNode(stage().currentNode);
        setSelectedBeverage(chatNode?.selectedBeverage ?? null);
        setDoneWinding(chatNode?.read ?? false);
        setAdvancing(false);
    }, [chatNode]);

    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden'}}>
            <div style={{position: 'relative', height: '8%'}}>
                <GenerationUi stage={stage} setOnMenu={setOnMenu}/>
                <Typography variant="h5" style={{float: 'right'}}>
                    Night {chatNode?.night ?? 1}
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
                            <Typography variant="h5" color="#AAAAAA">{chatNode?.speakerId ?? ''}</Typography>
                        </div>
                        <div>
                            <MessageWindup message={chatNode?.message ?? ''} read={chatNode?.read ?? false}
                                           options={{
                                               onFinished: () => {
                                                   setDoneWinding(true);
                                               }, skipped: doneWinding
                                           }}/>
                        </div>
                        <div>
                            <IconButton style={{outline: 1, float: 'left'}}
                                        disabled={advancing || !chatNode || !chatNode?.parentId}
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

                <MessagePopup message = {chatNode && (!chatNode.parentId || !stage().chatNodes[chatNode.parentId] || chatNode.night != stage().chatNodes[chatNode.parentId].night) ? `Night ${chatNode.night}` : ''} />

                {chatNode?.presentPatronIds.map((patronId, index) => {
                    if (stage().patrons[patronId]) {
                        const patron = stage().patrons[patronId];
                        const isTalking = patron.name.toLowerCase().includes(chatNode?.speakerId?.toLowerCase() ?? 'nevereverever');
                        let emotion: Emotion = patron.emotion as Emotion ?? Emotion.neutral;
                        if (isTalking && chatNode?.emotion) {
                            emotion = chatNode.emotion as Emotion ?? emotion;
                            patron.emotion = emotion;
                        }
                        const numberOfPatrons = Math.max(1, chatNode?.presentPatronIds.length ?? 1);
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
