import { Stage } from "./Stage";
import {ChatNode} from "./ChatNode";
import {Emotion} from "./Patron";

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

export const generalInstruction = '`{{user}} is a bartender for LOCATION; refer to them in second person as you describe unfolding events. ' +
    'Your narration follows a strict format, where general storytelling is flavorfully and incrementally presented by a NARRATOR, and characters present their own dialog and actions. ' +
    'Only PRESENT PATRONS, {{user}}, and minor, incidental characters are active in this response. ABSENT PATRONS are dormant and supplied only for context; ignore ABSENT PATRONS and keep them out of the scene. ' +
    'Undefined, minor characters should be given names, but their roles should be fleeting and quickly resolved from the story. Regardless of what\'s going on in the log, focus on achieving the CURRENT NARRATIVE BEAT.';

const sampleScript = '' +
        `**NARRATOR**: General narration is provided by the NARRATOR.\n\n` +
        `**NARRATOR**: Each message should be about one line.\n\n` +
        `**JOHN SMITH**: (Some Character's mood) "When I talk, my dialog is embedded in quotations." John Doe looks up.\n\n` +
        `**NARRATOR**: Another Patron walks in.\n\n` +
        `**JANE DOE**: (Blandly) "Hey, Some Patron."\n\n` +
        `**JOHN SMITH**: (Cheerful) "Welcome back, Jane!" They give a friendly wave."\n\n` +
        `**JOHN SMITH**: (Curious) John Smith thinks to themself, "You look different..."\n\n` +
        `**JANE DOE**: (Perking up) Jane smiles broadly, "I'm trying a new hairstyle. Thanks for noticing!"\n\n` +
        `**NARRATOR**: Another Patron takes a seat down the bar from Some Patron and looks for you.\n\n` +
        `**{{user}}**: You approach Jane Doe, "What'll it be, Jane?"\n\n` +
        `**JANE DOE**: (Thoughtful) "I think I'd like something refreshing and bright tonight."\n\n` +
        `**{{user}}**: You nod appreciatively, "I'll see what I can do." You look over your assortment of bottles, weighing the choices.`;

const directionSample: {[direction in Direction]: string} = {
    NightStart: `**NARRATOR**: You hit the switch for the neon sign and slip into your apron for the night.\n\n` +
                `**{{user}}**: (Resigned) You sigh deeply, "Hope things stay quiet this evening."\n\n` +
                `**JOHN SMITH**: A quiet regular enters and slips into their usual booth, splaying out some papers and studying them intently.\n\n` +
                `**{{user}}**: "Let me know if you need anything, sir."\n\n` +
                `**JOHN SMITH**: (Absently) "Of course." His eyes never leave his work.\n\n` +
                `NARRATOR**: Seems like this could be a night like any other.`,
    Lull:   `**NARRATOR**: The sparse crowd simmers for a time; you field the occasional order but are otherwise disengaged.\n\n` +
            `**JANE DOE**: A mousy girl takes a seat at the bar, eyes scanning the room, searching.\n\n` +
            `**{{user}}**: (Politely) "Can I help you miss?"\n\n` +
            `**JANE DOE**: (Surprised) "O-oh, sorry. No, I'm just waiting for someone.\n\n` +
            `**{{user}}**: "Ah, cool." You note her anxious appearance but decide to leave her be, for now.`,
    IntroducePatron: sampleScript,
    PatronBanter: sampleScript,
    PatronProblem: sampleScript,
    PatronDrinkRequest: sampleScript,
    PatronDrinkOutcome: sampleScript,
    PatronLeaves: sampleScript,
    NightEnd: sampleScript
}



const directionInstructions: {[direction in Direction]: (input: InstructionInput) => string } = {
    NightStart: input => `Depict a scene where ${input.playerName} is preparing to begin their evening shift as a bartender for the LOCATION. ${input.playerName} remains alone at the bar at this time.`,
    
    Lull: input => `Continue the scene with some inconsequential flavor as the evening slightly progresses; ${input.playerName} observes the environment or incidental characters with only trivial events or conversations--defined ABSENT PATRONS remain dormant.`,

    IntroducePatron: input => `Continue the scene as ${input.patronName} enters the bar. If ${input.patronName} is new, describe and introduce them in great detail. ` +
        `If they are a regular, focus on their interactions with ${input.playerName} or other PRESENT PATRONS. No one is thirsty yet; patrons will focus on greetings, small talk, or other trivial matters.`,
    
    PatronBanter: input => `Continue the scene as the PRESENT PATRONS banter amongst themselves or with ${input.playerName}. None of them are prepared to order a drink, so they will focus on discussing their lives or other ongoing events.`,

    PatronProblem: input => `Continue the scene as one of the PRESENT PATRONS describes a personal problem to another PRESENT PATRON or ${input.playerName}. No one wants to order a drink at this time.`,

    PatronDrinkRequest: input => `Continue the scene as ${input.patronName} asks the bartender, ${input.playerName}, for an unspecified drink. ` +
        `${input.patronName} will describe the flavor or style of drink they are in the mood for, rather than declaring the particular beverage they want. ` +
        `${input.playerName} passively listens to the request with minimal input; they will prepare and serve the drink in a future response.`,

    PatronDrinkOutcome: input => `Continue the scene as ${input.patronName} accepts the drink ${input.playerName} has chosen: ${input.beverageName}. ` +
        `Dramatically steer the scene in a new direction--negative or positive--based on the nature of this beverage and how well it suits the patron's current taste or mood. ` +
        `${input.patronName} could be critical, delighted, surprised, disappointed, disgusted, inspired, or even outraged by this drink.`,

    PatronLeaves: input => `Continue the scene as ${input.patronName} (and only ${input.patronName}) bids farewell or otherwise departs the bar--other PRESENT PATRONS stick around (at least for now). ` +
        `Honor ${input.patronName}'s personal style and relationships with other PRESENT PATRONS or ${input.playerName}.`,

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

export function getDirectionSample(node: Partial<ChatNode>): string {
    return directionSample[node.direction ?? Direction.NightStart];
}

export function getDirectionInstruction(stage: Stage, node: Partial<ChatNode>): string {
    return directionInstructions[node.direction ?? Direction.NightStart]({
        barDescription: stage.barDescription ?? '',
        playerName: stage.player.name ?? '',
        patronName: node.selectedPatronId ? stage.patrons[node.selectedPatronId].name : '',
        beverageName: node.selectedBeverage ?? ''});
}

function directionCheck(stage: Stage, node: ChatNode, targetDirection: Direction) {
    return node.direction == targetDirection && (!node.parentId || stage.chatNodes[node.parentId].direction != node.direction || stage.chatNodes[node.parentId].selectedPatronId != node.selectedPatronId);
}

export function determineNextNodeProps(stage: Stage, startNode: ChatNode|null): Partial<ChatNode> {
    let directionOdds: Possibility[] = [];

    const history = startNode ? stage.getNightlyNodes(startNode) : [];
    const drinksServed = history.filter(node => directionCheck(stage, node, Direction.PatronDrinkOutcome)).length;
    const visits = history.filter(node => directionCheck(stage, node, Direction.IntroducePatron)).length;

    let selectedPatronId = undefined;
    let newPresentPatrons = {...(startNode ? startNode.presentPatrons : {})};
    let selectedBeverage = undefined;

    // If coming from a departure, drop that character from the new present list.
    if (startNode && startNode.direction == Direction.PatronLeaves && Object.keys(newPresentPatrons).includes(startNode.selectedPatronId ?? '')) {
        delete newPresentPatrons[startNode.selectedPatronId ?? ''];
    }
    const presentPatronIds = Object.keys(newPresentPatrons);

    switch (startNode ? startNode.direction : undefined) {
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
            directionOdds.push(new Possibility(Direction.Lull, '', presentPatronIds.length ?? 0 >= 1 ? 0 : 5));
            directionOdds.push(new Possibility(Direction.PatronBanter, '', presentPatronIds.length ?? 0 >= 1 ? 20 : 0));
            directionOdds.push(new Possibility(Direction.PatronProblem, '', presentPatronIds.length ?? 0 >= 1 ? 10 : 0));

            for (let patronId of presentPatronIds) {
                if (startNode && Object.values(startNode.beverageCounts).reduce((total, count) => total + count, 0) > 0) {
                    directionOdds.push(new Possibility(Direction.PatronDrinkRequest, patronId, Math.max(0, (6 - drinksServed) * 5)));
                }
                directionOdds.push(new Possibility(Direction.PatronLeaves, patronId,
                    Math.max(0, ((drinksServed - 2) * 3)) + // Increase odds when drinks served is >= 3
                    (presentPatronIds.length ?? 0) * 2 + // Increase odds by one per patron present
                    Math.max(0, history.length - 60) + // Increase odds by one per message after threshold messages.
                    history.filter(node => !!node.presentPatrons[patronId]).length // Increase odds by one per node that this character has been present
                ));
            }

            // If max possible visits not hit, consider adding a patron (no more than five at a time)
            if (visits < Object.keys(stage.patrons).length && (presentPatronIds.length ?? 0) < 5) {
                const keys = Object.keys(stage.patrons).filter(key => !presentPatronIds.includes(key) && !history.find(node => node.direction == Direction.IntroducePatron && node.selectedPatronId == key));
                let selectedPatronId = keys[Math.floor(Math.random() * keys.length)];
                directionOdds.push(new Possibility(Direction.IntroducePatron, selectedPatronId, 30 - (presentPatronIds?.length ?? 0) * 5));
            }

            // If we've had a couple visits and the bar is empty, start jacking up the night end odds.
            if (visits >= 3 && presentPatronIds.length  == 0) {
                directionOdds.push(new Possibility(Direction.NightEnd, '', 20 + visits * 10));
            }
            // Remove the direction that we are coming from; can't occur twice in a row.
            directionOdds = directionOdds.filter(probability => probability.direction != (startNode?.direction ?? Direction.NightStart));
            break;
        case Direction.PatronDrinkRequest:
            directionOdds.push(new Possibility(Direction.PatronDrinkOutcome, '', 1000));
            break;
        default:
            directionOdds.push(new Possibility(Direction.Lull, '', 1000));
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
        selectedPatronId = startNode?.selectedPatronId;
        selectedBeverage = startNode?.selectedBeverage;
    }

    if (newDirection == Direction.IntroducePatron) {
        if (selectedPatronId) {
            newPresentPatrons[selectedPatronId] = Emotion.neutral;
        } else {
            newDirection = Direction.PatronBanter;
        }
    }

    let night = (startNode?.night ?? 0);
    let beverageCounts = startNode ? {...startNode.beverageCounts} : {};
    if (newDirection == Direction.NightStart) {
        night += 1;
        for (let beverage in beverageCounts) {
            beverageCounts[beverage] = Math.min(3, beverageCounts[beverage] + 1);
        }
    }

    return {
        direction: newDirection,
        presentPatrons: newPresentPatrons,
        selectedPatronId: selectedPatronId,
        selectedBeverage: selectedBeverage,
        beverageCounts: beverageCounts,
        night: night
    };
}