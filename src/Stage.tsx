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
import bottleUrl from './assets/bottle.png'
import patronUrl from './assets/elf2.png'
import { AccountCircle } from "@mui/icons-material";
import { register } from "register-service-worker";

type MessageStateType = any;

type ConfigType = any;

type InitStateType = any;

type ChatStateType = any;

// nvm use 21.7.1
// yarn install (if dependencies changed)
// yarn dev --host --mode staging

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    buildBarDescriptionPrompt(description: string): string {
        return `[RESPONSE INSTRUCTION]Digest and appreciate the vibe, style, and setting of the following flavor text:[/RESPONSE INSTRUCTION]\n${description}\n \
            [RESPONSE INSTRUCTION]Instead of narrating, write a few sentences describing a pub, bar, or tavern set in the universe of this flavor text, focusing on the \
            ambiance, setting, theming, fixtures, and general clientele of the establishment.[/RESPONSE INSTRUCTION]\n`;
    };

    buildAlcoholDescriptionsPrompt(): string {
        return `[LOCATION]\n \
            ${this.barDescription}\n \
            [/LOCATION]\n \
            [EXAMPLE RESPONSES]\n \
            ### Response: {{char}}: Cherry Rotgut - A viscous, blood-red liqueur in a garishly bright bottle--tastes like cough syrup.\n \
            Tritium Delight - An impossibly fluorescent liquor; the tinted glass of the bottle does nothing to shield the eyes. Tastes like artificial sweetener on crack.\n \
            Rosewood Ale - This nutty, mellow ale comes in an elegant bottle embossed with the Eldridge Brewery logo.\n \
            ### Response: {{char}}: Toilet Wine - An old bleach jug of questionably-sourced-but-unquestionably-alcoholic red 'wine.'\n \
            Love Potion #69 - It's fuzzy, bubbly, and guaranteed to polish your drunk goggles.\n \
            Classic Grog - Cheap rum cut with water and lime juice until it barely tastes like anything, served in a sandy bottle.\n \
            [/EXAMPLE RESPONSES]\n \
            [RESPONSE INSTRUCTION]Instead of continuing the story, specifically utilize this response to define several types of alcohol that this bar might serve, providing a brief description of \
            each's appearance, bottle, odor, and flavor. Follow the format of examples, where each line presents a new beverage name and description:\n \
            "Some Alcohol - A brief description of the alcohol and bottle it comes in.\n \
            A Different Alcohol - Another brief description that differs from the other beverages.\n \
            Wildly Different Beverage - The description of yet another alcohol that stands out from the others."\n \
            [/RESPONSE INSTRUCTION]\n`;
    };

    buildPatronPrompt(): string {
        return `[LOCATION]\n \
            ${this.barDescription}\n \
            [/LOCATION]\n \
            [RESPONSE INSTRUCTION]Instead of continuing the story, specifically utilize this response to craft a new character who might patronize this establishment, \
            giving them a name, a physical description, a comma-delimitted list of concise physical attributes, and a paragraph about their personality, background, habits, and ticks. \
            Detail their personality, tics, appearance, style, and motivation (if any) for visiting the bar. ` +
            (Object.values(this.patrons).length > 0 ?
                (`Consider the following existing patrons and ensure that the new character in your response is distinct from the existing ones below. Also consider ` +
                `connections between this new character and one or more existing patrons:\n` +
                `${Object.values(this.patrons).map(patron => `${patron.name} - ${patron.description}\n${patron.personality}`).join('\n\n')}\n`) :
                '\n') +
            `Output the details for a new character in the following format:\nName: Name\nDescription: Physical description here\nAttributes: comma-delimitted, gender, skin, hair color, hair style, eye color, clothing, accessories, other key physical features\nPersonality: Personality and background details here.` +
            `\n[/RESPONSE INSTRUCTION]\n`;
    };

    readonly disableContentGeneration: boolean = false;
    // Message State:
    // Eventually move things like currentMessageId: string|undefined;

    // Chat State:
    barDescription: string|undefined;
    barImageUrl: string|undefined;
    entranceSoundUrl: string|undefined;
    beverages: Beverage[];
    loadingProgress: number|undefined;
    loadingDescription: string|undefined;
    messageParentIds: {[key: string]: string};
    messageSlices: {[key: string]: Slice};
    patrons: {[key: string]: Patron};

    currentMessageId: string|undefined;
    currentMessageIndex: number = 0;

    // Not saved:
    patronImagePrompt: string = 'Professional, visual novel, ((anime)), calm expression, neutral pose, flat shading, in-frame, flat contrasting background color, thighs';
    patronImageNegativePrompt: string = 'realism, border, dynamic lighting, ((close-up)), portrait, background image, cut off, bad anatomy, amateur, low quality';
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
        this.messageParentIds = {};
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

        /*console.log('beforePrompt()');

        this.messageParentIds[identity] = this.currentMessageId ?? '';
        this.messageSlices[identity] = new Slice(undefined, [], undefined, content);
        this.currentMessageId = identity;*/

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
/*
        console.log('afterResponse()');
        if (this.messageParentIds && this.messageSlices) {
            this.messageParentIds[identity] = this.currentMessageId ?? '';
            this.messageSlices[identity] = new Slice(undefined, [], undefined, content);
        }*/
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
            barImageUrl: this.barImageUrl,
            entranceSoundUrl: this.entranceSoundUrl,
            beverages: this.beverages,
            messageParentIds: this.messageParentIds,
            messageSlices: this.messageSlices,
            currentMessageId: this.currentMessageId,
            currentMessageIndex: this.currentMessageIndex,
            patrons: this.patrons
        };
    }

    readChatState(chatState: ChatStateType) {
        if (chatState) {
            this.barDescription = chatState.barDescription;
            this.barImageUrl = chatState.barImageUrl;
            this.entranceSoundUrl = chatState.entranceSoundUrl;
            this.beverages = (chatState.beverages ?? []).map((beverage: { name: string, description: string, imageUrl: string }) => new Beverage(beverage.name, beverage.description, beverage.imageUrl));
            this.messageParentIds = chatState.messageParentIds ?? {};
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
    async regenerateBeverages() {
        this.setLoadProgress(0, 'Generating beverages.');
        await this.generateBeverages();
        this.setLoadProgress(undefined, '');
    }

    async generateBeverages() {
        this.beverages = [];
        let alcoholResponse = await this.generator.textGen({
            prompt: this.buildAlcoholDescriptionsPrompt(),

            max_tokens: 500,
            min_tokens: 50
        });

        const lines = alcoholResponse?.result ?? '';
        const regex = /^[^\p{L}]*(\p{L}.+?)\s+-\s+(.+)$/gmu;
        let match: RegExpExecArray|null;
        let count = 0;
        console.log(lines);
        while ((match = regex.exec(lines)) !== null) {
            if (this.beverages.some(beverage => beverage.name === (match ? match[1].trim() : ''))) {
                continue;
            }
            this.beverages.push(new Beverage(match[1].trim(), match[2].trim(), ''));
            if (++count >= 5) {
                break;
            }
        }

        this.setLoadProgress(30, 'Generating beverage images.');

        for (const beverage of this.beverages) {
            console.log(`Generating image for ${beverage.name}`)
            beverage.imageUrl = await this.makeImage({
                //image: new URL(bottleUrl, import.meta.url).href,
                //strength: 0.75,
                prompt: `Professional, illustration, vibrant colors, head-on, centered, upright, empty background, negative space, contrasting color-keyed background, (a standalone bottle of the alcohol in this description: ${beverage.description})`,
                negative_prompt: `background, frame, realism, borders, perspective, effects`,
                remove_background: true,
            }, bottleUrl);
            this.setLoadProgress((this.loadingProgress ?? 0) + 5, 'Generating beverage images.');
        }
    }

    async generate() {
        if (this.loadingProgress !== undefined) return;
        this.setLoadProgress(5, 'Generating bar description.');

        let textResponse = await this.generator.textGen({
            prompt: this.buildBarDescriptionPrompt(this.characterForGeneration.personality + ' ' + this.characterForGeneration.description),
            max_tokens: 250,
            min_tokens: 50
        });
        console.log(`Bar description: ${textResponse?.result}`);
        this.barDescription = textResponse?.result ?? undefined;

        if (this.barDescription) {
            this.setLoadProgress(10, 'Generating bar image.');

            this.barImageUrl = await this.makeImage({
                prompt: `masterpiece, high resolution, hyperrealism, fine lines, vibrant colors, dynamic lighting, illustration, (interior of bar with this description: ${this.barDescription})`,
                negative_prompt: 'grainy, low resolution, low quality, exterior, person, outside',
                aspect_ratio: AspectRatio.WIDESCREEN_HORIZONTAL
            }, '');

            this.setLoadProgress(25, 'Generating beverages.');

            await this.generateBeverages();

            // Generate a sound effect
            this.setLoadProgress(60, 'Generate sounds.');
            /*this.entranceSoundUrl = await this.makeSound({
                prompt: `[INSTRUCTION OVERRIDE]Create a brief sound effect (2-4 seconds) to indicate that someone has entered the following establishment:\n${this.barDescription}\nThis sound could be a chime, bell, tone, or door closing sound--something that suits the ambiance of the setting.[/INSTRUCTION OVERRIDE]`,
                seconds: 5
            },'');*/

            let tries = 5;
            this.patrons = {};
            while (Object.keys(this.patrons).length < 3 && tries-- >= 0) {
                this.setLoadProgress((this.loadingProgress ?? 0) + 5, 'Generating patrons.');
                let patron = await this.generatePatron();
                if (patron) {
                    console.log('Generated patron:');
                    console.log(patron);
                    this.patrons[patron.name] = patron;
                    this.generatePatronImage(patron).then(result => patron.imageUrl = result);
                } else {
                    console.log('Failed a patron generation');
                }
            }

            // Finally, display an intro
            this.currentMessageId = undefined;
            this.currentMessageIndex = 500;
            this.setLoadProgress(95, 'Writing intro.');
            await this.advanceMessage()
            this.setLoadProgress(undefined, 'Complete');
        }

        await this.messenger.updateChatState(this.buildChatState());
        this.setLoadProgress(undefined, '');

        // TODO: If there was a failure, consider reloading from chatState rather than saving.
    }

    async addNewSlice(slice: Slice) {
        console.log('addNewSlice');
        let impersonation = await this.messenger.impersonate({
            message: slice.script,
            parent_id: this.currentMessageId ?? '-2',
            is_main: true,
            speaker_id: this.player.anonymizedId
        });

        console.log(`IDs: ${this.currentMessageId}:${impersonation.identity}`);
        this.messageParentIds[impersonation.identity] = this.currentMessageId ?? '';
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

    async generatePatron(): Promise<Patron|undefined> {
        // TODO: Generate a name, brief description, and longer description, passing in existing patrons with instruction to make this patron
        //  distinct from others while potentially having a connection to other established patrons.
        let patronResponse = await this.generator.textGen({
            prompt: this.buildPatronPrompt(),
            max_tokens: 500,
            min_tokens: 50
        });
        let result = patronResponse?.result ?? '';
        let newPatron: Patron|undefined = undefined;
        console.log(patronResponse);
        const nameRegex = /Name\s*[:\-]?\s*(.*)/i;
        const descriptionRegex = /Description\s*[:\-]?\s*(.*)/i;
        const attributesRegex = /Attributes\s*[:\-]?\s*(.*)/i;
        const personalityRegex = /Personality\s*[:\-]?\s*(.*)/i;
        const nameMatches = result.match(nameRegex);
        const descriptionMatches = result.match(descriptionRegex);
        const attributesMatches = result.match(attributesRegex);
        const personalityMatches = result.match(personalityRegex);
        if (nameMatches && nameMatches.length > 1 && descriptionMatches && descriptionMatches.length > 1 && attributesMatches && attributesMatches.length > 1 && personalityMatches && personalityMatches.length > 1) {
            console.log(`${nameMatches[1].trim()}:${descriptionMatches[1].trim()}:${personalityMatches[1].trim()}`);
            newPatron = new Patron(nameMatches[1].trim(), descriptionMatches[1].trim(), attributesMatches[1].trim(), personalityMatches[1].trim(), '');
            //  Generate a normal image, then image2image for happy and unhappy image.
            this.patrons[newPatron.name] = newPatron;
        }

        return newPatron;
    }

    async generatePatronImage(patron: Patron): Promise<string> {
        let imageUrl = await this.makeImage({
            //image: bottleUrl,
            //strength: 0.1,
            prompt: `${this.patronImagePrompt}, ${patron.attributes}`,
            negative_prompt: this.patronImageNegativePrompt,
            aspect_ratio: AspectRatio.WIDESCREEN_HORIZONTAL, //.PHOTO_HORIZONTAL,
            remove_background: true
            //seed: null,
            //item_id: null,
        }, patronUrl);

        return Promise.resolve(imageUrl);
    }

    buildHistory(messageId: string): string {
        let currentId = messageId;
        let historyString = this.getMessageBody(messageId);
        let depth = 0;
        while(this.messageParentIds[currentId] && currentId != this.messageParentIds[currentId] && depth < 10) {
            currentId = this.messageParentIds[currentId];
            if (this.getMessageSlice(currentId).direction !== Direction.Choice) {
                historyString = `${this.getMessageBody(currentId)}\n\n${historyString}`;
            }
            depth++;
        }

        return historyString;
    }

    buildBeverageDescriptions(): string {
        return `[BEVERAGES]${this.beverages.map(beverage => `${beverage.name} - ${beverage.description}`).join('\n')}[/BEVERAGES]\n`;
    }

    buildPatronDescriptions(): string {
        const presentPatronIds = this.getMessageSlice(this.currentMessageId).presentPatronIds;
        return `[ABSENT PATRONS]${Object.values(this.patrons).filter(patron => !presentPatronIds.includes(patron.name)).map(patron => `${patron.name} - ${patron.description}`).join('\n')}[/ABSENT PATRONS]\n` +
            `[PRESENT PATRONS]${Object.values(this.patrons).filter(patron => presentPatronIds.includes(patron.name)).map(patron => `${patron.name} - ${patron.description}`).join('\n')}[/PRESENT PATRONS]\n`;
    }

    buildStoryPrompt(history: string, currentInstruction: string): string {
        return `[SETTING]${this.barDescription}[/SETTING]\n` +
            `[USER]${this.player.name} is a bartender here. ${this.player.chatProfile}[/USER]\n` +
            this.buildPatronDescriptions() +
            this.buildBeverageDescriptions() +
            `\n${sampleScript}\n` +
            `[LOG]${history}[/LOG]\n` +
            `[INSTRUCTION OVERRIDE]${this.player.name} is a bartender at this bar; refer to ${this.player.name} in second person as you describe unfolding events. ${currentInstruction}[/INSTRUCTION OVERRIDE]`;
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
                    prompt: this.buildStoryPrompt(
                        this.buildHistory(this.currentMessageId ?? ''),
                        `${this.director.getPromptInstruction(this, newSlice)}\n${additionalContext}`),
                    max_tokens: 400,
                    min_tokens: 50
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
                <div style={{height: '8vh'}}>
                    <div>
                        <IconButton style={{outline: 1}} disabled={this.loadingProgress !== undefined} color={'primary'}
                                    onClick={() => this.generate()}>
                            <ReplayIcon/>
                        </IconButton>
                        <IconButton style={{outline: 1}} disabled={this.loadingProgress !== undefined} color={'primary'}
                                    onClick={() => this.regenerateBeverages()}>
                            <ReplayIcon/>
                        </IconButton>
                        <IconButton style={{outline: 1}} color={'primary'} onClick={() => {
                                let presentPatronIds = this.getMessageSlice(this.currentMessageId).presentPatronIds;
                                let patronId = this.getMessageSlice(this.currentMessageId).selectedPatronId ?? presentPatronIds[Math.floor(Math.random() * presentPatronIds.length)] ?? null;
                                if (patronId) {
                                    this.generatePatronImage(this.patrons[patronId]).then(imageUrl => this.patrons[patronId].imageUrl = imageUrl);
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
                    <div style={{height: '15vh'}}>
                        <Box component="section" sx={{
                            p: 2,
                            height: '95%',
                            width: '98%',
                            verticalAlign: 'middle',
                            alignContent: 'center',
                            border: '1px dashed grey',
                            backgroundColor: '#00000088',
                            '&:hover': {backgroundColor: '#000000BB'}
                        }}>
                            <div
                                style={{height: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                                {this.beverages.map(beverage => beverage.render())}
                            </div>
                        </Box>
                    </div>
                )}
            </ThemeProvider>
        </div>;
    };

}
