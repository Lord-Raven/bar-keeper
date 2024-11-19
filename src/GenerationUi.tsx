import React, {FC, useState} from "react";
import {Stage} from "./Stage";
import {Avatar, IconButton, Typography} from "@mui/material";
import Grid from '@mui/material/Grid2';
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
                    '& .MuiPopover-paper': {
                        pointerEvents: 'none',
                        border: '1px dashed grey',
                        backgroundColor: '#000000BB',
                        zIndex: 20,
                        boxSizing: 'border-box'
                    }
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
                <Grid container spacing={1}>
                    <Grid container size={6}>
                        <Grid key='beverage-header' size={12}>
                            <Typography variant="h5">Beverages</Typography>
                        </Grid>
                        {stage().beverages.map((beverage) => (
                            <Grid key={beverage.name} size={12} sx={{height: '8vh'}}>
                                <Avatar alt={beverage.name} src={beverage.imageUrl} sx={{width: '100%', height: 'auto'}}/>
                                <div>
                                    <Typography color={'primary'} variant="h6">{beverage.name}</Typography>
                                    <IconButton style={{outline: 1}} color={'primary'} onClick={() => {}}>
                                        <ReplayIcon/>
                                    </IconButton>
                                </div>
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
            </Popover>
        )}
    </div>
}