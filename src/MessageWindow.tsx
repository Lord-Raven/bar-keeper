import {useWindupString} from "windups";
import {Box, CircularProgress, IconButton, Typography} from "@mui/material";
import React, {FC, useEffect, useState} from "react";
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
    message: string;
}

export const MessageWindow: FC<MessageWindowProps> = ({ message, generate }) => {
    const [generating, setGenerating] = useState<boolean>(false);
    const [doneWinding, setDoneWinding] = useState<boolean>(false);
    const proceed = () => {
        if (doneWinding) {
            setGenerating(true);
            generate();
        } else {
            setDoneWinding(true);
        }
    }

    useEffect(() => {
        console.log('change?');
        setDoneWinding(false);
        setGenerating(false);
    }, [message]);

    return (
        <Box sx={{
            p: 2,
            border: '1px dashed grey',
            backgroundColor: '#00000088',
            '&:hover': {backgroundColor: '#000000BB'}
        }}>
            <MessageWindup message={message} options={{onFinished: () => {
                    setDoneWinding(true);}, skipped: doneWinding}} />
            <div style={{verticalAlign: 'right'}}>
                {generating ? (
                    <CircularProgress />
                ) : (
                    <IconButton style={{outline: 1, float: 'right'}} disabled={generating} color={'primary'}
                                onClick={proceed}>
                        <ForwardIcon/>
                    </IconButton>
                )
                }
            </div>
        </Box>
    );
}

/*interface MessageWindowState {
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
        console.log('constructor');
        this.setState({
            message: this.state.message,
            doneWinding: this.state.doneWinding,
            generating: this.state.generating,
            generate: props.generate,
            getMessage: props.getMessage
        })
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
        console.log('MessageWindow render()');
        console.log(this.state.getMessage());
        console.log(this.state.message);
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
                    {this.state.generating ? (
                            <CircularProgress />
                        ) : (
                            <IconButton style={{outline: 1, float: 'right'}} disabled={this.state.generating} color={'primary'}
                                onClick={() => this.continue()}>
                                <ForwardIcon/>
                            </IconButton>
                        )
                    }
                </div>
            </Box>
        );
    }
}*/