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
import {Box, createTheme, LinearProgress, ThemeProvider, Typography, IconButton} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import {Direction, Director, sampleScript} from "./Director";
import {MessageWindow} from "./MessageWindow"
import { AccountCircle } from "@mui/icons-material";
import { register } from "register-service-worker";
import { buildSection, generate, generatePatronImage, regenerateBeverages } from "./Generator";
import {ChatNode, createNodes} from "./ChatNode";
import {BeverageDisplay} from "./BeverageDisplay";

type MessageStateType = any;

type ConfigType = any;

type InitStateType = any;

type ChatStateType = any;

// nvm use 21.7.1
// yarn install (if dependencies changed)
// yarn dev --host --mode staging

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
    lastBeverageServed: string;

    // Not saved:
    currentNode: ChatNode|null;
    patronImagePrompt: string = 'Professional, visual novel, calm expression, neutral pose, in-frame, flat contrasting background color, head-to-hips, hips-up portrait, waist-up portrait';
    patronImageNegativePrompt: string = 'border, ((close-up)), background image, amateur, low quality, action';
    characterForGeneration: Character;
    player: User;
    requestedNodes: Promise<ChatNode[]|null>|null = null;
    isGenerating: boolean = false;
    director: Director;

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
        console.log('constructor');
        this.characterForGeneration = characters[Object.keys(characters)[0]];
        console.log(this.characterForGeneration);

        this.player = users[Object.keys(users)[0]];
        this.beverages = [];
        this.patrons = {};
        this.chatNodes = {};
        this.currentNode = null;
        this.readChatState(chatState);
        this.director = new Director();
        this.loadingProgress = 50;
        this.lastBeverageServed = '';

        console.log('Config loaded:');
        console.log(config);
        this.patronImagePrompt = config.character_prompt ?? this.patronImagePrompt;
        this.patronImageNegativePrompt = config.character_negative_prompt ?? this.patronImageNegativePrompt;

        register('/service-worker.js');
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {

        this.loadingProgress = undefined;
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
            lastBeverageServed: this.lastBeverageServed,
            chatNodes: this.chatNodes,
            currentMessageId: this.currentNode ? this.currentNode.id : null,
            patrons: this.patrons
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
            this.lastBeverageServed = chatState.lastBeverageServed ?? '';
            this.chatNodes = chatState.chatNodes ?? {};
            this.currentNode = chatState.currentMessageId && this.chatNodes[chatState.currentMessageId] ? this.chatNodes[chatState.currentMessageId] : null;
            this.patrons = chatState.patrons ?? {};
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

    buildBeverageDescriptions(): string {
        return buildSection('Beverages', `${this.beverages.map(beverage => `NAME: ${beverage.name} DESCRIPTION: ${beverage.description}`).join('\n')}`);
    }

    buildPatronDescriptions(): string {
        const presentPatronIds = this.currentNode?.presentPatronIds ?? [];
        return buildSection('Absent Patrons', `${Object.values(this.patrons).filter(patron => !presentPatronIds.includes(patron.name)).map(patron => `${patron.name} - ${patron.description}`).join('\n')}`) +
            buildSection('Present Patrons', `${Object.values(this.patrons).filter(patron => presentPatronIds.includes(patron.name)).map(patron => `${patron.name} - ${patron.description}`).join('\n')}`);
    }

    buildHistory(currentNode: ChatNode) {
        let historyString = `**${currentNode.speakerId}**: ${currentNode.message}`;
        let depth = 0;
        while(currentNode.parentId && this.chatNodes[currentNode.parentId] && depth < 40) {
            currentNode = this.chatNodes[currentNode.parentId];
            historyString = `**${currentNode.speakerId}**: ${currentNode.message}\n\n${historyString}`;
            depth++;
        }

        return historyString;
    }

    buildStoryPrompt(currentInstruction: string): string {
        return buildSection('Setting', this.barDescription ?? '') +
            buildSection('User', `${this.player.name} is a bartender here. ${this.player.chatProfile}`) +
            this.buildPatronDescriptions() +
            this.buildBeverageDescriptions() +
            buildSection('Sample Response', sampleScript) +
            (this.currentNode ? buildSection('Log', this.buildHistory(this.currentNode)) : '') +
            buildSection('Instruction Override', `${this.player.name} is a bartender at this bar; refer to ${this.player.name} in second person as you describe unfolding events. ${currentInstruction}`) +
            buildSection('Standard Instruction', '{{suffix}}');
    }

    async advanceMessage() {
        console.log('advanceMessage');
        if (!this.requestedNodes && (!this.currentNode || this.currentNode.direction != Direction.PatronDrinkRequest)) {
            console.log('Kick off generation');
            this.requestedNodes = this.generateMessageContent('');
        }
        console.log(this.currentNode);
        if (!this.currentNode || this.currentNode.childIds.length == 0) {
            console.log('No node or no children; processNextResponse()');
            await this.processNextResponse();
        } else {
            console.log('Child already exists; go there.');
            this.currentNode = this.chatNodes[this.currentNode.childIds[0]];
        }
    }

    async advanceMessageChoice(chatNode: ChatNode) {
        console.log('advanceMessageChoice');
        if (!this.requestedNodes) {
            console.log('Kick off generation');
            this.requestedNodes = this.generateMessageContent(`${this.player.name} has selected the following action: ${chatNode.message}`);
        }
        await this.processNextResponse();
    }

    async generateMessageContent(additionalContext: string): Promise<ChatNode[]|null> {
        console.log('generateNodes');
        let nodeProps: any = this.director.determineNextNodeProps(this, this.currentNode);

        let retries = 3;
        while (retries-- > 0) {
            try {
                let textGen = await this.generator.textGen({
                    prompt: this.buildStoryPrompt(`${this.director.getPromptInstruction(this, nodeProps)}\n${additionalContext}`),
                    max_tokens: 400,
                    min_tokens: 50,
                    include_history: false
                });
                if (textGen?.result?.length) {
                    const newNodes = createNodes(textGen.result, this.currentNode, nodeProps);
                    console.log('Generated nodes');
                    return Promise.resolve(newNodes);
                }
            } catch(error) {
                console.error("Failed to generate message: " + error);
            }
        }
        console.error('Failed to generate next slice.');
        return Promise.resolve(null);
    }

    async processNextResponse() {
        this.isGenerating = true;
        console.log('processNextResponse');
        if (!this.requestedNodes) {
            // Generally, this only happens during a drink selection choice, where generation can't fire earlier than the final message.
            this.requestedNodes = this.generateMessageContent('');
        }
        let result = await this.requestedNodes;
        console.log(result);
        if (result) {
            result.forEach(node => this.chatNodes[node.id] = node);
            let selectedNode = result[0];
            if (this.currentNode) {
                selectedNode.parentId = this.currentNode.id;
                this.currentNode.childIds.push(selectedNode.id);
                this.currentNode.selectedChildId = selectedNode.id;
            }
            this.lastBeverageServed = '';
            this.currentNode = selectedNode;
            await this.updateChatState();
        } else {
            console.log('Failed to generate new content; try again.');
        }
        this.requestedNodes = null;
        this.isGenerating = false;
    }

    async makeImage(imageRequest: Object, defaultUrl: string): Promise<string> {
        return !this.disableContentGeneration ? (await this.generator.makeImage(imageRequest))?.url ?? defaultUrl : defaultUrl;
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
        console.log('setLastBeverageServed:' + beverageName);
        this.lastBeverageServed = beverageName;
    }

    render(): ReactElement {
        return <div style={{
            backgroundImage: `url(${this.barImageUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            color: '#ffffff',
            overflow: 'visible'
        }}>
            <ThemeProvider theme={this.theme}>
                <div style={{height: '8%'}}>
                    <div>
                        <IconButton style={{outline: 1}} disabled={this.loadingProgress !== undefined} color={'primary'}
                                    onClick={() => generate(this)}>
                            <ReplayIcon/>
                        </IconButton>
                        <IconButton style={{outline: 1}} disabled={this.loadingProgress !== undefined} color={'primary'}
                                    onClick={() => regenerateBeverages(this)}>
                            <ReplayIcon/>
                        </IconButton>
                        <IconButton style={{outline: 1}} color={'primary'} onClick={() => {
                                let presentPatronIds = this.currentNode?.presentPatronIds ?? [];
                                let patronId = this.currentNode?.selectedPatronId ?? presentPatronIds[Math.floor(Math.random() * presentPatronIds.length)] ?? null;
                                if (patronId) {
                                    generatePatronImage(this.patrons[patronId], this).then(imageUrl => this.patrons[patronId].imageUrl = imageUrl);
                                }
                            }
                        }>
                            <AccountCircle/>
                        </IconButton>
                        {this.loadingProgress && (
                            <div>
                                <Typography>
                                    {this.loadingProgress}% - {this.loadingDescription}
                                </Typography>
                                <LinearProgress sx={{outline: 'primary'}} variant="determinate" color="success"
                                                value={this.loadingProgress}/>
                            </div>
                        )}
                    </div>
                </div>
                {!this.loadingProgress && (
                        <MessageWindow 
                            advance={() => {void this.advanceMessage()}}
                            chatNode={() => {return this.currentNode}}
                            stage={() => {return this}}
                        />
                )}
                {!this.loadingProgress && (
                    <div style={{position: 'relative', height: '16%', left: '1%', width: '98%', alignContent: 'center', verticalAlign: 'middle'}}>
                        <BeverageDisplay stage={() => {return this}}/>
                    </div>
                )}
            </ThemeProvider>
        </div>;
    };

}
