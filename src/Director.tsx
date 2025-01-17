import { Stage } from "./Stage";
import {ChatNode} from "./ChatNode";

export enum Direction {
    IntroduceBar = 'IntroduceBar',
    Lull = 'Lull',
    IntroducePatron = 'IntroducePatron',
    PatronBanter = 'PatronBanter',
    PatronProblem = 'PatronProblem',
    PatronDrinkRequest = 'PatronDrinkRequest',
    PatronDrinkOutcome = 'PatronDrinkOutcome',
    PatronLeaves = 'PatronLeaves',
}

interface InstructionInput {
    barDescription: string;
    playerName: string;
    patronName: string;
    beverageName: string;
}

const generalInstruction = 'Your response will follow a simple stageplay format, where general storytelling is flavorfully presented by a NARRATOR, and characters present their own dialog and actions. Focus events on {{user}} and characters found in PRESENT PATRONS; other character roles should be fleeting. Refer to {{user}} in second-person.'
export const sampleScript = '' +
        `**NARRATOR**: General narration is provided by the NARRATOR.\n\n` +
        `**CHARACTER 1**: "Character dialog goes in quotations." Their actions don't.\n\n` +
        `**NARRATOR**: Character 2 walks in.\n\n` +
        `**CHARACTER 2**: "Hey, Character 1."\n\n` +
        `**CHARACTER 1**: "Welcome back, Character 2!" They give a friendly wave.\n\n` +
        `**CHARACTER 1**: They think to themself, "You look different, Character 2."\n\n` +
        `**CHARACTER 2**: Smiles broadly, "I'm trying a new hairstyle. Thanks for noticing!"\n\n` +
        `**NARRATOR**: Character 2 takes a seat down the bar from Character 1 and looks for you.\n\n` +
        `**{{user}}**: You approach Character 2, "What'll it be, Character 2?`;

const directionInstructions: {[direction in Direction]: (input: InstructionInput) => string } = {
    IntroduceBar: input => `Write a visual novel style introduction to the bar described here: ${input.barDescription}. ` +
        `Depict a second-person scene where ${input.playerName} is setting up for the beginning of their shift one evening; do not introduce established patrons to the scene yet. ${generalInstruction}`,
    
    Lull: input => `Continue the scene with some visual novel style flavor as the evening slightly progresses; ${input.playerName} observes the environment or ancillary patrons with only trivial events or conversations--established patrons remain absent or passive.  ${generalInstruction}`,

    IntroducePatron: input => `Continue the scene with visual novel style development as ${input.patronName} enters the bar. If ${input.patronName} is new, describe and introduce them in great detail. ` +
        `If they are a regular, focus on their interactions with ${input.playerName} or other patrons. They aren't ready to order a drink yet and will focus on something else. ${generalInstruction}`,
    
    PatronBanter: input => `Continue the scene with some visual novel style development as the PRESENT PATRONS banter amongst themselves or with ${input.playerName}. None of them are prepared to order a drink and will focus on their lives or other ongoing events. ${generalInstruction}`,

    PatronProblem: input => `Continue the scene with some visual novel style development as one of the PRESENT PATRONS describes a personal problem to another PRESENT PATRON or ${input.playerName}. No one wants to order a drink at this time. ${generalInstruction}`,

    PatronDrinkRequest: input => `Continue the scene with some visual novel style development leading up to ${input.patronName} asking the bartender, ${input.playerName}, for a unspecified drink. ` +
        `${input.patronName} will simply describe the flavor or style of drink they are in the mood for, rather than specifying the particular beverage they want. ` +
        `${input.playerName} remains passive; the drink will be served in a future response. ${generalInstruction}`,

    PatronDrinkOutcome: input => `Continue the scene with some visual novel style development as ${input.patronName} accepts the drink ${input.playerName} has chosen: ${input.beverageName}. ` +
        `Strongly steer the scene in a new direction--positive or negative--based on the nature of this beverage, ${input.patronName}'s reaction to the beverage, and how well it suits their current taste or mood. ${generalInstruction}`,

    PatronLeaves: input => `Continue the scene with some visual novel style development as ${input.patronName} (and only ${input.patronName}) bids farewell or otherwise departs the bar. ` +
        `Honor their personal style and connections to other patrons or ${input.playerName}. ${generalInstruction}`,
    
}

export class Director {

    constructor() { }

    getPromptInstruction(stage: Stage, node: Partial<ChatNode>): string {
        console.log(stage.patrons);
        console.log(`'${node.selectedPatronId}'`);
        console.log(`playerName: ${stage.player.name}\npatronName: ${node.selectedPatronId ? stage.patrons[node.selectedPatronId] : 'no selectedPatronId'}`);
        return directionInstructions[node.direction ?? Direction.IntroduceBar]({
            barDescription: stage.barDescription ?? '',
            playerName: stage.player.name ?? '',
            patronName: node.selectedPatronId ? stage.patrons[node.selectedPatronId].name : '',
            beverageName: stage.lastBeverageServed ?? ''});
    }

    determineNextNodeProps(stage: Stage, currentNode: ChatNode|null): Partial<ChatNode> {
        let newDirection: Direction;
        switch (currentNode ? currentNode.direction : undefined) {
            case undefined:
                newDirection = Direction.IntroduceBar;
                break;
            case Direction.IntroduceBar:
                newDirection = Direction.IntroducePatron;
                break;
            case Direction.Lull:
                // @ts-ignore
                newDirection = currentNode.presentPatronIds.length < 5 ? Direction.IntroducePatron : Direction.PatronBanter;
                break;
            case Direction.IntroducePatron:
                newDirection = Math.random() > 0.5 ? Direction.PatronBanter : Direction.PatronProblem;
                break;
            case Direction.PatronDrinkOutcome:
            case Direction.PatronBanter:
                newDirection = Math.random() > 0.3 ? Direction.PatronProblem : (Math.random() > (0.2 * (currentNode?.presentPatronIds?.length ?? 0)) ? Direction.IntroducePatron : (Math.random() > 0.5 ? Direction.PatronDrinkRequest : Direction.PatronLeaves));
                break;
            case Direction.PatronProblem:
                newDirection = Math.random() > 0.7 ? Direction.PatronBanter : Direction.PatronDrinkRequest;
                break;
            case Direction.PatronDrinkRequest:
                newDirection = Direction.PatronDrinkOutcome;
                break;
            case Direction.PatronLeaves:
                newDirection = Math.random() > 0.5 ? Direction.PatronBanter : Direction.IntroducePatron;
                break;
            default:
                console.log('Default to Lull');
                newDirection = Direction.Lull;
        }
        let selectedPatronId = undefined;
        let newPresentPatronIds = [...(currentNode ? currentNode.presentPatronIds : [])];

        // Try to keep at least a couple characters into the scene.
        if (newDirection != Direction.IntroduceBar && newPresentPatronIds.length < 2) {
            newDirection = Direction.IntroducePatron;
        }

        if (newDirection == Direction.PatronDrinkOutcome) {
            selectedPatronId = currentNode?.selectedPatronId;
            if (!selectedPatronId || selectedPatronId.length == 0) {
                console.log('Was ' + newDirection + ' but no previous patron for drink request, so PatronBanter');
                newDirection = Direction.PatronBanter;
                selectedPatronId = undefined;
            }
        }

        if ([Direction.PatronBanter, Direction.PatronProblem, Direction.PatronDrinkRequest].includes(newDirection)) {
                if (newPresentPatronIds.length > 0) {
                    selectedPatronId = newPresentPatronIds[Math.floor(Math.random() * newPresentPatronIds.length)];
                } else {
                    console.log('Was ' + newDirection + ' but no present patrons, so IntroducePatron');
                    newDirection = Direction.Lull;
                }
        }

        if (newDirection == Direction.IntroducePatron) {
            // Create a patron or pull an existing one
            if (newPresentPatronIds.length < Object.keys(stage.patrons).length) {
                const keys = Object.keys(stage.patrons).filter(key => !newPresentPatronIds.includes(key));
                selectedPatronId = keys[Math.floor(Math.random() * keys.length)];
                newPresentPatronIds.push(selectedPatronId);
                console.log('Introduce ' + selectedPatronId);
            } else {
                console.log('Was IntroducePatron, but no one new to introduce, so patron banter');
                newDirection = Direction.PatronBanter;
            }
        }

        if (newDirection == Direction.PatronLeaves) {
            // Select a patron to leave
            if (newPresentPatronIds.length > 0) {
                selectedPatronId = newPresentPatronIds[Math.floor(Math.random() * newPresentPatronIds.length)];
                newPresentPatronIds.splice(newPresentPatronIds.indexOf(selectedPatronId), 1);
                console.log('depart ' + selectedPatronId);
            } else {
                console.log('Was PatronLeaves, but no one is here, so Lull');
                newDirection = Direction.Lull;
            }
        }

        return {
            direction: newDirection,
            presentPatronIds: newPresentPatronIds,
            selectedPatronId: selectedPatronId
        };
    }
}