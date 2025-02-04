import {Direction} from "./Director";
import {Stage} from "./index";
import {Emotion, emotionRouting} from "./Patron";
import {generatePatronImage} from "./Generator";

export interface ChatNode {
    id: string;
    parentId: string|null;
    childIds: string[];
    selectedChildId: string|null;
    speakerId: string|undefined;
    emotion: string|undefined;
    message: string;
    direction: Direction|undefined;
    presentPatronIds: string[];
    selectedPatronId?: string|undefined;
    selectedBeverage: string|null,
    beverageCounts: {[key: string]: number};
    read: boolean;
    night: number;
}

export async function createNodes(script: string, commonProps: Partial<ChatNode> = {}, stage: Stage): Promise<ChatNode[]> {

    const baseNode: ChatNode = {
        id: '',
        parentId: null,
        childIds: [],
        selectedChildId: null,
        speakerId: undefined,
        emotion: Emotion.neutral,
        message: '',
        direction: undefined,
        presentPatronIds: [],
        selectedPatronId: undefined,
        selectedBeverage: null,
        beverageCounts: {},
        read: false,
        night: 0
    };
    console.log('createNodes');
    console.log(commonProps);
    if (commonProps.selectedBeverage && commonProps.beverageCounts) {
        console.log(`SelectedBeverage: ${commonProps.selectedBeverage}`);
        for (let key in Object.keys(stage.beverages)) {
            console.log(`${key} - ${commonProps.beverageCounts[key]}`);
        }
    }
    let currentBeverageCounts: {[key: string]: number} = stage.beverages.reduce((acc, beverage) => {
            acc[beverage.name] = (commonProps && commonProps.beverageCounts && Object.keys(commonProps.beverageCounts).includes(beverage.name)) ? (commonProps.beverageCounts[beverage.name] - (commonProps.selectedBeverage == beverage.name ? 1 : 0)) : 1;
            return acc;
        }, {} as { [key: string]: number});
    let currentNode: ChatNode|null = null;
    let currentSpeaker = '';
    let currentDialogue = '';
    let nodes: ChatNode[] = [];

    for (let line of script.trim().split('\n')) {
        const match = line.match(/^\**(.[^*]+)\**:\s*(.+)$/i);
        if (match) {
            // If there's a current dialogue, push it to the parsedLines array
            if (currentSpeaker && currentDialogue.trim().length > 0) {
                currentNode = await addNode({...baseNode, id: generateUuid(), childIds: [], presentPatronIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: currentNode ? currentNode.id : null, ...commonProps, beverageCounts: currentBeverageCounts, selectedBeverage: null}, currentNode, nodes, stage);
            }
            // Start a new dialogue
            currentSpeaker = match[1];
            currentDialogue = match[2];
        } else if (currentSpeaker && currentDialogue.trim().length > 0) {
            // Continue the current dialogue
            currentNode = await addNode({...baseNode, id: generateUuid(), childIds: [], presentPatronIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: currentNode ? currentNode.id : null, ...commonProps, beverageCounts: currentBeverageCounts, selectedBeverage: null}, currentNode, nodes, stage);

            currentDialogue = line.trim();
        }
    }
    if (currentSpeaker && currentDialogue.trim().length > 0) {
        await addNode({...baseNode, id: generateUuid(), childIds: [], presentPatronIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: (currentNode ? currentNode.id : null), ...commonProps, beverageCounts: currentBeverageCounts, selectedBeverage: null}, currentNode, nodes, stage);
    }

    return nodes;
}

async function addNode(newNode: ChatNode, parentNode: ChatNode|null, nodes: ChatNode[], stage: Stage): Promise<ChatNode> {
    if (parentNode != null) {
        parentNode.childIds.push(newNode.id);
    }
    if (newNode.speakerId) {
        const targetPatron = Object.values(stage.patrons).find(patron => patron.name.toLowerCase().includes(newNode.speakerId?.toLowerCase() ?? 'nevereverever'));
        if (targetPatron) {
            const result = (await stage.pipeline.predict("/predict", {
                param_0: newNode.message
            }));
            const emotionData = result.data[0].confidences.filter((confidence: { label: string; }) => confidence.label != 'neutral');
            console.log(`Emotion determination for: ${newNode.message}`);
            console.log(emotionData);
            if (emotionData.length > 0 && emotionData[0].confidence > 0.1) {
                newNode.emotion = emotionRouting[emotionData[0].label as Emotion];
                // Await new image? Maybe just let it run in the background?
                if (newNode.emotion != Emotion.neutral && targetPatron.imageUrls[newNode.emotion as Emotion] == targetPatron.imageUrls[Emotion.neutral]) {
                    await generatePatronImage(stage, targetPatron, newNode.emotion as Emotion);
                }
            } else {
                newNode.emotion = Emotion.neutral;
            }
        }
    }
    nodes.push(newNode);
    return newNode;
}

function generateUuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Example usage
/*
const nodes: { [id: string]: ChatNode } = {};
const rootNode: ChatNode = { id: generateUniqueId(), message: "Root message", parentId: null, children: [], };
nodes[rootNode.id] = rootNode;
const childNode = addNode(rootNode, "Child message");
nodes[childNode.id] = childNode;
console.log(nodes[childNode.parentId!].message);
*/