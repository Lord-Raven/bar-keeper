import React, {ReactElement} from "react";
import {useSound} from "use-sound";
import {
    AspectRatio,
    Character,
    ImageToImageRequest,
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
import {Direction, Director, sampleScript, Slice, SubSlice} from "./Director";
import {MessageWindow} from "./MessageWindow"
import { AccountCircle } from "@mui/icons-material";
import { register } from "register-service-worker";
import { buildSection, generate, generatePatronImage, regenerateBeverages } from "./Generator";

type MessageStateType = any;

type ConfigType = any;

type InitStateType = any;

type ChatStateType = any;

// nvm use 21.7.1
// yarn install (if dependencies changed)
// yarn dev --host --mode staging

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    readonly disableContentGeneration: boolean = false;
    // Message State:
    // Eventually move things like currentMessageId: string|undefined;

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
    messageSlices: {[key: string]: Slice};
    patrons: {[key: string]: Patron};

    currentMessageId: string|undefined;
    currentMessageIndex: number = 0;

    // Not saved:
    patronImagePrompt: string = 'Professional, visual novel, ((anime)), calm expression, neutral pose, flat shading, in-frame, flat contrasting background color, head-to-hips, hips-up portrait, waist-up portrait';
    patronImageNegativePrompt: string = 'realism, border, dynamic lighting, ((close-up)), background image, bad anatomy, amateur, low quality, action';
    characterForGeneration: Character;
    player: User;
    requestedSlice: Promise<Slice|null>|null = null;
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
            messageState,
            chatState
        } = data;

        this.loadingProgress = 30;
        console.log('constructor');
        this.characterForGeneration = characters[Object.keys(characters)[0]];
        console.log(this.characterForGeneration);

        this.player = users[Object.keys(users)[0]];
        this.beverages = [];
        this.patrons = {};
        this.messageSlices = {};
        this.readChatState(chatState);
        this.readMessageState(messageState);
        this.director = new Director();
        this.loadingProgress = 50;

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

    async setState(messageState: MessageStateType): Promise<void> {
        this.readMessageState(messageState);
    }

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        const {
            content,
            identity
        } = userMessage;

        console.log('beforePrompt');

        return {
            stageDirections: null,
            messageState: this.buildMessageState(),
            modifiedMessage: null,
            systemMessage: null,
            error: null,
            chatState: this.buildChatState(),
        };
    }

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {

        const {
            content,
            identity
        } = botMessage;

        console.log('afterPrompt');

        this.currentMessageId = identity;
        return {
            stageDirections: null,
            messageState: this.buildMessageState(),
            modifiedMessage: null,
            error: null,
            systemMessage: null,
            chatState: this.buildChatState()
        };
    }

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
            messageSlices: this.messageSlices,
            currentMessageId: this.currentMessageId,
            currentMessageIndex: this.currentMessageIndex,
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
            this.messageSlices = chatState.messageSlices ?? {};
            this.currentMessageId = chatState.currentMessageId ?? undefined;
            this.currentMessageIndex = chatState.currentMessageIndex ?? 0;
            this.patrons = chatState.patrons ?? {};
        }
    }

    buildMessageState(): MessageStateType {
        return {};
    }

    readMessageState(messageState: MessageStateType) {
        if (messageState) {};
    }

    setLoadProgress(loadingProgress: number|undefined, loadingDescription: string) {
        console.log(loadingProgress != undefined ? loadingDescription : 'Marking load complete.');
        this.loadingProgress = loadingProgress;
        this.loadingDescription = loadingDescription;
    }

    async addNewSlice(slice: Slice) {
        console.log('addNewSlice');
        let impersonation = await this.messenger.impersonate({
            message: slice.script,
            parent_id: this.currentMessageId ?? '-2',
            is_main: true,
            speaker_id: this.characterForGeneration.anonymizedId
        });

        console.log(`IDs: ${this.currentMessageId}:${impersonation.identity}`);
        this.messageSlices[impersonation.identity] = slice;
        this.currentMessageId = impersonation.identity;
        this.currentMessageIndex = 0;
        await this.messenger.updateChatState(this.buildChatState());
    }

    chopMessage(message: string): string[] {
        let subMessages: string[] = message ? message.split(/\r?\n|<br>/).filter(line => line.trim() !== "") : [];
        if (subMessages.length == 0) subMessages.push('');
        return subMessages;
    }

    buildBeverageDescriptions(): string {
        return buildSection('Beverages', `${this.beverages.map(beverage => `NAME: ${beverage.name} DESCRIPTION: ${beverage.description}`).join('\n')}`);
    }

    buildPatronDescriptions(): string {
        const presentPatronIds = this.getMessageSlice(this.currentMessageId).presentPatronIds;
        return buildSection('Absent Patrons', `${Object.values(this.patrons).filter(patron => !presentPatronIds.includes(patron.name)).map(patron => `${patron.name} - ${patron.description}`).join('\n')}`) +
            buildSection('Present Patrons', `${Object.values(this.patrons).filter(patron => presentPatronIds.includes(patron.name)).map(patron => `${patron.name} - ${patron.description}`).join('\n')}`);
    }

    buildStoryPrompt(currentInstruction: string): string {
        return buildSection('Setting', this.barDescription ?? '') +
            buildSection('User', `${this.player.name} is a bartender here. ${this.player.chatProfile}`) +
            this.buildPatronDescriptions() +
            this.buildBeverageDescriptions() +
            buildSection('Sample Response', sampleScript) +
            buildSection('Log', '{{messages}}') +
            buildSection('Instruction Override', `${this.player.name} is a bartender at this bar; refer to ${this.player.name} in second person as you describe unfolding events. ${currentInstruction}`);
    }

    async advanceMessage() {
        console.log('advanceMessage');
        if (!this.requestedSlice) {
            console.log('Kick off generation');
            this.requestedSlice = this.generateSlice('');
        }
        if (this.currentMessageIndex >= this.getMessageSubSlices(this.currentMessageId).length - 1) {
            await this.processNextResponse();
        } else {
            this.currentMessageIndex++;
        }
    }

    async advanceMessageChoice(subSlice: SubSlice) {
        console.log('advanceMessageChoice');
        if (!this.requestedSlice) {
            console.log('Kick off generation');
            this.requestedSlice = this.generateSlice(`${this.player.name} has selected the following action: ${subSlice.body}`);
        }
        await this.processNextResponse();
    }

    async generateSlice(additionalContext: string): Promise<Slice|null> {
        console.log('generateSlice');
        let newSlice: Slice = this.director.generateSlice(this, this.getMessageSlice(this.currentMessageId));

        let retries = 3;
        while (retries-- > 0) {
            try {
                let textGen = await this.generator.textGen({
                    prompt: this.buildStoryPrompt(`${this.director.getPromptInstruction(this, newSlice)}\n${additionalContext}`),
                    max_tokens: 400,
                    min_tokens: 50,
                    include_history: false
                });
                if (textGen?.result?.length) {
                    newSlice.setScript(textGen.result);
                    return Promise.resolve(newSlice);
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
        let tries = 3;
        let result = await this.requestedSlice;
        
        if (result) {
            await this.addNewSlice(result);
            await this.messenger.updateChatState(this.buildChatState());
        } else {
            console.error('Failed to generate new content; try again.');
        }
        this.requestedSlice = null;
        this.isGenerating = false;
    }

    getMessageIndexBody(messageId: string|undefined, messageIndex: number): string {
        return this.getMessageIndexSubSlice(messageId, messageIndex).body ?? '';
    }

    getMessageBody(messageId: string|undefined): string {
        return this.getMessageSlice(messageId).script ?? '';
    }

    getMessageSlice(messageId: string|undefined): Slice {
        return this.messageSlices[messageId ?? ''] ?? new Slice(undefined, [], undefined);
    }

    getMessageSubSlices(messageId: string|undefined): SubSlice[] {
        return this.getMessageSlice(messageId).subSlices;
    }

    getMessageIndexSubSlice(messageId: string|undefined, messageIndex: number): SubSlice {
        return this.getMessageSubSlices(messageId)[messageIndex];
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
                                let presentPatronIds = this.getMessageSlice(this.currentMessageId).presentPatronIds;
                                let patronId = this.getMessageSlice(this.currentMessageId).selectedPatronId ?? presentPatronIds[Math.floor(Math.random() * presentPatronIds.length)] ?? null;
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
                            slice={() => {return this.getMessageSlice(this.currentMessageId)}}
                            subSlice={() => {return this.getMessageIndexSubSlice(this.currentMessageId, this.currentMessageIndex)}}
                            stage={() => {return this}}
                        />
                )}
                {!this.loadingProgress && (
                    <div style={{position: 'relative', height: '16%', left: '1%', width: '98%', alignContent: 'center', verticalAlign: 'middle'}}>
                        <Box component="section" sx={{
                            p: 1,
                            position: 'absolute',
                            height: '98%',
                            width: '100%',
                            left: '0%',
                            bottom: '1%',
                            verticalAlign: 'middle',
                            alignContent: 'center',
                            border: '1px dashed grey',
                            boxSizing: 'border-box',
                            backgroundColor: '#00000088',
                            '&:hover': {backgroundColor: '#000000BB'}
                        }}>
                            <div
                                style={{height: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
                                {this.beverages.map(beverage => beverage.render())}
                            </div>
                        </Box>
                    </div>
                )}
            </ThemeProvider>
        </div>;
    };

}
