import React, {FC, useState} from "react";
import {Stage} from "./Stage";
import {Avatar, Box, IconButton, Typography} from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import ReplayIcon from "@mui/icons-material/Replay";
import Popover from "@mui/material/Popover";

interface MessageWindowProps {
    stage: () => Stage;
}

export const GenerationUi: FC<MessageWindowProps> = ({ stage }) => {
    const [generationUiOpen, setGenerationUiOpen] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const toggleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        setGenerationUiOpen(!generationUiOpen);
    };

    return <div>
        <IconButton style={{outline: 1}} color={'primary'}
                    onClick={toggleOpen}>
            <ReplayIcon/>
        </IconButton>
        {generationUiOpen && (
            <Popover
                id={`mouse-over-popover-generation-ui`}
                sx={{
                    pointerEvents: 'none'
                }}
                open={generationUiOpen}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                disableRestoreFocus
            >
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
                    <Grid container rowSpacing={1} columnSpacing={4}>
                        <Grid container spacing={6}>
                            <Grid container spacing={12}>
                                <Typography variant="h6">Beverages</Typography>
                            </Grid>
                            {stage().beverages.map((beverage) => (
                                <Grid container key={beverage.name} spacing={12}>
                                    <Grid spacing={2}>
                                        <Avatar alt={beverage.name} src={beverage.imageUrl} sx={{width: '5%', height: '5%'}} />
                                    </Grid>
                                    <Grid spacing={8}>
                                        <Typography variant="body2">{beverage.name}</Typography>
                                    </Grid>
                                    <Grid spacing={2}>
                                        <IconButton style={{outline: 1}} color={'primary'} onClick={() => {}}>
                                            <ReplayIcon/>
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ))}
                        </Grid>

                        <Grid container spacing={6}>
                            <Grid container spacing={12}>
                                <Typography variant="h6">Patrons</Typography>
                            </Grid>
                            {Object.values(stage().patrons).map((patron) => (
                                <Grid container key={patron.name} spacing={12}>
                                    <Grid spacing={2}>
                                        <Avatar alt={patron.name} src={patron.imageUrl} sx={{width: '5%', height: '5%'}} />
                                    </Grid>
                                    <Grid spacing={8}>
                                        <Typography variant="body2">{patron.name}</Typography>
                                    </Grid>
                                    <Grid spacing={2}>
                                        <IconButton style={{outline: 1}} color={'primary'} onClick={() => {}}>
                                            <ReplayIcon/>
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                </Box>
            </Popover>
        )}
    </div>
}