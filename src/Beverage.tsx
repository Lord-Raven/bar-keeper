import {ReactElement} from "react";
import ImageWithPopup from "./ImageWithPopup";

export class Beverage {
    name: string;
    description: string;
    imageUrl: string;

    constructor(name: string, description: string, imageUrl: string) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    render(): ReactElement {
        return this.imageUrl !== '' ? (
                <ImageWithPopup
                    src={this.imageUrl}
                    alt={`${this.name}`}
                    popupHeader={this.name}
                    popupBody={this.description}
                    popupSrc={this.imageUrl}
                />) :
                <></>;
    }
}
