import {Direction} from "./Director";
import {Stage} from "./index";
import {Emotion} from "./Patron";

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
        selectedPatronId: undefined
    };
    let currentNode: ChatNode|null = null;
    let currentSpeaker = '';
    let currentDialogue = '';
    let nodes: ChatNode[] = [];

    for (let line of script.trim().split('\n')) {
        //console.log('Line:' + line);
        const match = line.match(/^\**(.[^*]+)\**:\s*(.+)$/i);
        if (match) {
            // If there's a current dialogue, push it to the parsedLines array
            if (currentSpeaker && currentDialogue.trim().length > 0) {
                currentNode = await addNode({...baseNode, id: generateUuid(), childIds: [], presentPatronIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: currentNode ? currentNode.id : null, ...commonProps}, currentNode, nodes, stage);
            }
            // Start a new dialogue
            currentSpeaker = match[1];
            currentDialogue = match[2];
        } else if (currentSpeaker && currentDialogue.trim().length > 0) {
            // Continue the current dialogue
            currentNode = await addNode({...baseNode, id: generateUuid(), childIds: [], presentPatronIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: currentNode ? currentNode.id : null, ...commonProps}, currentNode, nodes, stage);

            currentDialogue = line.trim();
        }
    }
    if (currentSpeaker && currentDialogue.trim().length > 0) {
        currentNode = await addNode({...baseNode, id: generateUuid(), childIds: [], presentPatronIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: (currentNode ? currentNode.id : null), ...commonProps}, currentNode, nodes, stage);
    }

    return nodes;
}

async function addNode(newNode: ChatNode, parentNode: ChatNode|null, nodes: ChatNode[], stage: Stage): Promise<ChatNode> {
    if (parentNode != null) {
        parentNode.childIds.push(newNode.id);
    }
    if (newNode.speakerId && !['narrator', stage.player.name.toLowerCase()].includes(newNode.speakerId.toLowerCase())) {

        const result = (await stage.pipeline.predict("/predict", {
            param_0: newNode.message,
        }));
        const emotionData = result.data[0].confidences.filter((candidate: { label: Emotion; }) => Object.values(Emotion).includes(candidate.label));
        console.log('emotion stuff:');
        console.log(newNode.message);
        console.log(emotionData);
        if (emotionData.length > 0 && emotionData[0].confidence > 0.5) {
            newNode.emotion = emotionData[0];
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