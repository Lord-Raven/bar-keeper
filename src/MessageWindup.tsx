import {useWindupString} from "windups";

interface MessageWindupProps {
    message: string;
}
export function MessageWindup({message}: MessageWindupProps) {
    const [text] = useWindupString(message);
    return <div>{text}</div>;
}