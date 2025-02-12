import React, {FC, ReactNode} from "react";
import {motion, Variants} from "framer-motion";
import {Icon, Typography} from "@mui/material";
import {Cancel} from "@mui/icons-material";

interface ErrorPopupProps {
    message: string;
}

const ErrorPopup: FC<ErrorPopupProps> = ({message}) => {
    const variants: Variants = {
        active: {y: '90vh', opacity: 1},
        inactive: {y: '100vh', opacity: 0}
    };

    return (
        <motion.div
            animate={message ? 'active' : 'inactive'}
            variants={variants}
            transition={{duration: 0.2}}
            style={{
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