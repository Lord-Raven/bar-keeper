import {Patron} from "./Patron";

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

export const sampleScript = `[EXAMPLE]\n[Character Name]: "Character dialog goes in quotations." Actions don't.\n\n[NARRATOR]: General narration goes here. No dialog.\n\n[Another Character Name]: "More dialog for a different character."\n[/EXAMPLE]`

const directionInstructions: {[direction in Direction]: (input: InstructionInput) => string } = {
    IntroduceBar: input => `Write a visual novel script style introduction to the bar described here: ${input.barDescription}. ` +
        `Depict a second-person scene where ${input.playerName} is setting up for the beginning of their shift one evening.`,
    Lull: input => `Continue the scene with some two-to-three paragraph visual novel script style flavor as the evening slightly progresses; ${input.playerName} observes the environment or patrons with only trivial events or conversations.`,
    IntroducePatron: input => `Continue the scene with a two-to-three paragraph visual novel script style development as ${input.patronName} enters the bar. If ${input.patronName} is new, describe and introduce them in great detail. ` +
        `If they are a regular, focus on their interactions with ${input.playerName} or other patrons.`,
    PatronBanter: input => `Continue the scene with a two-to-three paragraph visual novel script style development as the patrons banter amongst themselves or with ${input.playerName}.`,
    PatronProblem: input => `Continue the scene with a two-to-three paragraph visual novel script style development as one of the patrons describes a personal problem to another patron or ${input.playerName}.`,
    PatronDrinkRequest: input => `Continue the scene with a one-to-two paragraph visual novel script style development as ${input.patronName} asks the bartender, ${input.playerName}, for a drink. ` +
        `${input.patronName} will simply describe the flavor or style of drink they are in the mood for, rather than specifying the actual beverage they want--but their description should align with one of the bar's specialty beverages. ` +
        `Keep ${input.playerName} passive; they'll serve the drink in a future response.`,
    PatronLeaves: input => `Continue the scene with a two-to-three paragraph visual script novel style development as ${input.patronName} bids farewell or otherwise departs the bar. ` +
        `Honor their personal style and connections to other patrons or ${input.playerName}.`,
}

export class Slice {
    direction: Direction|undefined;
    subSlices: SubSlice[];
    script: string;
    presentPatronIds: string[];

    constructor(script: string, direction: Direction|undefined, presentPatronIds: string[]) {
        this.script = script;
        this.direction = direction;
        this.presentPatronIds = presentPatronIds;

        const lines = script.trim().split('\n');
        this.subSlices = [];
        let currentSpeaker = '';
        let currentDialogue = '';

        lines.forEach(line => {
            const match = line.match(/^\[(\w+)\]:\s*(.*)$/);
            if (match) {
                // If there's a current dialogue, push it to the parsedLines array
                if (currentSpeaker) {
                    this.subSlices.push(new SubSlice(currentSpeaker, currentDialogue.trim()));
                }
                // Start a new dialogue
                currentSpeaker = match[1];
                currentDialogue = match[2];
            } else if (currentSpeaker) {
                // Continue the current dialogue
                currentDialogue += '\n\n' + line.trim();
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

    constructor(body: string, speakerId: string) {
        this.body = body;
        this.speakerId = speakerId;
    }
}

export class Director {
    direction: Direction|undefined;

    patrons: {[key: string]: Patron};
    presentPatronIds: string[];
    currentPatronId: string|null;


    constructor() {
        this.patrons = {};
        this.presentPatronIds = [];
        this.currentPatronId = null;
    }

    getPromptInstruction(barDescription: string, playerName: string): string {
        return directionInstructions[this.direction ?? Direction.IntroduceBar]({barDescription: barDescription, playerName: playerName, patronName: this.currentPatronId ? this.patrons[this.currentPatronId].name : ''});
    }

    setDirection(direction: Direction|undefined) {
        this.direction = direction;
    }

    chooseDirection(): Direction {
        let newDirection: Direction;
        switch (this.direction) {
            case undefined:
                newDirection = Direction.IntroduceBar;
                break;
            case Direction.IntroduceBar:
                newDirection = Direction.IntroducePatron;
                break;
            case Direction.Lull:
                newDirection = this.presentPatronIds.length < 5 ? Direction.IntroducePatron : Direction.PatronBanter;
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
        this.direction = newDirection;
        this.currentPatronId = null;
        switch (this.direction) {
            case Direction.IntroducePatron:
                // Create a patron or pull an existing one
                if (this.presentPatronIds.length < Object.keys(this.patrons).length) {
                    const keys = Object.keys(this.patrons).filter(key => !this.presentPatronIds.includes(key));
                    this.currentPatronId = keys[Math.floor(Math.random() * keys.length)];
                    this.presentPatronIds.push(this.currentPatronId);
                } else {
                    console.log('Was IntroducePatron, but no one new to introduce, so Lull');
                    this.direction = Direction.Lull;
                }
                break;
            case Direction.PatronLeaves:
                // Select a patron to leave
                if (this.presentPatronIds.length > 0) {
                    this.currentPatronId = this.presentPatronIds[Math.floor(Math.random() * this.presentPatronIds.length)];
                    this.presentPatronIds.splice(this.presentPatronIds.indexOf(this.currentPatronId), 1);
                } else {
                    console.log('Was PatronLeaves, but no one is here, so Lull');
                    this.direction = Direction.Lull;
                }
                break;
            case Direction.PatronBanter:
            case Direction.PatronProblem:
            case Direction.PatronDrinkRequest:
                if (this.presentPatronIds.length > 0) {
                    this.currentPatronId = this.presentPatronIds[Math.floor(Math.random() * this.presentPatronIds.length)];
                } else {
                    console.log('Was ' + this.direction + ' but no present patrons, so Lull');
                    this.direction = Direction.Lull;
                }
                break;
            default:
                break;
        }

        return newDirection;
    }
}