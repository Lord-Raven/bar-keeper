import {FC} from "react";
import {motion, Variants} from "framer-motion";

interface BlurOverlayProps {
    blurLevel: number;
}

const BlurOverlay: FC<BlurOverlayProps> = ({blurLevel}) => {
    const variants: Variants = {
        off: {zIndex: 2, opacity: 0.1},
        background: {zIndex: 2, opacity: 0.5},
        all: {zIndex: 15, opacity: 1}
    };
    return (
        <motion.div
            initial="off"
            animate={blurLevel == 0 ? 'off' : (blurLevel == 1 ? 'background' :  'all')}
            variants={variants}
            transition={{duration: 1}}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backdropFilter: "blur(3px)"
            }}
        />
    );
}

export default BlurOverlay;