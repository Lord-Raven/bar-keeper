import React, {ReactElement} from "react";
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

    render(selected: () => boolean, count: () => number, onClick: (id: string) => void, onHover: (beverage: Beverage|null) => void): ReactElement {

        return this.imageUrl !== '' ? (
                <Badge
                    key={this.name}
                    badgeContent={`${count()}`}
                    color="primary"
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    overlap="circular"
                    sx={{
                        flexShrink: 1,
                        '& .MuiBadge-badge': {
                            backgroundColor: count() > 0 ? '#3333FFCC' : '#666666CC',
                            color: 'white',
                            borderRadius: '50%',
                            fontSize: '1.5em',
                            minWidth: '1.6em',
                            height: '1.6em',
                            pointerEvents: 'none',
                        }
                }}>
                    <Box component="section" sx={{
                        p: 1,
                        borderRadius: 3,
                        border: selected() ? '3px solid yellow' : '',
                        boxSizing: 'border-box',
                        backgroundColor: count() > 0 ? '#00000000' : '#66666633',
                        '&:hover': {backgroundColor: count() > 0 ? '#FFFFFF11' : '#66666666'}
                    }} onClick={() => {
                        onClick(this.name);
                    }}>
                        <div style={{height: '90%'}}>
                            <img
                                src={this.imageUrl}
                                alt={`${this.name}`}
                                onMouseEnter={() => {onHover(this)}}
                                onMouseLeave={() => {onHover(null)}}
                                style={{height: '100%', width: 'auto', margin: '0 0px'}}
                            />
                        </div>
                    </Box>
                </Badge>) :
            <></>;
    }
}
