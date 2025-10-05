import React from "react";
import {Typography} from "@mui/material";
import {Pace, WindupChildren} from "windups";

interface TextWithQuotesProps { text: string; read: boolean; }

const TextWithQuotes: React.FC<TextWithQuotesProps> = ({ text, read}) => {
    const regex = /"([^"]*)"/g;
    const parts = text.split(regex);
    return (
        <span className={read ? "prose-read" : "prose-unread"}>
            {parts.map((part, index) =>
                index % 2 === 1 ? (
                    <span className={read ? "quote-read" : "quote-unread"} key={index}>
                        "{part}"
                    </span>
                ) : (
                    part
                )
            )}
        </span>
    );
};

interface MessageWindupProps {
    message: string;
    read: boolean;
    options: {};
}

function MessageWindup({message, read, options}: MessageWindupProps) {

    return (
        <div style={{height: '100%', position: 'relative'}}>
            <Typography color='#00000000' style={{userSelect: 'none'}}>{message}</Typography>
            <div style={{position: 'absolute', top: '0px', left: '0px', zIndex: 10}}>
                <WindupChildren key={message} {...options}>
                    <Pace ms={3}>
                        <Typography component="span" style={{display: 'inline-block'}}><TextWithQuotes text={message} read={read}/></Typography>
                    </Pace>
                </WindupChildren>
            </div>
        </div>
    );
}

export default MessageWindup;
