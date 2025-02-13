import React, {FC, ReactNode} from "react";
import {motion, Variants} from "framer-motion";
import {Icon, Typography} from "@mui/material";
import {Cancel} from "@mui/icons-material";

interface ErrorPopupProps {
    message: string;
}

const ErrorPopup: FC<ErrorPopupProps> = ({message}) => {
    const variants: Variants = {
        active: {y: 0, opacity: 1},
        inactive: {y: -100, opacity: 0}
    };

    return (
        <motion.div
            animate={message ? 'active' : 'inactive'}
            variants={variants}
            transition={{duration: 0.2}}
            style={{
                position: 'fixed',
                top: '0',
                left: '50%',
                transform: 'translate(-50%, 0)',
                backgroundColor: '#000000BB',
                width: '100%',
                zIndex: 99,
            }}
        >
            <Typography>
                <Icon style={{outline: 1, float: 'left'}} color={'warning'}>
                    <Cancel/>
                </Icon>
                {message}
            </Typography>
        </motion.div>
    );
};

export default ErrorPopup;