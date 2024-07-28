import { Stage } from "./Stage";

export enum Direction {
    IntroduceBar = 'IntroduceBar',
    Lull = 'Lull',
    IntroducePatron = 'IntroducePatron',
    PatronBanter = 'PatronBanter',
    PatronProblem = 'PatronProblem',
    PatronDrinkRequest = 'PatronDrinkRequest',
    PatronLeaves = 'PatronLeaves'
}

interface InstructionInput {
    barDescription: string;
    playerName: string;
    patronName: string
}

export const generalInstruction = `[INST]Responses should follow a simple stageplay script format, where general storytelling is flavorfully presented by a NARRATOR, and characters present their own dialog and actions.[/INST]`
export const sampleScript = `[EXAMPLE RESPONSE]\n**NARRATOR**: General narration is provided by NARRATOR.\n\n**CHARACTER 1**: "Character dialog goes in quotations." Their actions don't.\n\n**NARRATOR**: Character 2 walks in.\n\n**CHARACTER 2**: "Hey."\n\n**CHARACTER 1**: "Welcome back, Character 2!" They give a friendly wave.\n[/EXAMPLE RESPONSE]`

const directionInstructions: {[direction in Direction]: (input: InstructionInput) => string } = {
    IntroduceBar: input => `Write a stageplay-script-formatted, visual novel style introduction to the bar described here: ${input.barDescription}. ` +
        `Depict a second-person scene where ${input.playerName} is setting up for the beginning of their shift one evening; do not introduce established patrons to the scene yet.`,
    Lull: input => `Continue the scene with some stageplay-script-formatted, visual novel style flavor as the evening slightly progresses; ${input.playerName} observes the environment or patrons with only trivial events or conversations--established patrons do not appear.`,
    IntroducePatron: input => `Continue the scene with some stageplay-script-formatted, visual novel style development as ${input.patronName} enters the bar. If ${input.patronName} is new, describe and introduce them in great detail. ` +
        `If they are a regular, focus on their interactions with ${input.playerName} or other patrons.`,
    PatronBanter: input => `Continue the scene with some stageplay-script-formatted, visual novel style development as the present patrons banter amongst themselves or with ${input.playerName}.`,
    PatronProblem: input => `Continue the scene with some stageplay-script-formatted, visual novel style development as one of the present patrons describes a personal problem to another patron or ${input.playerName}.`,
    PatronDrinkRequest: input => `Continue the scene with some stageplay-script-formatted, visual novel style development as ${input.patronName} asks the bartender, ${input.playerName}, for a drink. ` +
        `${input.patronName} will simply describe the flavor or style of drink they are in the mood for, rather than specifying the actual beverage they want--but their description should align with one of the bar's specialty beverages. ` +
        `Keep ${input.playerName} passive; they'll serve the drink in a future response.`,
    PatronLeaves: input => `Continue the scene with some stageplay-script-formatted, visual novel style development as ${input.patronName} bids farewell or otherwise departs the bar. ` +
        `Honor their personal style and connections to other patrons or ${input.playerName}.`,
}

export class Slice {
    direction: Direction|undefined;
    subSlices: SubSlice[];
    script: string;
    presentPatronIds: string[];
    selectedPatronId: string|undefined;

    constructor(direction: Direction|undefined, presentPatronIds: string[], selectedPatronId: string|undefined, script?: string) {
        this.direction = direction;
        this.presentPatronIds = presentPatronIds;
        this.selectedPatronId = selectedPatronId;
        this.subSlices = [];
        this.script = '';
        
        if (script) {
            this.setScript(script);
        }
    }

    setScript(script: string) {
        this.script = script;
        let currentSpeaker = '';
        let currentDialogue = '';
        this.subSlices = [];
        const lines = script.trim().split('\n');
        lines.forEach(line => {
            //console.log('Line:' + line);
            const match = line.match(/^\**(.[^*]+)\**:\s*(.+)$/i);
            if (match) {
                // If there's a current dialogue, push it to the parsedLines array
                if (currentSpeaker) {
                    this.subSlices.push(new SubSlice(currentSpeaker, currentDialogue.trim()));
                }
                // Start a new dialogue
                currentSpeaker = match[1];
                currentDialogue = match[2];
            } else if (currentSpeaker && currentDialogue.trim().length > 0) {
                // Continue the current dialogue
                this.subSlices.push(new SubSlice(currentSpeaker, currentDialogue.trim()));
                currentDialogue = line.trim();
            }
        });
        if (currentSpeaker) {
            this.subSlices.push(new SubSlice(currentSpeaker, currentDialogue.trim()));
        }
    }
}

export class SubSlice {
    body: string;
    speakerId: string|undefined;

    constructor(speakerId: string, body: string) {
        this.body = body;
        this.speakerId = speakerId;
        console.log('Build a SubSlice: ' + body + ':' + speakerId);
    }
}

export class Director {

    constructor() { }

    getPromptInstruction(stage: Stage, slice: Slice): string {
        return directionInstructions[slice.direction ?? Direction.IntroduceBar]({barDescription: stage.barDescription ?? '', playerName: stage.player.name ?? '', patronName: slice.selectedPatronId ? stage.patrons[slice.selectedPatronId].name : ''});
    }

    generateSlice(stage: Stage, currentSlice: Slice): Slice {
        let newDirection: Direction;
        switch (currentSlice.direction) {
            case undefined:
                newDirection = Direction.IntroduceBar;
                break;
            case Direction.IntroduceBar:
                newDirection = Direction.IntroducePatron;
                break;
            case Direction.Lull:
                newDirection = currentSlice.presentPatronIds.length < 5 ? Direction.IntroducePatron : Direction.PatronBanter;
                break;
            case Direction.IntroducePatron:
                newDirection = Math.random() > 0.5 ? Direction.PatronBanter : Direction.PatronProblem;
                break;
            case Direction.PatronBanter:
                newDirection = Math.random() > 0.5 ? Direction.PatronProblem : Direction.PatronDrinkRequest;
                break;
            case Direction.PatronProblem:
                newDirection = Math.random() > 0.5 ? Direction.PatronBanter : Direction.PatronDrinkRequest;
                break;
            case Direction.PatronDrinkRequest:
                newDirection = Math.random() > 0.5 ? Direction.PatronBanter : Direction.PatronLeaves;
                break;
            case Direction.PatronLeaves:
                newDirection = Math.random() > 0.5 ? Direction.Lull : Direction.IntroducePatron;
                break;
            default:
                console.log('Default to Lull');
                newDirection = Direction.Lull;
        }
        let selectedPatronId = undefined;
        let newPresentPatronIds = [...currentSlice.presentPatronIds];
        switch (newDirection) {
            case Direction.IntroducePatron:
                // Create a patron or pull an existing one
                if (newPresentPatronIds.length < Object.keys(stage.patrons).length) {
                    const keys = Object.keys(stage.patrons).filter(key => !newPresentPatronIds.includes(key));
                    selectedPatronId = keys[Math.floor(Math.random() * keys.length)];
                    newPresentPatronIds.push(selectedPatronId);
                } else {
                    console.log('Was IntroducePatron, but no one new to introduce, so patron banter');
                    newDirection = Direction.PatronBanter;
                }
                break;
            case Direction.PatronLeaves:
                // Select a patron to leave
                if (newPresentPatronIds.length > 0) {
                    selectedPatronId = newPresentPatronIds[Math.floor(Math.random() * newPresentPatronIds.length)];
                    newPresentPatronIds.splice(newPresentPatronIds.indexOf(selectedPatronId), 1);
                } else {
                    console.log('Was PatronLeaves, but no one is here, so Lull');
                    newDirection = Direction.Lull;
                }
                break;
            case Direction.PatronBanter:
            case Direction.PatronProblem:
            case Direction.PatronDrinkRequest:
                if (newPresentPatronIds.length > 0) {
                    selectedPatronId = newPresentPatronIds[Math.floor(Math.random() * newPresentPatronIds.length)];
                } else {
                    console.log('Was ' + newDirection + ' but no present patrons, so Lull');
                    newDirection = Direction.Lull;
                }
                break;
            default:
                break;
        }

        return new Slice(newDirection, newPresentPatronIds, selectedPatronId);
    }
}