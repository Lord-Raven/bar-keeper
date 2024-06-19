import {useWindupString} from "windups";
import {Box, IconButton, Typography} from "@mui/material";
import React from "react";
import ForwardIcon from "@mui/icons-material/Forward";

interface MessageWindupProps {
    message: string;
    options?: {};
}
function MessageWindup({message, options}: MessageWindupProps) {
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

interface MessageWindowProps {
    generate: () => void;
    getMessage: () => string;
}

interface MessageWindowState {
    message: string;
    doneWinding: boolean;
    generating: boolean;
    generate: () => void;
    getMessage: () => string;
}
export class MessageWindow extends React.Component<MessageWindowProps, MessageWindowState> {

    state: MessageWindowState = {
        message: '',
        doneWinding: false,
        generating: false,
        generate: () => {},
        getMessage: () => {return ''}
    }

    constructor(props: MessageWindowProps) {
        super(props);
    }

    setMessage(message: string) {
        console.log(`before: ${this.state.message}`);
        this.setState({
            message: message,
            doneWinding: false,
            generating: false,
            generate: this.state.generate,
            getMessage: this.state.getMessage
        });
        console.log(`after: ${this.state.message}`);
    }

    continue() {
        if (this.state.doneWinding) {
            this.state.generating = true;
            this.state.generate();
        } else {
            this.state.doneWinding = true;
        }
    }

    render() {
        if (this.state.getMessage() !== this.state.message) {
            this.setMessage(this.state.getMessage());
        }
        return (
            <Box sx={{
                p: 2,
                border: '1px dashed grey',
                backgroundColor: '#00000088',
                '&:hover': {backgroundColor: '#000000BB'}
            }}>
                <MessageWindup message={this.state.message} options={{onFinished: () => {
                        this.state.doneWinding = true;}, skipped: this.state.doneWinding}} />
                <div style={{verticalAlign: 'right'}}>
                    <IconButton style={{outline: 1, float: 'right'}} disabled={this.state.generating} color={'primary'}
                                onClick={() => this.continue()}>
                        <ForwardIcon/>
                    </IconButton>
                </div>
            </Box>
        );
    }
}