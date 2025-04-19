import {Button, CircularProgress, Typography} from "@mui/material";
import {FC, ReactNode, useEffect, useState} from "react";
import {Stage} from "./Stage";
import {ChatNode} from "./ChatNode";
import {Cancel, CheckCircle, ArrowForward, ArrowBack, Refresh} from "@mui/icons-material";
import {Emotion, nameCheck} from "./Patron";
import Box from "./Box";
import {GenerationUi} from "./GenerationUi";
import {Direction} from "./Director";
import {Beverage} from "./Beverage";
import MessageWindup from "./MessageWindup";
import BeverageDetails from "./BeverageDetails";
import PatronImage from "./PatronImage";
import MessageBanner from "./MessageBanner";
import Vignette from "./Vignette";
import BlurOverlay from "./BlurOverlay";

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
    backgroundColor: '#000000CC',
    zIndex: 20,
    boxSizing: 'border-box',
    '&:hover': {backgroundColor: '#000000EE'}
}

interface PlayAreaProps {
    advance: (setErrorMessage: (message: string) => void) => Promise<void>;
    regen: (targetNode: ChatNode, setErrorMessage: (message: string) => void) => Promise<void>;
    reverse: () => Promise<void>;
    stage: () => Stage;
    setOnMenu: (onMenu: boolean) => void;
    setErrorMessage: (message: string) => void;
}

export const PlayArea: FC<PlayAreaProps> = ({ advance, regen, reverse, stage, setOnMenu, setErrorMessage }) => {
    const [advancing, setAdvancing] = useState<boolean>(false);
    const [doneWinding, setDoneWinding] = useState<boolean>(false);
    const [selectedBeverage, setSelectedBeverage] = useState<string|null>(stage().currentNode?.selectedBeverage ?? null);
    const [hoveredBeverage, setHoveredBeverage] = useState<Beverage|null>(null);
    const [chatNode, setChatNode] = useState<ChatNode|null>(stage().currentNode ?? null);

    const makingBeverageDecision = stage().isBeverageDecision() == true && !(chatNode?.read ?? false);
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
            advance(setErrorMessage).then(() => {setAdvancing(false); setChatNode(stage().currentNode)});
        } else {
            setDoneWinding(true);
        }
    }

    const reroll = () => {
        if (chatNode != null) {
            setAdvancing(true);
            regen(chatNode, setErrorMessage).then(() => {setAdvancing(false); setChatNode(stage().currentNode)});
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
        <div style={{position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden'}}>
            <div style={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
                <div style={{position: 'relative', height: '8%', overflow: 'hidden', zIndex: 50}}>
                    <GenerationUi stage={stage} setOnMenu={setOnMenu} setErrorMessage={setErrorMessage}/>
                    <Typography variant="h5" style={{float: 'right', backgroundColor: '#000000CC'}}>
                        Night {chatNode?.night ?? 1}
                    </Typography>
                </div>
                <BlurOverlay blurLevel={bannerElements ? 2 : (chatNode && Object.values(chatNode.presentPatrons).length > 0 ? 1 : 0)}/>
                <div
                     style={{
                         position: 'relative',
                         flexGrow: '1',
                         left: '1%',
                         width: '98%',
                         alignContent: 'center',
                         zIndex: 20,
                         overflow: 'hidden'
                }}>
                    <Box layout sx={{...boxStyle, bottom: '17vh'}}>
                        <div style={{width: '100%', display: 'flex', alignItems: 'center'}}>
                            <div style={{position: 'absolute', left: 0, height: '100%', display: 'flex', flexDirection: 'column'}}>
                                <Button
                                    style={{
                                        outline: 1,
                                        height: '50%',
                                        width: '40px',
                                        borderRadius: '10px'
                                    }}
                                    disabled={advancing || !chatNode}
                                    color={'primary'}
                                    onClick={reroll}
                                >
                                    <Refresh/>
                                </Button>
                                <Button
                                    style={{
                                        outline: 1,
                                        height: '50%',
                                        width: '40px',
                                        borderRadius: '10px'
                                    }}
                                    disabled={advancing || !chatNode || !chatNode?.parentId}
                                    color={'primary'}
                                    onClick={recede}
                                >
                                    <ArrowBack/>
                                </Button>
                            </div>
                            <div style={{flexGrow: 1, padding: '0 50px'}}>
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
                            </div>
                            <Button 
                                style={{
                                    outline: 1,
                                    height: '100%',
                                    width: '40px',
                                    position: 'absolute',
                                    right: 0,
                                    borderRadius: '10px'
                                }}
                                disabled={(advancing || (makingBeverageDecision && !selectedBeverage))}
                                color={'primary'}
                                onClick={proceed}
                            >
                                {advancing ? (
                                    <CircularProgress style={{position: 'absolute', right: 0}}/>
                                ): (makingBeverageDecision ? (
                                    selectedBeverage ? (
                                        <CheckCircle/>
                                    ) :
                                        <Cancel/>
                                ) : (
                                        <ArrowForward/>
                                    )
                                )}
                            </Button>
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
                    <BeverageDetails beverage={hoveredBeverage}/>
                    <MessageBanner
                        elements = {bannerElements}
                        post = {bannerIsPost}
                    />
                </div>
            </div>
            {Object.keys(stage().patrons).map(patronId => {
                const patron = stage().patrons[patronId];
                let present = false;
                let position = !history.find(node => node.direction == Direction.IntroducePatron && node.selectedPatronId == patronId) ? -40 : 140;
                let emotion: Emotion = chatNode?.presentPatrons[patronId] as Emotion ?? Emotion.neutral;
                let isTalking = false;
                if (chatNode && chatNode.presentPatrons[patronId]) {
                    const index = Object.keys(chatNode.presentPatrons).length - Object.keys(chatNode.presentPatrons).indexOf(patronId) - 1;
                    isTalking = nameCheck(patron.name, chatNode?.speakerId?.toLowerCase() ?? '');
                    position = getCharacterPosition(index, numberOfPatrons);
                    present = true;
                }
                return <PatronImage 
                                    key={patronId}
                                    patron={patron}
                                    emotion={emotion}
                                    xPosition={position}
                                    isTalking={isTalking}
                                    present={present}/>;
            })}
            <Vignette active={chatNode?.read ?? false}/>
        </div>
    );
}
