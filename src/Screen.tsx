import React, {FC, useEffect, useState} from "react";
import {ThemeProvider} from "@mui/material";
import {Title} from "./Title";
import {PlayArea} from "./PlayArea";
import {Stage} from "./Stage";
import ErrorPopup from "./ErrorPopup";

interface ScreenProps {
    stage: () => Stage;
}

export const Screen: FC<ScreenProps> = ({ stage }) => {
    const [onMenu, setOnMenu] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const sendError = (message: string) => {
        setErrorMessage(message);
        setTimeout(() => {setErrorMessage('')}, 5000);
    }

    const handleSetOnMenu = (onMenu: boolean) => {
        setOnMenu(onMenu);
    };

    useEffect(() => {}, [errorMessage]);

    return (
        <div style={{
            backgroundImage: stage().barImageUrl ? `url(${stage().barImageUrl})` : '',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            width: '100vw',
            height: '100vh',
            color: '#ffffff'
        }}>
            <ErrorPopup message={errorMessage}/>
            <ThemeProvider theme={stage().theme}>
                {onMenu ? (
                        <Title stage={stage} setOnMenu={handleSetOnMenu} setErrorMessage={sendError}/>
                ) : (
                    <PlayArea
                        advance={(setErrorMessage: (message: string) => void) => stage().advanceMessage(setErrorMessage)}
                        reverse={() => stage().reverseMessage()}
                        stage={stage}
                        setOnMenu={handleSetOnMenu}
                        setErrorMessage={sendError}
                    />
                )}
            </ThemeProvider>
        </div>
    );
}