import {ReactElement} from "react";
import ImageWithPopup from "./ImageWithPopup";
import {Box} from "@mui/material";

export class Beverage {
    name: string;
    description: string;
    imageUrl: string;

    constructor(name: string, description: string, imageUrl: string) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    render(selected: boolean, onClick: (id: string) => void): ReactElement {
        const handleClick = () => {console.log('handleClick');onClick(this.name);};

        return this.imageUrl !== '' ? (
                <Box component="section" sx={{
                        p: 1,
                        border: selected ? '2px yellow' : '',
                        boxSizing: 'border-box',
                        backgroundColor: '#00000088',
                        '&:hover': {backgroundColor: '#000000BB'}
                }} onClick={handleClick}>
                    <ImageWithPopup
                        src={this.imageUrl}
                        alt={`${this.name}`}
                        popupHeader={this.name}
                        popupBody={this.description}
                        popupSrc={this.imageUrl}
                    />
                </Box>) :
                <></>;
    }
}
