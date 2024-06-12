import {Patron} from "./Patron";

enum Direction {
    IntroduceBar = 'IntroduceBar',
    Lull = 'Lull',
    IntroducePatron = 'IntroducePatron',
    PatronBanter = 'PatronBanter',
    PatronProblem = 'PatronProblem',
    PatronDrinkRequest = 'PatronDrinkRequest',
    PatronLeaves = 'PatronLeaves'
}

const directionInstructions: {[direction in Direction]: string} = {
    IntroduceBar: 'Write a two-paragraph visual novel style introduction to the bar described here: ${this.barDescription}. ${this.player.name} is setting up for the beginning of their shift one evening.',
    Lull: 'Write a two-to-three paragraph visual novel style development as the evening slightly progresses.',
    IntroducePatron: 'Write a two-to-three paragraph visual novel style development as the evening slightly progresses.',
    PatronBanter: 'Write a two-to-three paragraph visual novel style development as the evening slightly progresses.',
    PatronProblem: 'Write a two-to-three paragraph visual novel style development as the evening slightly progresses.',
    PatronDrinkRequest: 'Write a two-to-three paragraph visual novel style development as the evening slightly progresses.',
    PatronLeaves: 'Write a two-to-three paragraph visual novel style development as the evening slightly progresses.',
}

export class Director {
    direction: Direction|undefined;

    patrons: Patron[]|undefined;

    getPromptInstruction(): string {
        return directionInstructions[this.direction ?? Direction.IntroduceBar];
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
                newDirection = Direction.IntroducePatron;
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
        return newDirection;
    }
}