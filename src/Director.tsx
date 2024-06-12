import {Patron} from "./Patron";

enum Direction {
    IntroduceBar,
    Lull,
    IntroducePatron,
    PatronBanter,
    PatronProblem,
    PatronDrinkRequest,
    PatronLeaves
}


export class Director {
    lastDirection: Direction|undefined;

    patrons: Patron[]|undefined;

    chooseDirection(): Direction {
        let newDirection: Direction;
        switch (this.lastDirection) {
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

        return newDirection;
    }
}