import React, {ReactElement} from "react";
import {useSound} from "use-sound";
import {
    Character,
    InitialData,
    Message,
    StageBase,
    StageResponse,
    User
} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";
import {Patron} from "./Patron";
import {Beverage} from "./Beverage";
import {createTheme} from "@mui/material";
import {Direction, Director, sampleScript} from "./Director";
import { register } from "register-service-worker";
import {buildSection, generatePatrons} from "./Generator";
import {ChatNode, createNodes} from "./ChatNode";
import {Client} from "@gradio/client";
import {Screen} from "./Screen";
import titleUrl from './assets/title.png'

type MessageStateType = any;

type ConfigType = any;

type InitStateType = any;

type ChatStateType = any;

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    readonly disableContentGeneration: boolean = false;

    // Chat State:
    barDescription: string|undefined;
    sourceSummary: string|undefined;
    settingSummary: string|undefined;
    themeSummary: string|undefined;
    artSummary: string|undefined;
    barImageUrl: string|undefined;
    entranceSoundUrl: string|undefined;
    beverages: Beverage[];
    loadingProgress: number|undefined;
    loadingDescription: string|undefined;
    patrons: {[key: string]: Patron};
    chatNodes: {[key: string]: ChatNode};
    dummyPatrons: Patron[];
    nightlySummaries: {[key: string]: string};
    titleUrl: string;


    // Not saved:
    currentNode: ChatNode|null;
    characters: {[key: string]: Character};
    characterForGeneration: Character;
    player: User;
    requestedNodes: Promise<ChatNode[]|null>|null = null;
    isGenerating: boolean = false;
    director: Director;
    pipeline: any

    readonly theme = createTheme({
        palette: {
            primary: {
                main: '#ffffeeff'
            },
            secondary: {
                main: '#111111ff'
            }
        }
    });

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {

        super(data);
        const {
            characters,
            users,
            config,
            chatState
        } = data;

        this.loadingProgress = 30;
        this.characters = characters;
        this.characterForGeneration = characters[Object.keys(characters)[0]];

        this.player = users[Object.keys(users)[0]];
        this.beverages = [];
        this.patrons = {};
        this.chatNodes = {};
        this.currentNode = null;
        this.dummyPatrons = [];
        this.nightlySummaries = {};
        this.titleUrl = titleUrl;
        this.readChatState(chatState);

        this.director = new Director();
        this.loadingProgress = 50;
        this.pipeline = null;

        //console.log('Config loaded:');
        //console.log(config);

        register('/service-worker.js');
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {

        this.loadingProgress = undefined;

        try {
            this.pipeline = await Client.connect("lloorree/SamLowe-roberta-base-go_emotions");
        } catch (exception: any) {
            console.error(`Error loading expressions pipeline, error: ${exception}`);
        }

        return {
            success: true,
            error: null,
            initState: null,
            chatState: this.buildChatState(),
        };
    }

    async setState(messageState: MessageStateType): Promise<void> { }

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> { return {}; }

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> { return {}; }

    buildChatState(): ChatStateType {
        return {
            barDescription: this.barDescription,
            sourceSummary: this.sourceSummary,
            settingSummary: this.settingSummary,
            themeSummary: this.themeSummary,
            artSummary: this.artSummary,
            barImageUrl: this.barImageUrl,
            entranceSoundUrl: this.entranceSoundUrl,
            beverages: this.beverages,
            chatNodes: this.chatNodes,
            currentMessageId: this.currentNode ? this.currentNode.id : null,
            patrons: this.patrons,
            dummyPatrons: this.dummyPatrons,
            nightlySummaries: this.nightlySummaries,
            //titleUrl: this.titleUrl,
        };
    }

    readChatState(chatState: ChatStateType) {
        if (chatState) {
            this.barDescription = chatState.barDescription;
            this.sourceSummary = chatState.sourceSummary;
            this.settingSummary = chatState.settingSummary;
            this.themeSummary = chatState.themeSummary;
            this.artSummary = chatState.artSummary;
            this.barImageUrl = chatState.barImageUrl;
            this.entranceSoundUrl = chatState.entranceSoundUrl;
            this.beverages = (chatState.beverages ?? []).map((beverage: { name: string, description: string, imageUrl: string }) => new Beverage(beverage.name, beverage.description, beverage.imageUrl));
            this.chatNodes = chatState.chatNodes ?? {};
            this.currentNode = chatState.currentMessageId && this.chatNodes[chatState.currentMessageId] ? this.chatNodes[chatState.currentMessageId] : null;
            this.patrons = chatState.patrons ?? {};
            this.dummyPatrons = chatState.dummyPatrons ?? [];
            this.nightlySummaries = chatState.nightlySummaries ?? [];
            //this.titleUrl = chatState.titleUrl ?? titleUrl;
        }
    }

    setLoadProgress(loadingProgress: number|undefined, loadingDescription: string) {
        console.log(loadingProgress != undefined ? loadingDescription : 'Marking load complete.');
        this.loadingProgress = loadingProgress;
        this.loadingDescription = loadingDescription;
    }

    async updateChatState() {

        await this.messenger.updateChatState(this.buildChatState());
    }

    replaceTags(source: string, replacements: any) {
        return source.replace(/{{([A-z]*)}}/g, (match) => {
            const tagName = match.substring(2, match.length - 2).toLowerCase()
            return (tagName in replacements ? replacements[tagName] : match);
        });
    }

    buildBeverageDescriptions(): string {
        return this.beverages.map.length > 0 ? `${this.beverages.map(beverage => `NAME: ${beverage.name}\nDESCRIPTION: ${beverage.description}`).join('\n\n')}` : '';
    }

    buildPatronDescriptions(): string {
        const presentPatronIds = Object.keys(this.currentNode?.presentPatrons ?? {});
        return buildSection('Absent Patrons', `${Object.keys(this.patrons).filter(patronId => !presentPatronIds.includes(patronId)).map(patronId => `${this.patrons[patronId].name} - ${this.patrons[patronId].description} - ${this.patrons[patronId].personality}`).join('\n\n')}`) +
            buildSection('Present Patrons', `${Object.keys(this.patrons).filter(patronId => presentPatronIds.includes(patronId)).map(patronId => `${this.patrons[patronId].name} - ${this.patrons[patronId].description} - ${this.patrons[patronId].personality}`).join('\n\n')}`);
    }

    getNightlyNodes(currentNode: ChatNode): ChatNode[] {
        const DEPTH_CAP = 40;
        let depth = 0;
        let history: ChatNode[] = [currentNode];
        while(currentNode.parentId && this.chatNodes[currentNode.parentId] && depth < DEPTH_CAP && currentNode.night == this.chatNodes[currentNode.parentId].night) {
            currentNode = this.chatNodes[currentNode.parentId];
            history.push(currentNode);
            depth++;
        }

        return history;
    }

    buildHistory(currentNode: ChatNode) {
        let historyString = '';
        const history = this.getNightlyNodes(currentNode);
        for(let node of history) {
            historyString = `**${node.speakerId}**: ${node.message}\n\n${historyString}`;
        }

        return historyString;
    }

    buildStoryPrompt(fromNode: ChatNode|null, currentInstruction: string): string {
        const nightSummaries = '' +
            Object.keys(this.nightlySummaries)
                .filter(night => (fromNode?.night ?? 1) - parseInt(night) < 3)
                .map(night => buildSection(`Night ${night} (${(fromNode?.night ?? 1) - parseInt(night)} nights ago)`, this.nightlySummaries[night])).join('\n');
        if (nightSummaries) console.log(`Nightly Summary: ${nightSummaries}`);
        return buildSection('Setting', this.barDescription ?? '') +
            buildSection(`Protagonist`, `${this.player.name} is a bartender here. ${this.player.chatProfile}`) +
            this.buildPatronDescriptions() +
            buildSection('Beverages', this.buildBeverageDescriptions()) +
            nightSummaries +
            buildSection('Sample Response', sampleScript) +
            (fromNode ? buildSection('Log', this.buildHistory(fromNode)) : '') +
            buildSection('Critical Instruction', `${this.player.name} is a bartender at this bar; refer to ${this.player.name} in second person as you describe unfolding events. ${currentInstruction}`) +
            '###STANDARD INSTRUCTION:';
    }

    async reverseMessage() {
        if (this.currentNode && this.currentNode.parentId && this.chatNodes[this.currentNode.parentId]) {
            this.setCurrentNode(this.chatNodes[this.currentNode.parentId], true);
        }
    }

    async advanceMessage() {

        // Go ahead and do a patron check--don't wait up.
        generatePatrons(this, (message) => {});

        this.kickOffRequestedNodes(this.currentNode);

        console.log(this.currentNode);
        if (!this.currentNode || this.currentNode.childIds.length == 0) {
            await this.processNextResponse();
        } else {
            this.setCurrentNode(this.chatNodes[this.currentNode.childIds[0]], false);
            this.kickOffRequestedNodes(this.currentNode);
        }
    }

    kickOffRequestedNodes(fromNode: ChatNode|null) {
        const currentTerminus = this.getTerminusOfNode(fromNode);

        // If this is a drink request, we can't kick this off until the last interaction
        if (!this.requestedNodes && (!currentTerminus || (currentTerminus.childIds.length == 0 && currentTerminus.direction != Direction.PatronDrinkRequest))) {
            this.requestedNodes = this.generateMessageContent(currentTerminus, '');
        }
    }

    setCurrentNode(newNode: ChatNode, reverse: boolean) {
        if (this.currentNode && this.currentNode != newNode && this.currentNode.childIds.length > 0 && !reverse) {
            this.currentNode.read = true;
        }
        this.currentNode = newNode;
        this.setLastBeverageServed(this.currentNode.selectedBeverage ?? '');
        if (this.currentNode) {
            console.log(this.currentNode);
        }
    }

    getTerminusOfNode(fromNode: ChatNode|null) {
        while (fromNode && (fromNode.selectedChildId || fromNode.childIds.length > 0) && this.chatNodes[fromNode.selectedChildId ?? fromNode.childIds[0]].direction == fromNode.direction) {
            fromNode = this.chatNodes[fromNode.selectedChildId ?? fromNode.childIds[0]];
        }
        return fromNode;
    }

    async generateMessageContent(fromNode: ChatNode|null, additionalContext: string): Promise<ChatNode[]|null> {
        let nodeProps: any = this.director.determineNextNodeProps(this, this.currentNode);

        if (nodeProps.direction == Direction.NightEnd) {
            // Generate a nightly summary.
            console.log('Generate a nightly summary');
            let retries = 3;
            while (retries-- > 0) {
                try {
                    let textGen = await this.generator.textGen({
                        prompt:
                            buildSection('Setting', this.barDescription ?? '') +
                            buildSection(`Protagonist`, `${this.player.name} is a bartender here. ${this.player.chatProfile}`) +
                            this.buildPatronDescriptions() +
                            buildSection('Beverages', this.buildBeverageDescriptions()) +
                            (fromNode ? buildSection('Log', this.buildHistory(fromNode)) : '') +
                            buildSection('Current Instruction', 'Utilize this response to summarize the events in the LOG. You should produce an abridged account of the key events and interactions that occurred in the bar this evening, based on an analysis of the LOG.') +
                            '###FUTURE INSTRUCTION:',
                        max_tokens: 250,
                        min_tokens: 50,
                        include_history: false
                    });
                    if (textGen?.result?.length) {
                        this.nightlySummaries[nodeProps.night] = textGen.result;
                        retries = 0;
                    }
                } catch(error) {
                    console.error("Failed to generate a nightly summary: " + error);
                }
            }
        }

        let retries = 3;
        while (retries-- > 0) {
            try {
                let textGen = await this.generator.textGen({
                    prompt: this.buildStoryPrompt(this.getTerminusOfNode(this.currentNode), `${this.director.getPromptInstruction(this, nodeProps)}\n${additionalContext}`),
                    max_tokens: 600,
                    min_tokens: 100,
                    include_history: false
                });
                if (textGen?.result?.length) {
                    const newNodes = createNodes(textGen.result, nodeProps, this);
                    return Promise.resolve(newNodes);
                }
            } catch(error) {
                console.error("Failed to generate message: " + error);
            }
        }
        return Promise.resolve(null);
    }

    async processNextResponse() {
        this.isGenerating = true;
        if (!this.requestedNodes) {
            console.log('No current request in progress--try again');
            this.requestedNodes = this.generateMessageContent(this.getTerminusOfNode(this.currentNode), '');
        }
        let result = await this.requestedNodes;
        console.log(result);
        if (result && result.length > 0) {
            result.forEach(node => this.chatNodes[node.id] = node);
            let selectedNode = result[0];
            if (this.currentNode) {
                selectedNode.parentId = this.currentNode.id;
                this.currentNode.childIds.push(selectedNode.id);
                this.currentNode.selectedChildId = selectedNode.id;
            }
            this.setCurrentNode(selectedNode, false);
        } else {
            console.log('Failed to generate new content; try again.');
        }
        this.requestedNodes = null;
        this.isGenerating = false;

        await this.updateChatState();
    }

    async makeImage(imageRequest: Object, defaultUrl: string): Promise<string> {
        return !this.disableContentGeneration ? (await this.generator.makeImage(imageRequest))?.url ?? defaultUrl : defaultUrl;
    }

    async inpaintImage(inpaintRequest: Object, defaultUrl: string): Promise<string> {
        if (this.disableContentGeneration) {
            return defaultUrl;
        }
        const response = await this.generator.inpaintImage(inpaintRequest);
        console.log('Inpaint response:');
        console.log(response);
        return response?.url ?? defaultUrl;
    }

    async makeImageFromImage(imageToImageRequest: Object, defaultUrl: string): Promise<string> {
        return !this.disableContentGeneration ? (await this.generator.imageToImage(imageToImageRequest))?.url ?? defaultUrl : defaultUrl;
    }

    async makeSound(foleyRequest: Object, defaultUrl: string): Promise<string> {
        return !this.disableContentGeneration ? (await this.generator.makeSound(foleyRequest))?.url ?? defaultUrl : defaultUrl;
    }

    isBeverageDecision() {
        return this.currentNode &&
            this.currentNode.direction == Direction.PatronDrinkRequest &&
            this.currentNode.childIds.filter(id => this.chatNodes[id] && this.chatNodes[id].direction == Direction.PatronDrinkRequest).length == 0;
    }

    setLastBeverageServed(beverageName: string) {
        if (this.currentNode) {
            this.currentNode.selectedBeverage = beverageName;
        }
    }

    render(): ReactElement {

        return <Screen stage={() => {return this}}/>;
    };

}
