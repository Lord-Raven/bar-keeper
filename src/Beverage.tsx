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

    render(selected: () => boolean, onClick: (id: string) => void): ReactElement {
        return this.imageUrl !== '' ? (
                <Box component="section" sx={{
                        p: 1,
                        borderRadius: 3,
                        border: selected() ? '3px solid yellow' : '',
                        boxSizing: 'border-box',
                        backgroundColor: '#00000000',
                        '&:hover': {backgroundColor: '#FFFFFF11'}
                }} onClick={() => {onClick(this.name);}}>
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
