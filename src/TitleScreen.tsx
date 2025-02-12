import {Stage} from "./Stage";
import React, {FC, useState} from "react";
import {Box, Button, LinearProgress, Typography} from "@mui/material";
import {generate} from "./Generator";
import {ArrowForward, Replay, Cancel, Check} from "@mui/icons-material";

interface TitleScreenProps {
    stage: () => Stage;
    setOnMenu: (onMenu: boolean) => void;
}

export const TitleScreen: FC<TitleScreenProps> = ({ stage, setOnMenu }) => {
    const [generating, setGenerating] = useState<boolean>(false);
    const [confirmReset, setConfirmReset] = useState<boolean>(false);

    const handleGenerateClick = () => {
        setConfirmReset(false);
        setGenerating(true);
        stage().isGenerating = true;
        generate(stage()).then(() => {
            setGenerating(false);
            setOnMenu(!stage().themeSummary)
        })
    };

    return (
        <div style={{background: `radial-gradient(ellipse at center, #00000033 50%, #000000BB 90%)`, height: '100vh', width: '100vw'}}>
            <div style={{display: 'flex', flexDirection: 'column', bottom: '2vh', gap: '2vh', alignItems: 'center'}}>
                <img src={`${stage().titleUrl}`} alt={"Barkeeper Title"} style={{maxWidth: '100%', height: 'auto'}}/>
                {generating ? (
                    <>
                        <Box style={{backgroundColor: '#00000088'}} color={'primary'}>
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
                                onClick={stage().settingSummary ? () => setConfirmReset(true) : handleGenerateClick}>
                            <Typography variant="h5" color='primary'>Start New Game</Typography>
                        </Button>
                        {confirmReset && (
                            <div>
                                <Typography variant="h5" color='primary'>This will delete all progress and start over!</Typography>
                                <div style={{display: 'flex', justifyContent: 'center', flexDirection: 'row'}}>
                                    <Button style={{outline: 1, backgroundColor: '#00000088', paddingRight: '1vw'}} color={'primary'}
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