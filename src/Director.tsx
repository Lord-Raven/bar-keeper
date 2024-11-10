import { Stage } from "./Stage";

export enum Direction {
    IntroduceBar = 'IntroduceBar',
    Lull = 'Lull',
    IntroducePatron = 'IntroducePatron',
    PatronBanter = 'PatronBanter',
    PatronProblem = 'PatronProblem',
    PatronDrinkRequest = 'PatronDrinkRequest',
    PatronLeaves = 'PatronLeaves',
    Choice = 'Choice',
    Outcome = 'Outcome'
}

interface InstructionInput {
    barDescription: string;
    playerName: string;
    patronName: string
}

const generalInstruction = 'Responses follow a simple stageplay style format, where general storytelling is flavorfully presented by a NARRATOR, and characters present their own dialog and actions. Refer to ${input.playerName} in second-person.'
export const sampleScript = `**NARRATOR**: General narration is provided here.\n\n**CHARACTER 1**: "Character dialog goes in quotations." Their actions don't.\n\n**NARRATOR**: Character 2 walks in.\n\n**CHARACTER 2**: "Hey, Character 1."\n\n**CHARACTER 1**: "Welcome back, Character 2!" They give a friendly wave.`

const directionInstructions: {[direction in Direction]: (input: InstructionInput) => string } = {
    IntroduceBar: input => `Write a visual novel style introduction to the bar described here: ${input.barDescription}. ` +
        `Depict a second-person scene where ${input.playerName} is setting up for the beginning of their shift one evening; do not introduce established patrons to the scene yet. ${generalInstruction}`,
    
    Lull: input => `Continue the scene some visual novel style flavor as the evening slightly progresses; ${input.playerName} observes the environment or ancillary patrons with only trivial events or conversations--established patrons remain absent or passive.  ${generalInstruction}`,

    IntroducePatron: input => `Continue the scene with visual novel style development as ${input.patronName} enters the bar. If ${input.patronName} is new, describe and introduce them in great detail. ` +
        `If they are a regular, focus on their interactions with ${input.playerName} or other patrons. ${generalInstruction}`,
    
    PatronBanter: input => `Continue the scene with some visual novel style development as the PRESENT PATRONS banter amongst themselves or with ${input.playerName}. ${generalInstruction}`,

    PatronProblem: input => `Continue the scene with some visual novel style development as one of the PRESENT PATRONS describes a personal problem to another PRESENT PATRON or ${input.playerName}. ${generalInstruction}`,

    PatronDrinkRequest: input => `Continue the scene with some visual novel style development as ${input.patronName} asks the bartender, ${input.playerName}, for a drink. ` +
        `${input.patronName} will simply describe the flavor or style of drink they are in the mood for, rather than specifying the actual beverage they want--but their description should align with one of the bar's specialty beverages. ` +
        `Keep ${input.playerName} passive; the drink will be served in a future response. ${generalInstruction}`,
    
    PatronLeaves: input => `Continue the scene with some visual novel style development as ${input.patronName} (and only ${input.patronName}) bids farewell or otherwise departs the bar. ` +
        `Honor their personal style and connections to other patrons or ${input.playerName}. ${generalInstruction}`,
    
    Choice: input => `Rather than continuing the narrative, start this response by generating two or three distinct options for actions or dialog that ${input.playerName} could choose to pursue at this juncture. ` +
        `Each option is a single-sentence description of the action or dialog that ${input.playerName} may choose. ` +
        `Always use this example format: **OPTION 1**: Agree with your friend.\n\n**OPTION 2**: Refuse to help.\n\n**OPTION 3**: Ask what's in it for you.`,
    
    Outcome: input => `Continue the scene by depicting the course of action ${input.playerName} has chosen, following up with the reactions, consequences, and other outcomes. ${generalInstruction}`
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
                if (currentSpeaker && currentDialogue.trim().length > 0) {
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
        if (currentSpeaker && currentDialogue.trim().length > 0) {
            this.subSlices.push(new SubSlice(currentSpeaker, currentDialogue.trim()));
        }
        if (this.direction == Direction.Choice) {
            this.subSlices = this.subSlices.filter(subSlice => subSlice.speakerId == 'OPTION');
        }
    }
}

export class SubSlice {
    body: string;
    speakerId: string|undefined;

    constructor(speakerId: string, body: string) {
        this.body = body;
        this.speakerId = speakerId;
        console.log('Build a SubSlice: ' + speakerId + ':' + body);
    }
}

export class Director {

    constructor() { }

    getPromptInstruction(stage: Stage, slice: Slice): string {
        console.log(stage.patrons);
        console.log(`'${slice.selectedPatronId}'`);
        console.log(`playerName: ${stage.player.name}\npatronName: ${slice.selectedPatronId ? stage.patrons[slice.selectedPatronId] : 'no selectedPatronId'}`);
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
            case Direction.Choice:
                newDirection = Direction.Outcome;
                break;
            case Direction.Outcome:
            case Direction.PatronBanter:
                newDirection = Math.random() > 0.3 ? Direction.PatronProblem : (Math.random() > 0.3 ? Direction.IntroducePatron : (Math.random() > 0.5 ? Direction.Choice : Direction.PatronDrinkRequest));
                break;
            case Direction.PatronProblem:
                newDirection = Math.random() > 0.5 ? Direction.Choice : (Math.random() > 0.5 ? Direction.PatronBanter : Direction.PatronDrinkRequest);
                break;
            case Direction.PatronDrinkRequest:
                newDirection = Math.random() > 0.33 ? Direction.PatronBanter : (Math.random() > 0.5 ? Direction.IntroducePatron : Direction.PatronLeaves);
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
                    console.log('Introduce ' + selectedPatronId);
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
                    console.log('depart ' + selectedPatronId);
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