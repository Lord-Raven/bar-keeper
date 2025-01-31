import React, {FC, useState} from "react";
import {ThemeProvider} from "@mui/material";
import {TitleScreen} from "./TitleScreen";
import {MessageWindow} from "./MessageWindow";
import {Stage} from "./Stage";

interface PlayAreaProps {
    stage: () => Stage;
}

export const PlayArea: FC<PlayAreaProps> = ({ stage }) => {
    const [onMenu, setOnMenu] = useState<boolean>(false);

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
                        <TitleScreen stage={stage} setOnMenu={handleSetOnMenu}/>
                    </div>
                ) : (
                    <MessageWindow
                        advance={() => {
                            void stage().advanceMessage()
                        }}
                        reverse={() => {
                            void stage().reverseMessage()
                        }}
                        chatNode={() => {
                            return stage().currentNode
                        }}
                        updateTime={() => {
                            return stage().updateTime
                        }}
                        stage={stage}
                        setOnMenu={handleSetOnMenu}
                    />
                )}
            </ThemeProvider>
        </div>
    );
}