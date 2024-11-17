import {Stage} from "./Stage";
import {Box} from "@mui/material";
import React, {useState} from "react";

interface BeverageDisplayProps {
    stage: () => Stage;
}

export const BeverageDisplay: React.FC<BeverageDisplayProps> = ({ stage }) => {
    const [selectedBeverage, setSelectedBeverage] = useState<string>(stage().lastBeverageServed);

    const handleBeverageClick = (name: string) => {
        setSelectedBeverage(name);
        stage().setLastBeverageServed(name);
    };

    return (
        <Box component="section" sx={{
            p: 1,
            position: 'absolute',
            height: '98%',
            width: '100%',
            left: '0%',
            bottom: '1%',
            verticalAlign: 'middle',
            alignContent: 'center',
            border: '1px dashed grey',
            boxSizing: 'border-box',
            backgroundColor: '#00000088',
            '&:hover': {backgroundColor: '#000000BB'}
        }}>
            <div
                style={{height: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
                {stage().beverages.map(beverage => beverage.render(() => {return beverage.name == selectedBeverage}, handleBeverageClick))}
            </div>
        </Box>
    );
}