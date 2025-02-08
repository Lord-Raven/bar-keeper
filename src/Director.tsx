import { Stage } from "./Stage";
import {ChatNode} from "./ChatNode";

export enum Direction {
    NightStart = 'NightStart',
    Lull = 'Lull',
    IntroducePatron = 'IntroducePatron',
    PatronBanter = 'PatronBanter',
    PatronProblem = 'PatronProblem',
    PatronDrinkRequest = 'PatronDrinkRequest',
    PatronDrinkOutcome = 'PatronDrinkOutcome',
    PatronLeaves = 'PatronLeaves',
    NightEnd = 'NightEnd'
}

interface InstructionInput {
    barDescription: string;
    playerName: string;
    patronName: string;
    beverageName: string;
}

const generalInstruction = 'Your response will follow a simple stageplay format, where general storytelling is flavorfully presented by a NARRATOR, and characters present their own dialog and actions. Only PRESENT PATRONS and {{user}} are active at this time; ABSENT PATRONS remain absent. Minor character roles should be fleeting. Refer to {{user}} in second-person.'
export const sampleScript = '\n' +
        `**NARRATOR**: General narration is provided by the NARRATOR.\n\n` +
        `**CHARACTER 1**: (Character 1's mood) "Character1 is saying this, and dialog goes in quotations." Character 1's actions don't.\n\n` +
        `**NARRATOR**: Character 2 walks in.\n\n` +
        `**CHARACTER 2**: (Blandly) "Hey, Character 1."\n\n` +
        `**CHARACTER 1**: (Cheerful) "Welcome back, Character 2!" They give a friendly wave."\n\n` +
        `**CHARACTER 1**: (Curious) They think to themself, "You look different, Character 2."\n\n` +
        `**CHARACTER 2**: (Cheerful) Smiles broadly, "I'm trying a new hairstyle. Thanks for noticing!"\n\n` +
        `**NARRATOR**: Character 2 takes a seat down the bar from Character 1 and looks for you.\n\n` +
        `**{{user}}**: You approach Character 2, "What'll it be, Character 2?"\n\n` +
        `**CHARACTER 2**: (Thoughtful) "I think I'd like something refreshing and bright tonight."`;

const directionInstructions: {[direction in Direction]: (input: InstructionInput) => string } = {
    NightStart: input => `Introduce the bar described here: ${input.barDescription}. ` +
        `Depict a scene where ${input.playerName} is setting up for the beginning of their shift one evening--in second person. ${input.playerName} must remain alone in this moment. ${generalInstruction}`,
    
    Lull: input => `Continue the scene with some inconsequential flavor as the evening slightly progresses; ${input.playerName} observes the environment or ancillary patrons with only trivial events or conversations--significant patrons remain absent or passive.  ${generalInstruction}`,

    IntroducePatron: input => `Continue the scene with visual novel style development as ${input.patronName} enters the bar. If ${input.patronName} is new, describe and introduce them in great detail. ` +
        `If they are a regular, focus on their interactions with ${input.playerName} or other present patrons. No one is thirsty yet; patrons will focus on other matters. ${generalInstruction}`,
    
    PatronBanter: input => `Continue the scene with some visual novel style development as the PRESENT PATRONS banter amongst themselves or with ${input.playerName}. None of them are prepared to order a drink, so they will focus on their lives or other ongoing events. ${generalInstruction}`,

    PatronProblem: input => `Continue the scene with some visual novel style development as one of the PRESENT PATRONS describes a personal problem to another PRESENT PATRON or ${input.playerName}. No one wants to order a drink at this time. ${generalInstruction}`,

    PatronDrinkRequest: input => `Continue the scene with some visual novel style development leading up to ${input.patronName} asking the bartender, ${input.playerName}, for a unspecified drink. ` +
        `${input.patronName} will simply describe the flavor or style of drink they are in the mood for, rather than specifying the particular beverage they want. ` +
        `${input.playerName} remains passive; the drink will be served in a future response. ${generalInstruction}`,

    PatronDrinkOutcome: input => `Continue the scene with some visual novel style development as ${input.patronName} accepts the drink ${input.playerName} has chosen: ${input.beverageName}. ` +
        `Strongly steer the scene in a new direction--positive or negative--based on the nature of this beverage, ${input.patronName}'s reaction to the beverage, and how well it suits their current taste or mood. ${input.patronName} could be delighted, surprised, disappointed, disgusted, inspired, or even outraged. ${generalInstruction}`,

    PatronLeaves: input => `Continue the scene with some visual novel style development as ${input.patronName} (and only ${input.patronName}) bids farewell or otherwise departs the bar. ` +
        `Honor their personal style and connections to other patrons or ${input.playerName}. ${generalInstruction}`,

    NightEnd: input => `Wrap up the scene as ${input.playerName} cleans up and closes the bar, reflecting on the night's events.`
}

class Possibility {
    direction: Direction;
    patronId: string;
    odds: number;
    constructor(direction: Direction, patronId: string, odds: number) {
        this.direction = direction;
        this.patronId = patronId;
        this.odds = odds;
    }
}

export class Director {

    constructor() { }

    getPromptInstruction(stage: Stage, node: Partial<ChatNode>): string {
        console.log(`playerName: ${stage.player.name}\npatronName: ${node.selectedPatronId ? stage.patrons[node.selectedPatronId] : 'no selectedPatronId'}`);
        return directionInstructions[node.direction ?? Direction.NightStart]({
            barDescription: stage.barDescription ?? '',
            playerName: stage.player.name ?? '',
            patronName: node.selectedPatronId ? stage.patrons[node.selectedPatronId].name : '',
            beverageName: node.selectedBeverage ?? ''});
    }

    determineNextNodeProps(stage: Stage, currentNode: ChatNode|null): Partial<ChatNode> {
        let directionOdds: Possibility[] = [];

        const history = currentNode ? stage.getNightlyNodes(currentNode) : [];
        const drinksServed = history.filter(node => node.direction == Direction.PatronDrinkOutcome).length;
        const visits = history.filter(node => node.direction == Direction.IntroducePatron).length;


        switch (currentNode ? currentNode.direction : undefined) {
            case undefined:
                directionOdds.push(new Possibility(Direction.NightStart, '', 1000));
                break;
            case Direction.NightStart:
                for (let patronId of Object.keys(stage.patrons)) {
                    directionOdds.push(new Possibility(Direction.IntroducePatron, patronId, 10));
                }
                break;
            case Direction.NightEnd:
                directionOdds.push(new Possibility(Direction.NightStart, '', 1000));
                break;
            case Direction.Lull:
            case Direction.IntroducePatron:
            case Direction.PatronDrinkOutcome:
            case Direction.PatronBanter:
            case Direction.PatronProblem:
            case Direction.PatronLeaves:
                directionOdds.push(new Possibility(Direction.Lull, '', currentNode?.presentPatronIds?.length ?? 0 >= 1 ? 0 : 5));
                directionOdds.push(new Possibility(Direction.PatronBanter, '', 10));
                directionOdds.push(new Possibility(Direction.PatronProblem, '', 5));

                for (let patronId of currentNode?.presentPatronIds ?? []) {
                    directionOdds.push(new Possibility(Direction.PatronDrinkRequest, patronId, drinksServed < 5 ? 5 : 0));
                    directionOdds.push(new Possibility(Direction.PatronLeaves, patronId,  (drinksServed * 5) + (currentNode?.presentPatronIds?.length ?? 0) * 5));
                }

                // If max possible visits not hit, consider adding a patron (no more than five at a time)
                if (visits < Object.keys(stage.patrons).length) {
                    const keys = Object.keys(stage.patrons).filter(key => !newPresentPatronIds.includes(key) && !history.find(node => node.direction == Direction.IntroducePatron && node.selectedPatronId == key));
                    let selectedPatronId = keys[Math.floor(Math.random() * keys.length)];
                    directionOdds.push(new Possibility(Direction.IntroducePatron, selectedPatronId, 25 - (currentNode?.presentPatronIds?.length ?? 0) * 5));
                }

                // Replicate all of this:
                // If we've had a couple visits and the bar is empty, start jacking up the night end odds.
                if (visits >= 2 && (currentNode?.presentPatronIds?.length ?? 0) == 0) {
                    directionOdds.push(new Possibility(Direction.NightEnd, '', 10 + visits * 10));
                }
                directionOdds = directionOdds.filter(probability => probability.direction != currentNode?.direction ?? Direction.NightStart);
                break;
            case Direction.PatronDrinkRequest:
                directionOdds.push(new Possibility(Direction.PatronDrinkOutcome, '', 1000));
                break;
            default:
                console.log('Default to Lull');
                directionOdds.push(new Possibility(Direction.Lull, '', 1000));
        }
        let selectedPatronId = undefined;
        let newPresentPatronIds = [...(currentNode ? currentNode.presentPatronIds : [])];
        let selectedBeverage = undefined;

        // If coming from a departure, drop that character from the new present list.
        if (currentNode && currentNode.direction == Direction.PatronLeaves && newPresentPatronIds.includes(currentNode.selectedPatronId ?? '')) {
            newPresentPatronIds.splice(newPresentPatronIds.indexOf(currentNode.selectedPatronId ?? ''), 1);
        }

        const sumOfWeights = Object.values(directionOdds).reduce((sum, possibility) => sum + possibility.odds, 0);
        let randomNumber = Math.random() * sumOfWeights;
        let newDirection: Direction = Direction.Lull;

        for (let possibility of directionOdds) {
            if (randomNumber < possibility.odds) {
                newDirection = possibility.direction;
                selectedPatronId = possibility.patronId;
                break;
            }
            randomNumber -= possibility.odds;
        }

        if (newDirection == Direction.PatronDrinkOutcome) {
            selectedPatronId = currentNode?.selectedPatronId;
            selectedBeverage = currentNode?.selectedBeverage;
        }

        if (newDirection == Direction.IntroducePatron) {
            if (selectedPatronId) {
                newPresentPatronIds.push(selectedPatronId);
                console.log('Introduce ' + stage.patrons[selectedPatronId].name);
            } else {
                newDirection = Direction.PatronBanter;
            }
        }

        let night = (currentNode?.night ?? 0);
        let beverageCounts = currentNode?.beverageCounts;
        if (newDirection == Direction.NightStart) {
            night += 1;
            for (let beverage in beverageCounts) {
                beverageCounts[beverage] = Math.min(3, beverageCounts[beverage] + 1);
            }
        }

        return {
            direction: newDirection,
            presentPatronIds: newPresentPatronIds,
            selectedPatronId: selectedPatronId,
            selectedBeverage: selectedBeverage,
            beverageCounts: beverageCounts,
            night: night
        };
    }
}