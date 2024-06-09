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
        return (
            <ImageWithPopup
                src={this.name}
                alt={`${this.name} - ${this.description}`}
                popupHeader={this.name}
                popupBody={this.description}
                />
        );
    }
}
