import React, {FC, useState} from "react";
import {ThemeProvider} from "@mui/material";
import {Title} from "./Title";
import {PlayArea} from "./PlayArea";
import {Stage} from "./Stage";

interface ScreenProps {
    stage: () => Stage;
}

export const Screen: FC<ScreenProps> = ({ stage }) => {
    const [onMenu, setOnMenu] = useState<boolean>(true);

    const handleSetOnMenu = (onMenu: boolean) => {
        setOnMenu(onMenu);
    };

    return (
        <div style={{
            backgroundImage: stage().barImageUrl ? `url(${stage().barImageUrl})` : '',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            color: '#ffffff'
        }}>
            <ThemeProvider theme={stage().theme}>
                {onMenu ? (
                    <div>
                        <Title stage={stage} setOnMenu={handleSetOnMenu}/>
                    </div>
                ) : (
                    <PlayArea
                        advance={() => stage().advanceMessage()}
                        reverse={() => stage().reverseMessage()}
                        stage={stage}
                        setOnMenu={handleSetOnMenu}
                    />
                )}
            </ThemeProvider>
        </div>
    );
}