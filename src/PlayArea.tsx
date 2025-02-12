import {CircularProgress, Icon, IconButton, Typography} from "@mui/material";
import React, {FC, ReactNode, useEffect, useState} from "react";
import {Stage} from "./Stage";
import {ChatNode} from "./ChatNode";
import {Cancel, CheckCircle, ArrowForward, ArrowBack} from "@mui/icons-material";
import {Emotion} from "./Patron";
import Box from "./Box";
import {GenerationUi} from "./GenerationUi";
import {Direction} from "./Director";
import {Beverage} from "./Beverage";
import MessageWindup from "./MessageWindup";
import BeverageDetails from "./BeverageDetails";
import PatronImage from "./PatronImage";
import MessageBanner from "./MessageBanner";
import Vignette from "./Vignette";

const getCharacterPosition = (index: number, amount: number) => {
    const start = 5;
    const end = 95;
    const period = (end - start) / amount;
    return start + period * index + (period / 2);
}

export const boxStyle = {
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

interface PlayAreaProps {
    advance: () => Promise<void>;
    reverse: () => Promise<void>;
    stage: () => Stage;
    setOnMenu: (onMenu: boolean) => void;
}

export const PlayArea: FC<PlayAreaProps> = ({ advance, reverse, stage, setOnMenu }) => {
    const [advancing, setAdvancing] = useState<boolean>(false);
    const [doneWinding, setDoneWinding] = useState<boolean>(false);
    const [selectedBeverage, setSelectedBeverage] = useState<string|null>(stage().currentNode?.selectedBeverage ?? null);
    const [hoveredBeverage, setHoveredBeverage] = useState<Beverage|null>(null);
    const [chatNode, setChatNode] = useState<ChatNode|null>(stage().currentNode ?? null);

    const makingBeverageDecision = stage().isBeverageDecision() && !(chatNode?.read ?? false);
    const numberOfPatrons = Math.max(1, Object.keys(chatNode?.presentPatrons ?? {}).length);
    const history = chatNode ? stage().getNightlyNodes(chatNode) : [];

    const handleBeverageClick = (name: string) => {
        if (!advancing && makingBeverageDecision && (stage().currentNode?.beverageCounts[name] ?? 1 > 0)) {
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

    const getMessageElements = (targetNode: ChatNode|null): ReactNode|null => {
        if (isDrinkDecision(targetNode)) {
            return <><Typography color="primary" variant="h3">Select a drink to serve {stage().patrons[targetNode?.selectedPatronId ?? ''].name}.</Typography></>;
        } else if (targetNode && (!targetNode.parentId || !stage().chatNodes[targetNode.parentId] || targetNode.night != stage().chatNodes[targetNode.parentId].night)) {
            return <><Typography color="primary" variant="h2">Night {targetNode.night}</Typography></>;
        }
        return null;
    }

    useEffect(() => {
        setChatNode(stage().currentNode);
        setSelectedBeverage(chatNode?.selectedBeverage ?? null);
        setDoneWinding(chatNode?.read ?? false);
        setAdvancing(false);
    }, [chatNode]);

    const message = (chatNode?.message ?? '').trim().replace(/^\s*\(.*?\)\s*/, '').trim()
    const bannerElements = getMessageElements(chatNode);
    const bannerIsPost = getMessageElements(stage().chatNodes[chatNode?.parentId ?? '']) != null;
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
                        }, handleBeverageClick, setHoveredBeverage))}
                    </div>
                </Box>

                {Object.keys(stage().patrons).map(patronId => {
                    const patron = stage().patrons[patronId];
                    let present = false;
                    let position = !history.find(node => node.direction == Direction.IntroducePatron && node.selectedPatronId == patronId) ? -40 : 140;
                    let emotion: Emotion = chatNode?.presentPatrons[patronId] as Emotion ?? Emotion.neutral;
                    let isTalking = false;
                    if (chatNode && chatNode.presentPatrons[patronId]) {
                        const index = Object.keys(chatNode.presentPatrons).length - Object.keys(chatNode.presentPatrons).indexOf(patronId) - 1;
                        isTalking = patron.name.toLowerCase().includes(chatNode?.speakerId?.toLowerCase() ?? 'nevereverever');
                        position = getCharacterPosition(index, numberOfPatrons);
                        present = true;
                    }
                    return <PatronImage patron={patron}
                                        emotion={emotion}
                                        xPosition={position}
                                        isTalking={isTalking}
                                        present={present}/>;
                })}
                <BeverageDetails beverage={hoveredBeverage}/>
                <MessageBanner
                    elements = {bannerElements}
                    post = {bannerIsPost}
                />
            </div>
            <Vignette active={chatNode?.read ?? false}/>
        </div>
    );
}
