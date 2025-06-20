import {Direction} from "./Director";
import {Stage} from "./index";
import {Emotion, emotionRouting, nameCheck} from "./Patron";
import {generatePatronImage, MAX_NAME_LENGTH, TRIM_SYMBOLS, trimSymbols} from "./Generator";

export interface ChatNode {
    id: string;
    parentId: string|null;
    childIds: string[];
    selectedChildId: string|null;
    speakerId: string|undefined;
    message: string;
    direction: Direction|undefined;
    presentPatrons: {[key: string]: Emotion};
    selectedPatronId?: string|undefined;
    selectedBeverage: string|null,
    beverageCounts: {[key: string]: number};
    read: boolean;
    night: number;
}

function stripParens(input: string) {
    return input.trim().replace(/^\s*\(.*?\)\s*/, '').trim()
}

export async function createNodes(script: string, commonProps: Partial<ChatNode> = {}, stage: Stage): Promise<ChatNode[]> {

    const baseNode: ChatNode = {
        id: '',
        parentId: null,
        childIds: [],
        selectedChildId: null,
        speakerId: undefined,
        message: '',
        direction: undefined,
        presentPatrons: {},
        selectedPatronId: undefined,
        selectedBeverage: null,
        beverageCounts: {},
        read: false,
        night: 0
    };
    let currentBeverageCounts: {[key: string]: number} = stage.beverages.reduce((acc, beverage) => {
            acc[beverage.name] = (commonProps && commonProps.beverageCounts && Object.keys(commonProps.beverageCounts).includes(beverage.name)) ? (commonProps.beverageCounts[beverage.name] - (commonProps.selectedBeverage == beverage.name ? 1 : 0)) : 1;
            return acc;
        }, {} as { [key: string]: number});
    let currentNode: ChatNode|null = null;
    let currentSpeaker = '';
    let currentDialogue = '';
    let nodes: ChatNode[] = [];
    let presentPatrons = {...commonProps.presentPatrons};

    for (let line of script.trim().split('\n')) {
        const match = line.match(/^\**(.[^*]+)\**:\s*(.+)$/i);
        if (match) {
            // If there's a current dialogue, push it to the parsedLines array
            if (currentSpeaker && stripParens(currentDialogue).length > 0) {
                currentNode = await addNode({...baseNode, id: generateUuid(), childIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: currentNode ? currentNode.id : null, ...commonProps, presentPatrons: {...presentPatrons}, beverageCounts: currentBeverageCounts, selectedBeverage: null}, currentNode, nodes, stage);
                presentPatrons = currentNode.presentPatrons;
            }
            // Start a new dialogue
            currentSpeaker = match[1].toUpperCase();
            // If speaker is longer than name, go ahead and make this a narrator
            if (currentSpeaker.length > MAX_NAME_LENGTH) {
                currentSpeaker = 'NARRATOR';
            }
            currentDialogue = trimSymbols(match[2], TRIM_SYMBOLS).trim();
        } else if (currentSpeaker && stripParens(currentDialogue).length > 0) {
            // Continue the current dialogue
            currentNode = await addNode({...baseNode, id: generateUuid(), childIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: currentNode ? currentNode.id : null, ...commonProps, presentPatrons: {...presentPatrons}, beverageCounts: currentBeverageCounts, selectedBeverage: null}, currentNode, nodes, stage);
            presentPatrons = currentNode.presentPatrons;
            currentDialogue = line.trim();
        }
    }
    if (currentSpeaker && stripParens(currentDialogue).length > 0) {
        await addNode({...baseNode, id: generateUuid(), childIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: (currentNode ? currentNode.id : null), ...commonProps, presentPatrons: {...presentPatrons}, beverageCounts: currentBeverageCounts, selectedBeverage: null}, currentNode, nodes, stage);
    }

    return nodes;
}

async function addNode(newNode: ChatNode, parentNode: ChatNode|null, nodes: ChatNode[], stage: Stage): Promise<ChatNode> {
    if (!parentNode || newNode.message.trim() != '') {
        if (parentNode != null) {
            parentNode.childIds.push(newNode.id);
        }
        if (newNode.speakerId) {
            const targetPatronId = Object.keys(stage.patrons).find(patronId => nameCheck(stage.patrons[patronId].name, newNode.speakerId?.toLowerCase() ?? ''));
            const targetPatron = stage.patrons[targetPatronId ?? ''];
            if (targetPatronId && targetPatron && newNode.presentPatrons[targetPatronId] != null) {
                const result = (await stage.pipeline.predict("/predict", {
                    param_0: newNode.message
                }));
                console.log(`Emotion result:`);
                console.log(result);
                const emotionData = result.data[0].confidences.filter((confidence: {
                    label: string;
                }) => confidence.label != 'neutral');
                console.log(emotionData);
                if (emotionData.length > 0 && emotionData[0].score > 0.2) {
                    newNode.presentPatrons = {...newNode.presentPatrons};
                    const emotion = (emotionRouting[emotionData[0].label] ?? emotionData[0].label) as Emotion;
                    newNode.presentPatrons[targetPatronId] = emotion;
                    console.log(`Setting ${targetPatron.name} to ${emotion} for message:\n"${newNode.message}"`);
                    // Await new image? Maybe just let it run in the background?
                    if (emotion != Emotion.neutral && targetPatron.imageUrls[emotion as Emotion] == targetPatron.imageUrls[Emotion.neutral]) {
                        await generatePatronImage(stage, targetPatron, emotion as Emotion, (message: string) => {});
                    }
                }
            }
        }
        nodes.push(newNode);
        return newNode;
    }
    return parentNode;
}

function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}