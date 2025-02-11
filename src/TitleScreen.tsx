import {Stage} from "./Stage";
import React, {FC, useState} from "react";
import {Box, Button, LinearProgress, Typography} from "@mui/material";
import {generate} from "./Generator";
import {ArrowForward, Replay} from "@mui/icons-material";

interface TitleScreenProps {
    stage: () => Stage;
    setOnMenu: (onMenu: boolean) => void;
}

export const TitleScreen: FC<TitleScreenProps> = ({ stage, setOnMenu }) => {
    const [generating, setGenerating] = useState<boolean>(false);

    const handleGenerateClick = () => {
        setGenerating(true);
        stage().isGenerating = true;
        generate(stage()).then(() => {setGenerating(false); setOnMenu(!stage().themeSummary)})
    };

    return (
        <div style={{background: `radial-gradient(ellipse at center, #00000033 50%, #000000BB 90%)${stage().barImageUrl ? `, url(${stage().barImageUrl})` : ''}`,
            display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', justifyContent: 'center', verticalAlign: 'bottom'}}>
            <div style={{backgroundImage: `url(${stage().titleUrl})`, display: 'flex', justifyContent: 'center', flexDirection: 'column', height: '100vh', width: '100vw'}}>
                {generating ? (
                    <div>
                        <Box style={{backgroundColor: '#00000088'}} color={'primary'}>
                        <Typography>
                            {stage().loadingProgress}% - {stage().loadingDescription}
                        </Typography>
                        <LinearProgress sx={{outline: 'primary'}} variant="determinate" color="success"
                                        value={stage().loadingProgress}/>
                        </Box>
                    </div>
                ) : (
                    <div style={{display: 'flex', flexDirection: 'column', bottom: '10vh', height: '20vh', gap: '5vh', alignItems: 'center'}}>
                        <Button style={{outline: 1, backgroundColor: '#00000088'}} color={'primary'}
                                startIcon={stage().settingSummary ? <Replay/> : <ArrowForward/>}
                                onClick={handleGenerateClick}>
                            <Typography variant="h5" color='primary'>Start New Game</Typography>
                        </Button>
                        {stage().settingSummary && (
                            <Button style={{outline: 1, backgroundColor: '#00000088'}} color={'primary'}
                                    startIcon={<ArrowForward/>}
                                    onClick={() => setOnMenu(false)}>
                                <Typography variant="h5" color='primary'>Continue</Typography>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}