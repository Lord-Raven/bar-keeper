import {ReactElement} from "react";
import ImageWithPopup from "./ImageWithPopup";
import {Badge, Box} from "@mui/material";

export class Beverage {
    name: string;
    description: string;
    imageUrl: string;

    constructor(name: string, description: string, imageUrl: string) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    render(selected: () => boolean, count: () => number, onClick: (id: string) => void): ReactElement {
        return this.imageUrl !== '' ? (

                    <Box component="section" sx={{
                            p: 1,
                            borderRadius: 3,
                            border: selected() ? '3px solid yellow' : '',
                            boxSizing: 'border-box',
                            backgroundColor: count() > 0 ? '#00000000' : '#66666633',
                            '&:hover': {backgroundColor: count() > 0 ? '#FFFFFF11' : '#66666666'}
                    }} onClick={() => {onClick(this.name);}}>
                        <Badge
                            badgeContent={`${count()}`}
                            color="primary"
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            sx={{
                                '& .MuiBadge-badge': {
                                    backgroundColor: count() > 0 ? 'blue' : '#66666666',
                                    color: 'white',
                                    borderRadius: '50%',
                                }
                            }}>
                            <ImageWithPopup
                                src={this.imageUrl}
                                alt={`${this.name}`}
                                popupHeader={this.name}
                                popupBody={this.description}
                                popupSrc={this.imageUrl}
                            />
                        </Badge>
                    </Box>) :
                <></>;
    }
}
