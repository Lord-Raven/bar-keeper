import React, {FC, useState} from "react";
import {Stage} from "./Stage";
import {Avatar, Box, CircularProgress, IconButton, Typography} from "@mui/material";
import Grid from '@mui/material/Grid2';
import SettingsIcon from "@mui/icons-material/Settings"
import ReplayIcon from "@mui/icons-material/Replay";
import Popover from "@mui/material/Popover";
import {generateBeverageImage} from "./Generator";

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
    };

    const toggleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        setGenerationUiOpen(!generationUiOpen);
    };

    return <div>
        <IconButton style={{outline: 1}} color={'primary'}
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
                                <Avatar src={beverage.imageUrl} alt={beverage.name} sx={{ width: '10vh', height: '10vh', margin: '0 auto', }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1vh' }}>
                                    <Typography variant="body1" color='primary' sx={{ marginRight: '1vh' }}>{beverage.name}</Typography>
                                    {!inProgress[beverage.name] ? (
                                        <IconButton style={{outline: 1}} color={'primary'} onClick={() => {
                                            console.log('Click');
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

            </Popover>
        )}
    </div>
}

/*
                <Grid container spacing={1}>
                    <Grid container size={6}>
                        <Grid key='beverage-header' size={12}>
                            <Typography color='primary' variant="h5">Beverages</Typography>
                        </Grid>
                        {stage().beverages.map((beverage) => (
                            <Grid key={beverage.name} size={12} sx={{height: '350px'}}>
                                <Box sx={{ height: '300px', maxHeight: '100%', overflow: 'hidden' }}>
                                    <Avatar alt={beverage.name} src={beverage.imageUrl} sx={{width: 'auto', height: '100%'}}/>
                                </Box>
                                <Box sx={{ height: '50px',  overflow: 'hidden' }}>
                                    <Typography color='primary' variant="h6">{beverage.name}</Typography>
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
                            </Grid>
                        ))}
                    </Grid>
                    <Grid container size={6}>
                        <Grid key='patron-header' size={12}>
                            <Typography variant="h5">Patrons</Typography>
                        </Grid>
                        {Object.values(stage().patrons).map((patron) => (
                            <Grid container key={patron.name} size={12} sx={{height: '6vh'}}>
                                <Grid size={4}>
                                    <Avatar alt={patron.name} src={patron.imageUrl}/>
                                </Grid>
                                <Grid size={8}>
                                    <Typography variant="h6">{patron.name}</Typography>
                                    <IconButton style={{outline: 1}} color={'primary'} onClick={() => {}}>
                                        <ReplayIcon/>
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
                    */