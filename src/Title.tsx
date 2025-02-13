import {Stage} from "./Stage";
import React, {FC, useState} from "react";
import {Box, Button, LinearProgress, Typography} from "@mui/material";
import {generate} from "./Generator";
import {ArrowForward, Replay, Cancel, Check} from "@mui/icons-material";

interface TitleProps {
    stage: () => Stage;
    setOnMenu: (onMenu: boolean) => void;
    setErrorMessage: (message: string) => void;
}

export const Title: FC<TitleProps> = ({ stage, setOnMenu, setErrorMessage }) => {
    const [generating, setGenerating] = useState<boolean>(false);
    const [confirmReset, setConfirmReset] = useState<boolean>(false);

    const handleGenerateClick = () => {
        setConfirmReset(false);
        setGenerating(true);
        stage().isGenerating = true;
        generate(stage(), setErrorMessage).then(() => {
            setGenerating(false);
            setOnMenu(!stage().themeSummary)
        })
    };

    return (
        <div style={{background: `radial-gradient(ellipse at center, #00000055 50%, #000000BB 90%)`, height: '100vh', width: '100vw'}}>
            <div style={{display: 'flex', flexDirection: 'column', bottom: '2vh', gap: '2vh', height: '100vh', width: '100vw', alignItems: 'center'}}>
                <img src={`${stage().titleUrl}`} alt={"Barkeeper Title"} style={{maxWidth: '100%', maxHeight: '100%', width: '1536px', height: 'auto'}}/>
                {generating ? (
                    <>
                        <Box sx={{backgroundColor: '#00000088', width: '80%'}} color={'primary'}>
                            <Typography>
                                {stage().loadingProgress}% - {stage().loadingDescription}
                            </Typography>
                            <LinearProgress sx={{outline: 'primary'}} variant="determinate" color="success"
                                            value={stage().loadingProgress}/>
                        </Box>
                    </>
                ) : (
                    <>
                        <Button style={{outline: 1, backgroundColor: '#00000088'}} color={'primary'}
                                startIcon={stage().settingSummary ? <Replay/> : <ArrowForward/>}
                                onClick={() => setConfirmReset(true)}>
                            <Typography variant="h5" color='primary'>Start New Game</Typography>
                        </Button>
                        {confirmReset && (
                            <div>
                                {stage().settingSummary ?
                                    <Typography variant="h5" color='primary'>This will delete all progress and start over!</Typography> :
                                    <Typography variant="h5" color='primary'>Warning! This could burn a _lot_ of tokens and may not be safe if you rely on a jailbreak.</Typography>}
                                <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'row', gap: '1vw'}}>
                                    <Button style={{outline: 1, backgroundColor: '#00000088'}} color={'primary'}
                                            startIcon={<Check/>}
                                            onClick={() => handleGenerateClick()}>
                                        <Typography variant="h5" color='primary'>Okay!</Typography>
                                    </Button>
                                    <Button style={{outline: 1, backgroundColor: '#00000088'}} color={'primary'}
                                            startIcon={<Cancel/>}
                                            onClick={() => setConfirmReset(false)}>
                                        <Typography variant="h5" color='primary'>No Way!</Typography>
                                    </Button>
                                </div>
                            </div>
                        )}
                        {stage().settingSummary && (
                            <Button style={{outline: 1, backgroundColor: '#00000088'}} color={'primary'}
                                    startIcon={<ArrowForward/>}
                                    onClick={() => setOnMenu(false)}>
                                <Typography variant="h5" color='primary'>Continue</Typography>
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}