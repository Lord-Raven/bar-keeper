import {Patron} from "./Patron";
import {Stage} from "./Stage";

enum Direction {
    IntroduceBar = 'IntroduceBar',
    Lull = 'Lull',
    IntroducePatron = 'IntroducePatron',
    PatronBanter = 'PatronBanter',
    PatronProblem = 'PatronProblem',
    PatronDrinkRequest = 'PatronDrinkRequest',
    PatronLeaves = 'PatronLeaves'
}

const directionInstructions: {[direction in Direction]: (barDescription: string, playerName: string, patronName: string) => string } = {
    IntroduceBar: (barDescription, playerName) => `Write a visual novel style introduction to the bar described here: ${barDescription}. ` +
        `Depict a second-person scene where ${playerName} is setting up for the beginning of their shift one evening.`,
    Lull: (playerName) => `Write a two-to-three paragraph visual novel style development as the evening slightly progresses; ${playerName} observes the environment or patrons with only trivial events or conversations.`,
    IntroducePatron: (playerName, patronName) => `Write a two-to-three paragraph visual novel style development as ${patronName} enters the bar. If ${patronName} is new, describe and introduce them in great detail. If they are a regular, focus on their interactions with ${playerName} or other patrons.`,
    PatronBanter: (playerName) => `Write a two-to-three paragraph visual novel style development as the patrons banter amongst themselves or with ${playerName}.`,
    PatronProblem: (playerName) => `Write a two-to-three paragraph visual novel style development as one of the patrons describes a personal problem to another patron or ${playerName}.`,
    PatronDrinkRequest: () => `Write a two-to-three paragraph visual novel style development as a patron requests a drink--one of the bar's specialty beverages.`,
    PatronLeaves: (playerName, patronName) => `Write a two-to-three paragraph visual novel style development as ${patronName} bids farewell or otherwise departs the bar. Carefully consider their personal style and connections to other patrons or ${playerName}.`,
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
        return directionInstructions[this.direction ?? Direction.IntroduceBar](barDescription, playerName, this.currentPatronId ? this.patrons[this.currentPatronId].name : '');
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
                    this.direction = Direction.Lull;
                }
                break;
            case Direction.PatronLeaves:
                // Select a patron to leave
                if (this.presentPatronIds.length > 0) {
                    this.currentPatronId = this.presentPatronIds[Math.floor(Math.random() * this.presentPatronIds.length)];
                    this.presentPatronIds.splice(this.presentPatronIds.indexOf(this.currentPatronId), 1);
                } else {
                    this.direction = Direction.Lull;
                }
                break;
            case Direction.PatronBanter:
            case Direction.PatronProblem:
            case Direction.PatronDrinkRequest:
                if (this.presentPatronIds.length > 0) {
                    this.currentPatronId = this.presentPatronIds[Math.floor(Math.random() * this.presentPatronIds.length)];
                } else {
                    this.direction = Direction.Lull;
                }
                break;
            default:
                break;
        }

        return newDirection;
    }
}