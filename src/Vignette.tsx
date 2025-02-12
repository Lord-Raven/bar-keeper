import React, {FC} from "react";
import {motion, Variants} from "framer-motion";

interface VignetteProps {
    active: boolean;
}

const Vignette: FC<VignetteProps> = ({active}) => {
    const variants: Variants = {
        active: {opacity: 1},
        inactive: {opacity: 0}
    }

    return (
        <motion.div
            initial="inactive"
            animate={active ? 'active' : 'inactive'}
            variants={variants}
            transition={{duration: 0.5}}
            style={{
                pointerEvents: 'none',
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                background: 'radial-gradient(ellipse at center, #00000000 70%, #000000BB 90%)',
                zIndex: 15,
            }}
        />
    );
}

export default Vignette;
