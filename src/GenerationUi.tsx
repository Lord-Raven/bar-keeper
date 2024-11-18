import React, {FC, useState} from "react";
import {Stage} from "./Stage";
import {Avatar, Box, Grid, IconButton, Typography} from "@mui/material";
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

            </Popover>
        )}
    </div>
}