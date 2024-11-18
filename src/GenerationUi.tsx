import React, {FC, useState} from "react";
import {Stage} from "./Stage";
import {Avatar, Box, Grid, IconButton, Typography} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";

interface MessageWindowProps {
    stage: () => Stage;
}

export const GenerationUi: FC<MessageWindowProps> = ({ stage }) => {
    const [generationUiOpen, setGenerationUiOpen] = useState<boolean>(false);

    const toggleOpen = () => {
        setGenerationUiOpen(!generationUiOpen);
    };

    return <div>
        <IconButton style={{outline: 1}} color={'primary'}
                    onClick={toggleOpen}>
            <ReplayIcon/>
        </IconButton>
        {generationUiOpen && (
            <div style={{left: '1%', width: '98%'}}>
                <Box sx={{
                    p: 1,
                    left: '0%',
                    width: '100%',
                    height: '100%',
                    border: '1px dashed grey',
                    backgroundColor: '#00000088',
                    overflow: 'visible',
                    zIndex: 20,
                    boxSizing: 'border-box',
                    '&:hover': {backgroundColor: '#000000BB'}
                }}>
                    <Grid container spacing={2} direction="column">
                        <Grid item>
                            <Typography variant="h6">Beverages</Typography>
                        </Grid>
                        {stage().beverages.map((beverage) => (
                            <Grid item key={beverage.name} container alignItems="center" spacing={1}>
                                <Grid item>
                                    <Avatar alt={beverage.name} src={beverage.imageUrl} sx={{width: 'auto', height: '100%'}} />
                                </Grid>
                                <Grid item>
                                    <Typography variant="body2">{beverage.name}</Typography>
                                </Grid>
                                <Grid item>
                                    <IconButton style={{outline: 1}} color={'primary'} onClick={() => {}}>
                                        <ReplayIcon/>
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}
                    </Grid>
                    <Grid container spacing={2} direction="column">
                        <Grid item>
                            <Typography variant="h6">Patrons</Typography>
                        </Grid>
                        {stage().beverages.map((beverage) => (
                            <Grid item key={beverage.name} container alignItems="center" spacing={1}>
                                <Grid item>
                                    <Avatar alt={beverage.name} src={beverage.imageUrl} sx={{width: '5%', height: '5%'}} />
                                </Grid>
                                <Grid item>
                                    <Typography variant="body2">{beverage.name}</Typography>
                                </Grid>
                                <Grid item>
                                    <IconButton style={{outline: 1}} color={'primary'} onClick={() => {}}>
                                        <ReplayIcon/>
                                    </IconButton>
                                </Grid>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

            </div>
        )}
    </div>
}