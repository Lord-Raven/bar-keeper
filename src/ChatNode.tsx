import {Direction} from "./Director";

export interface ChatNode {
    id: string;
    parentId: string|null;
    childIds: string[];
    selectedChildId: string|null;
    speakerId: string|undefined;
    message: string;
    direction: Direction|undefined;
    presentPatronIds: string[];
    selectedPatronId?: string|undefined;
}

export function createNodes(script: string, parent: ChatNode | null, commonProps: Partial<ChatNode> = {}): ChatNode[] {

    const baseNode: ChatNode = {
        id: '',
        parentId: null,
        childIds: [],
        selectedChildId: null,
        speakerId: undefined,
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
                currentNode = addNode({...baseNode, id: generateUuid(), childIds: [], presentPatronIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: currentNode ? currentNode.id : null, ...commonProps}, currentNode, nodes);
            }
            // Start a new dialogue
            currentSpeaker = match[1];
            currentDialogue = match[2];
        } else if (currentSpeaker && currentDialogue.trim().length > 0) {
            // Continue the current dialogue
            currentNode = addNode({...baseNode, id: generateUuid(), childIds: [], presentPatronIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: currentNode ? currentNode.id : null, ...commonProps}, currentNode, nodes);

            currentDialogue = line.trim();
        }
    }
    if (currentSpeaker && currentDialogue.trim().length > 0) {
        currentNode = addNode({...baseNode, id: generateUuid(), childIds: [], presentPatronIds: [], message: currentDialogue.trim(), speakerId: currentSpeaker, parentId: (currentNode ? currentNode.id : null), ...commonProps}, currentNode, nodes);
    }

    return nodes;
}

function addNode(newNode: ChatNode, parentNode: ChatNode|null, nodes: ChatNode[]): ChatNode {
    if (parentNode != null) {
        parentNode.childIds.push(newNode.id);
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