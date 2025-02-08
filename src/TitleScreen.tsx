import {Stage} from "./Stage";
import React, {FC, useState} from "react";
import {Button, LinearProgress, Typography} from "@mui/material";
import {generate} from "./Generator";
import Grid from "@mui/material/Grid2";
import {ArrowForward, Replay} from "@mui/icons-material";

interface TitleScreenProps {
    stage: () => Stage;
    setOnMenu: (onMenu: boolean) => void;
}

export const TitleScreen: FC<TitleScreenProps> = ({ stage, setOnMenu }) => {
    const [generating, setGenerating] = useState<boolean>(false);

    const handleGenerateClick = () => {
        stage().isGenerating = true;
        generate(stage()).then(() => {setOnMenu(!stage().themeSummary)})
    };


    return (
        <div style={{display: 'flex', flexDirection: 'column', height: '100vh', verticalAlign: 'middle'}}>

            {stage().isGenerating ? (
                <div>
                    <Typography>
                        {stage().loadingProgress}% - {stage().loadingDescription}
                    </Typography>
                    <LinearProgress sx={{outline: 'primary'}} variant="determinate" color="success"
                                    value={stage().loadingProgress}/>
                </div>
            ) : (
                <Grid container spacing={2} justifyContent="center">
                    <div>
                        <Button style={{outline: 1, backgroundColor: '#00000088'}} color={'primary'}
                                startIcon={<Replay/>}
                                onClick={handleGenerateClick}>
                            <Typography variant="h6" color='primary'>Start New Game</Typography>
                        </Button>
                    </div>
                    {stage().settingSummary && (
                        <div>
                            <Button style={{outline: 1, backgroundColor: '#00000088'}} color={'primary'}
                                    startIcon={<ArrowForward/>}
                                    onClick={() => setOnMenu(false)}>
                                <Typography variant="h6" color='primary'>Continue</Typography>
                            </Button>
                        </div>
                    )}
                </Grid>
            )}
        </div>
    );
}