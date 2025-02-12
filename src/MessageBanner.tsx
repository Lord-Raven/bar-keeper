import React, {FC, ReactNode} from "react";
import {motion, Variants} from "framer-motion";

interface MessageBannerProps {
    elements: ReactNode|null;
    post: boolean;
}

const MessageBanner: FC<MessageBannerProps> = ({elements, post}) => {
    const variants: Variants = {
        start: {x: '-100vw', opacity: 0},
        visible: {x: 0, opacity: 1},
        exit: {x: '100vw', opacity: 0},
    };

    return (
        <motion.div
            initial="start"
            animate={elements ? 'visible' : (post ? 'exit' :  'start')}
            variants={variants}
            transition={{duration: 0.5}}
            style={{
                width: '100vw',
                height: '20vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                backgroundColor: '#000000BB',
                bottom: '50vh',
                left: 0,
                zIndex: 25,
            }}
        >
            {elements}
        </motion.div>
    );
};

export default MessageBanner;