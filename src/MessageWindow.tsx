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
import {Direction} from "./Director";

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
    backgroundColor: '#000000BB',
    zIndex: 50,
    boxSizing: 'border-box',
    '&:hover': {backgroundColor: '#000000EE'}
}

interface PatronImageProps {
    patron: Patron;
    emotion: Emotion;
    xPosition: number;
    isTalking: boolean;
    present: boolean;
}

const PatronImage: FC<PatronImageProps> = ({patron, emotion, xPosition, isTalking, present}) => {
    const variants: Variants = {
        talking: {color: '#FFFFFF', opacity: 1, x: `${xPosition}vw`, height: `${CHARACTER_HEIGHT + 2}vh`, filter: 'brightness(1)', zIndex: 12, transition: {x: {ease: "easeOut"}, opacity: {ease: "easeOut"}}},
        idle: {color: '#BBBBBB', opacity: 1, x: `${xPosition}vw`, height: `${CHARACTER_HEIGHT}vh`, filter: 'brightness(0.8)', zIndex: 11, transition: {x: {ease: "easeOut"}, opacity: {ease: "easeOut"}}},
        absent: {color: '#BBBBBB', opacity: 0, x: `${xPosition}vw`, height: `${CHARACTER_HEIGHT}vh`, filter: 'brightness(0.8)', zIndex: 11, transition: {x: {ease: "easeOut"}, opacity: {ease: "easeOut"}}},
    };

    const altText = `${patron.name} (${emotion})`

    return (
        <motion.div
            variants={variants}
            initial='idle'
            animate={present ? (isTalking ? 'talking' : 'idle') : 'absent'}
            style={{position: 'absolute', bottom: '-25vh', width: 'auto', aspectRatio: '5 / 12', zIndex: 10}}>
            <img src={patron.imageUrls[emotion]} style={{position: 'relative', width: '100%', height: '100%', transform: 'translate(-50%, 0)'}} alt={altText}/>
        </motion.div>
    );
};

interface VignetteProps {
    active: boolean;
}

const Vignette: FC<VignetteProps> = ({active}) => {
    const variants: Variants = {
        active: {opacity: 1},
        inactive: {opacity: 0}
    }

    return (
        <motion.div
            initial="inactive"
            animate={active ? 'active' : 'inactive'}
            variants={variants}
            transition={{duration: 0.5}}
            style={{
                pointerEvents: 'none',
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                background: 'radial-gradient(ellipse at center, #00000000 75%, #000000BB 90%)',
                zIndex: 13,
            }}
        />
    );
}

interface MessageBannerProps {
    message: string;
    post: boolean;
}

const MessageBanner: FC<MessageBannerProps> = ({message, post}) => {
    const variants: Variants = {
        start: {x: '-100vw', opacity: 0},
        visible: {x: 0, opacity: 1},
        exit: {x: '100vw', opacity: 0},
    };

    return (
        <motion.div
            initial="start"
            animate={message ? 'visible' : (post ? 'exit' :  'start')}
            variants={variants}
            transition={{duration: 0.5}}
            style={{
                width: '100vw',
                height: '20vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                backgroundColor: '#000000BB',
                bottom: '50vh',
                left: 0,
                zIndex: 20,
            }}
        >
            <Typography variant='h2' color='primary'>
                {message}
            </Typography>
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

    const makingBeverageDecision = stage().isBeverageDecision() && !(chatNode?.read ?? false);
    const numberOfPatrons = Math.max(1, chatNode?.presentPatronIds.length ?? 1);
    const history = chatNode ? stage().getNightlyNodes(chatNode) : [];

    const handleBeverageClick = (name: string) => {
        if (makingBeverageDecision && (stage().currentNode?.beverageCounts[name] ?? 1 > 0)) {
            setSelectedBeverage(name);
            stage().setLastBeverageServed(name);
        }
    };

    const proceed = () => {
        if (doneWinding) {
            setAdvancing(true);
            setDoneWinding(true);
            advance().then(() => {setAdvancing(false); setChatNode(stage().currentNode)});
        } else {
            setDoneWinding(true);
        }
    }

    const recede = () => {
        reverse().then(() => {setChatNode(stage().currentNode)});
    }

    const isDrinkDecision = (targetNode: ChatNode|null) => {
        return targetNode && targetNode.direction == Direction.PatronDrinkRequest && targetNode.childIds.filter(id => stage().chatNodes[id] && stage().chatNodes[id].direction == Direction.PatronDrinkRequest).length == 0;
    }

    const getMessage = (targetNode: ChatNode|null) => {
        if (isDrinkDecision(targetNode)) {
            return `Select a drink to serve ${stage().patrons[targetNode?.selectedPatronId ?? ''].name}.`;
        } else if (targetNode && (!targetNode.parentId || !stage().chatNodes[targetNode.parentId] || targetNode.night != stage().chatNodes[targetNode.parentId].night)) {
            return `Night ${targetNode.night}`;
        }
        return '';
    }

    useEffect(() => {
        setChatNode(stage().currentNode);
        setSelectedBeverage(chatNode?.selectedBeverage ?? null);
        setDoneWinding(chatNode?.read ?? false);
        setAdvancing(false);
    }, [chatNode]);

    const message = (chatNode?.message ?? '').trim().replace(/^\s*\(.*?\)\s*/, '').trim()
    const bannerMessage = getMessage(chatNode);
    const bannerIsPost = getMessage(stage().chatNodes[chatNode?.parentId ?? '']) != '';
    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '100vh', }}>
            <div style={{position: 'relative', height: '8%', overflow: 'hidden'}}>
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
                     zIndex: 2,
                     overflow: 'hidden'
            }}>
                <Box layout sx={{...boxStyle, bottom: '17vh'}}>
                    <div style={{width: '100%'}}>
                        <div>
                            <Typography variant="h5" color="#AAAAAA">{chatNode?.speakerId ?? ''}</Typography>
                        </div>
                        <div>
                            <MessageWindup message={message} read={chatNode?.read ?? false}
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
                            ) : (makingBeverageDecision ? (
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

                {Object.keys(stage().patrons).map(patronId => {
                    const patron = stage().patrons[patronId];
                    let present = false;
                    let position = !history.find(node => node.direction == Direction.IntroducePatron && node.selectedPatronId == patronId) ? -40 : 140;
                    let emotion: Emotion = patron.emotion as Emotion ?? Emotion.neutral;
                    let isTalking = false;
                    if (chatNode && chatNode.presentPatronIds.includes(patronId)) {
                        const index = chatNode.presentPatronIds.length - chatNode.presentPatronIds.indexOf(patronId) - 1;
                        isTalking = patron.name.toLowerCase().includes(chatNode?.speakerId?.toLowerCase() ?? 'nevereverever');
                        if (isTalking && chatNode?.emotion) {
                            emotion = chatNode.emotion as Emotion ?? emotion;
                            patron.emotion = emotion;
                        }
                        position = getCharacterPosition(index, numberOfPatrons);
                        present = true;
                    }
                    return <PatronImage patron={patron}
                                        emotion={emotion}
                                        xPosition={position}
                                        isTalking={isTalking}
                                        present={present}/>;
                })}
                <MessageBanner
                    message = {bannerMessage}
                    post = {bannerIsPost}
                />
            </div>
            <Vignette active={chatNode?.read ?? false}/>
        </div>
    );
}
