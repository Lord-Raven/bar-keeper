import {useWindupString} from "windups";
import {Typography} from "@mui/material";
import React, {Component, ReactElement} from "react";
import {S} from "vite/dist/node/types.d-aGj9QkWt";

interface MessageWindupProps {
    message: string;
    options?: {};
}
export function MessageWindup({message, options}: MessageWindupProps) {
    const [text] = useWindupString(message, options);
    return (
        <div style={{height: '100%', position: 'relative'}}>
            <Typography color='#00000000'>{message}</Typography>
            <div style={{position: 'absolute', top: '0px', left: '0px', zIndex: 1, userSelect: 'none'}}>
                <Typography color='primary'>{text}</Typography>
            </div>
        </div>
    );
}

/*class MessageWindow extends Component {

    state: MessageWindupProps = {''};

    render(): ReactElement {
        const [currentText] = useWindupString(state.message, options);
        return (
            <div style={{height: '100%', position: 'relative'}}>
                <Typography color='#00000000'>{this.fullText}</Typography>
                <div style={{position: 'absolute', top: '0px', left: '0px', zIndex: 1, userSelect: 'none'}}>
                    <Typography color='primary'>{this.currentText}</Typography>
                </div>
            </div>
        );
    }
}*/