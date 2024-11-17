import {FC} from "react";
import {Stage} from "./Stage";

interface MessageWindowProps {
    stage: () => Stage;
}

export const GenerationUi: FC<MessageWindowProps> = ({ stage }) => {
    return <div></div>
}