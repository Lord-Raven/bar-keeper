import {Beverage} from "./Beverage";
import React, {FC} from "react";
import {motion, Variants} from "framer-motion";
import Box from "./Box";
import {Typography} from "@mui/material";
import {boxStyle} from "./PlayArea";

interface BeverageDetailsProps {
    beverage: Beverage|null;
}

const BeverageDetails: FC<BeverageDetailsProps> = ({beverage}) => {
    const variants: Variants = {
        active: {opacity: 1},
        inactive: {opacity: 0}
    }
    return (
        <motion.div
            animate={beverage ? 'active' : 'inactive'}
            variants={variants}
            transition={{duration: 0.3}}
            style={{
                position: 'absolute',
                width: '70vw',
                height: '20vh',
                display: 'flex',
                left: '15vw',
                bottom: '20vh',
                zIndex: 25
            }}
        >
            {beverage && <Box sx={{...boxStyle, display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'flex-start', height: '20vh'}}>
                <img src={beverage.imageUrl} alt={beverage.name} style={{height: '100%', width: 'auto', objectFit: 'cover'}}/>
                <Box>
                    <Typography variant='h5'>{beverage.name}</Typography>
                    <Typography>{beverage.description}</Typography>
                </Box>
            </Box>}
        </motion.div>
    )
}

export default BeverageDetails;