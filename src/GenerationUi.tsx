import React, {FC, useState} from "react";
import {Stage} from "./Stage";
import {Box, Button, CircularProgress, IconButton, Typography} from "@mui/material";
import Grid from '@mui/material/Grid2';
import SettingsIcon from "@mui/icons-material/Settings"
import ReplayIcon from "@mui/icons-material/Replay";
import Popover from "@mui/material/Popover";
import {generate, generateBeverageImage, generatePatronImage} from "./Generator";
import {Emotion} from "./Patron";

interface MessageWindowProps {
    stage: () => Stage;
}

export const GenerationUi: FC<MessageWindowProps> = ({ stage }) => {
    const [generationUiOpen, setGenerationUiOpen] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const [inProgress, setInProgress] = React.useState<{[key: string]: boolean}>({});


    const putInProgress = (key: string, value: boolean) => {
        setInProgress({...inProgress, [key]: value});
    }

    const handleClose = () => {
        setAnchorEl(null);
        setGenerationUiOpen(false);
        stage().updateChatState().then(() => {console.log('Updated chat state after closing generation UI.')});
    };

    const toggleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        setGenerationUiOpen(!generationUiOpen);
    };

    return <div>
        <IconButton style={{outline: 1, backgroundColor: '#00000088'}} color={'primary'}
                    onClick={toggleOpen}>
            <SettingsIcon/>
        </IconButton>
        {generationUiOpen && (
            <Popover
                id={`mouse-over-popover-generation-ui`}
                sx={{
                    '& .MuiPopover-paper': {
                        border: '1px dashed grey',
                        backgroundColor: '#000000BB',
                        zIndex: 20,
                        width: '100vw',
                        boxSizing: 'border-box'
                    }
                }}
                open={generationUiOpen}
                onClose={handleClose}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <Grid container spacing={2} justifyContent="center">
                    {stage().beverages.map((beverage) => (
                        <Grid key={beverage.name}>
                            <Box sx={{ textAlign: 'center', height: '20vh' }}>
                                <img src={beverage.imageUrl} alt={beverage.name} style={{ width: 'auto', height: '15vh', margin: '0 auto'}} />
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1vh' }}>
                                    <Typography variant="h6" color='primary' sx={{ marginRight: '1vh' }}>{beverage.name}</Typography>
                                    {!inProgress[beverage.name] ? (
                                        <IconButton style={{outline: 1}} color={'primary'} onClick={() => {
                                            putInProgress(beverage.name, true);
                                            generateBeverageImage(stage(), beverage).then(() => {putInProgress(beverage.name, false)});}}>
                                            <ReplayIcon/>
                                        </IconButton>
                                    ) : (
                                        <CircularProgress/>
                                    )}
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <Grid container spacing={2} justifyContent="center">
                    {Object.values(stage().patrons).map((patron) => (
                        <Grid key={patron.name}>
                            <Box sx={{ textAlign: 'center', height: '20vh' }}>
                                <img src={patron.imageUrls[Emotion.neutral]} alt={patron.name} style={{ width: 'auto', height: '15vh', margin: '0 auto'}} />
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1vh' }}>
                                    <Typography variant="h6" color='primary' sx={{ marginRight: '1vh' }}>{patron.name}</Typography>
                                    {!inProgress[patron.name] ? (
                                        <IconButton style={{outline: 1}} color={'primary'} onClick={() => {
                                            putInProgress(patron.name, true);
                                            generatePatronImage(stage(), patron, Emotion.neutral).then(() => {putInProgress(patron.name, false)});}}>
                                            <ReplayIcon/>
                                        </IconButton>
                                    ) : (
                                        <CircularProgress/>
                                    )}
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <Button style={{outline: 1, backgroundColor: '#00000088'}} color={'primary'}
                            startIcon={<ReplayIcon/>}
                            onClick={() => generate(stage())}>
                    Regenerate
                </Button>

            </Popover>
        )}
    </div>
}
