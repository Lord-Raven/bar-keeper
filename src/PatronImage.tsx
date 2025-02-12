import {Emotion, Patron} from "./Patron";
import React, {FC} from "react";
import {motion, Variants} from "framer-motion";

const CHARACTER_HEIGHT: number = 100;

interface PatronImageProps {
    patron: Patron;
    emotion: Emotion;
    xPosition: number;
    isTalking: boolean;
    present: boolean;
}

const PatronImage: FC<PatronImageProps> = ({patron, emotion, xPosition, isTalking, present}) => {
    const variants: Variants = {
        talking: {color: '#FFFFFF', opacity: 1, x: `${xPosition}vw`, height: `${CHARACTER_HEIGHT + 2}vh`, filter: 'brightness(1)', zIndex: 12, transition: {x: {ease: "easeOut"}, opacity: {ease: "easeOut"}}},
        idle: {color: '#BBBBBB', opacity: 1, x: `${xPosition}vw`, height: `${CHARACTER_HEIGHT}vh`, filter: 'brightness(0.8)', zIndex: 11, transition: {x: {ease: "easeOut"}, opacity: {ease: "easeOut"}}},
        absent: {color: '#BBBBBB', opacity: 0, x: `${xPosition}vw`, height: `${CHARACTER_HEIGHT}vh`, filter: 'brightness(0.8)', zIndex: 11, transition: {x: {ease: "easeOut"}, opacity: {ease: "easeOut"}}},
    };

    const altText = `${patron.name} (${emotion})`

    return (
        <motion.div
            variants={variants}
            initial='idle'
            animate={present ? (isTalking ? 'talking' : 'idle') : 'absent'}
            style={{position: 'absolute', bottom: '-25vh', width: 'auto', aspectRatio: '9 / 16', zIndex: 10}}>
            <img src={patron.imageUrls[emotion]} style={{position: 'relative', width: '100%', height: '100%', transform: 'translate(-50%, 0)'}} alt={altText}/>
        </motion.div>
    );
};

export default PatronImage;