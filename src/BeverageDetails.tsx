import {Beverage} from "./Beverage";
import React, {FC} from "react";
import {motion, Variants} from "framer-motion";
import Box from "./Box";
import {Typography} from "@mui/material";

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
                width: '70vw',
                height: '20vh',
                display: 'flex',
                left: '15vw',
                bottom: '20vh',
                zIndex: 20
            }}
        >
            {beverage && <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'flex-start', height: '20vh', p: '1', border: '1px dashed grey'}}>
                <img src={beverage.imageUrl} alt={beverage.name} style={{height: '100%', width: 'auto', objectFit: 'cover'}}/>
                <Box sx={{p: '1', display: 'flex', flexGrow: '1', flexDirection: 'column', maxWidth: '70%'}}>
                    <Typography variant='h5'>{beverage.name}</Typography>
                    <Typography>{beverage.description}</Typography>
                </Box>
            </Box>}
        </motion.div>
    )
}

export default BeverageDetails;