import {useWindupString} from "windups";
import {Typography} from "@mui/material";
import React, {Component, ReactElement} from "react";
import {S} from "vite/dist/node/types.d-aGj9QkWt";

interface MessageWindupProps {
    message: string;
    options?: {};
    skipFunction?: () => boolean;
}
export function MessageWindup({message, options, skipFunction}: MessageWindupProps) {
    const skipped = skipFunction ? skipFunction() : false;
    const [text] = useWindupString(message, {...options, skipped: skipped});
    return (
        <div style={{height: '100%', position: 'relative'}}>
            <Typography color='#00000000'>{message}</Typography>
            <div style={{position: 'absolute', top: '0px', left: '0px', zIndex: 1, userSelect: 'none'}}>
                <Typography color='primary'>{text}</Typography>
            </div>
        </div>
    );
}

/*
interface MessageWindupProps {
    message: string;
    options?: {};
    skipFunction?: () => boolean;
}
export function MessageWindup({message, options, skipFunction}: MessageWindupProps)
    const skipped: boolean = skipFunction;
    const [text] = useWindupString(message, {options, skipped: skipped});
    return (
        <div style={{height: '100%', position: 'relative'}}>
            <Typography color='#00000000'>{message}</Typography>
            <div style={{position: 'absolute', top: '0px', left: '0px', zIndex: 1, userSelect: 'none'}}>
                <Typography color='primary'>{text}</Typography>
            </div>
        </div>
    );
}
 */
/*export class MessageWindow extends Component {

    constructor(props) {
        super(props);

        this.state = {

        }
    }

    fullText: string = '';
    options: any = {};

    MessageWindow(fullText: string, options: any) {
        this.fullText = fullText;
        this.options = options;
    }

    setSkipped(skipped: boolean) {
        this.options.skipped = skipped;
    }

    render(): {
        const { fullText: string, options: any} = this.props;
        const [currentText] = useWindupString(this.fullText, this.options);
        return (
            <div style={{height: '100%', position: 'relative'}}>
                <Typography color='#00000000'>{this.fullText}</Typography>
                <div style={{position: 'absolute', top: '0px', left: '0px', zIndex: 1, userSelect: 'none'}}>
                    <Typography color='primary'>{currentText}</Typography>
                </div>
            </div>
        );
    }
}*/