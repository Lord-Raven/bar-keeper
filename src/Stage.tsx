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

    buildSection(name: string, body: string) {
        return `###${name.toUpperCase()}: ${body.trim()}\n\n`;
    }
    buildDistillationPrompt(description: string): string {
        return (
            this.buildSection('Flavor Text', description) +
            this.buildSection('Priority Instruction', 
                `The FLAVOR TEXT is merely inspirational material that you will use to establish a SOURCE, SETTING, THEMES, and ART style for upcoming narration and illustration. ` +
                `This initial response includes four specific and clearly defined fields, each containing a comma-delimitted list of words or phrases that distill or embody the spirit of the FLAVOR TEXT.\n` +
                `"SOURCE" should name the source material of FLAVOR TEXT, if any; leave this blank or 'Original' if FLAVOR TEXT is not derived from a known work.\n` +
                `"SETTING" should briefly summarize the overarching location, vibe, or time period derived from the FLAVOR TEXT, including any key ways in which the setting deviates from the expectations for that setting.\n` +
                `"THEMES" should list all of the prominent themes or concepts from the FLAVOR TEXT.\n` +
                `"ART" should identify a target artist name, art style, art genre, medium, palette, stroke, linework, or other style choices that suit or align with the setting and themes of the FLAVOR TEXT; this will be used to generate appropriate images later.\n` +
                `Define these four fields and promptly end your response.\n`) +
            this.buildSection('Example Responses', 
                `"SOURCE: H.P. Lovecraft\nSETTING: A metaphysical 1930s Innsmouth, Massachusetts\nTHEMES: Mind control, dementia, gore, mysticism, Old Ones\nART: noir, dark, gritty, hyperrealism, wet"\n` +
                `"SOURCE: Robert E. Howard\nSETTING: Cimeria, a dark fantasy wasteland\nTHEMES: barbarians, hedonism, violence, domination\nART: dark fantasy, oil painting, Frank Frazetta, hypersexualized"\n` +
                `"SOURCE: Original\nSETTING: Quirky, fantastic modern Japanese countryside\nTHEMES: magical, fantasy modern, non-violence, exaggerated, silly, funny\nART: Studio Ghibli, bright, anime, vibrant, sparkly"\n` +
                `"SOURCE: Alien\nSETTING: Hard sci-fi, isolated space station\nTHEMES: Slow burn, danger, alien infestation, psychological horror\nART: Creepy, greebling, gross, hyperrealism, H. R. Geiger"\n` +
                `"SOURCE: Mass Effect\nSETTING: Far future, the Citadel\nTHEMES: Space opera, friendship, trying times, relationships\nART: Clean, 3D render, vibrant, pristine, lens flares"\n` +
                `"SOURCE: Original\nSETTING: Underground, 80s biker bar\nTHEMES: turf war, drug running, machismo, brutality\nART: Comic book, neon, chrome, heavy inks"\n` +
                `"SOURCE: Original\nSETTING: 70s disco scene, Los Angeles\nTHEMES: Free love, vampires, lycanthropes, disco, underworld, clubs\nART: Psychedelic, high-contrast, hyperrealism, exaggerated character proportions"\n`) +
            this.buildSection('Standard Instruction', '{{suffix}}')).trim();
    }

    buildBarDescriptionPrompt(sourceSummary: string, settingSummary: string, themeSummary: string): string {
        return (
            (sourceSummary != '' ? this.buildSection('Source Material', sourceSummary) : '') +
            this.buildSection('Setting', settingSummary) +
            this.buildSection('Themes', themeSummary) +
            this.buildSection('Priority Instruction', 
                'You are doing prep work for a roleplaying narrative. You will use this initial response to write a few sentences describing a fictional pub, bar, club, or tavern set in SETTING, drawing upon the THEMES. ' +
                'This descriptive paragraph should focus on the ambience, setting, theming, fixtures, and general clientele of the establishment. ' +
                'This informative and flavorful description will later be used in future, narrative responses.\n') +
            this.buildSection('Standard Instruction', '{{suffix}}')).trim();
    };

    buildAlcoholDescriptionsPrompt(): string {
        return (
            this.buildSection('Setting', this.settingSummary ?? '') +
            this.buildSection('Location', this.barDescription ?? '') +
            this.buildSection('Priority Instruction', 
                `You are doing prep work for a roleplaying narrative. You will use this initial response to define several types of alcohol that the LOCATION might serve, providing a NAME and brief DESCRIPTION of ` +
                `each drink's appearance, bottle, odor, and flavor. Output five to seven varied example beverages that suit the setting, each occupying two lines: a NAME field on the first line and a DESCRIPTION on the following line.\n`) +
            this.buildSection('Example Responses', 
                `"NAME: Cherry Rotgut\nDESCRIPTION: A viscous, blood-red liqueur in a garishly bright bottle--tastes like cough syrup.\n` +
                `NAME: Tritium Delight\nDESCRIPTION: An impossibly fluorescent liquor; the tinted glass of the bottle does nothing to shield the eyes. Tastes like artificial sweetener on crack.\n` +
                `NAME: Rosewood Ale\nDESCRIPTION: This nutty, mellow ale comes in an elegant bottle embossed with the Eldridge Brewery logo."\n` +
                `"NAME: Toilet Wine\nDESCRIPTION: An old bleach jug of questionably-sourced-but-unquestionably-alcoholic red 'wine.'\n` +
                `NAME: Love Potion #69\nDESCRIPTION: It's fuzzy, bubbly, and guaranteed to polish your drunk goggles.\n` +
                `NAME: Classic Grog\nDESCRIPTION: Cheap rum cut with water and lime juice until it barely tastes like anything, served in a sandy bottle."\n` +
                `"NAME: Synth Mead\nDESCRIPTION: Bees died out long ago, but hypervikings still live for the sweet taste of synthetic honey wine.\n` +
                `NAME: Super Hazy Imperial Double IPA\nDESCRIPTION: More IBUs than anyone's ever cared for. The bottle's plastered with cute bullshit about the local microbrewery that produced it.\n` +
                `NAME: USB Port\nDESCRIPTION: Alcohol for wannabe techbros. Not legally a 'port' because of international protections surrounding the term."`) +
            this.buildSection('Standard Instruction', '{{suffix}}')).trim();
    };

    buildPatronPrompt(): string {
        return (
            this.buildSection('Location', this.barDescription ?? '') +
            this.buildSection('Priority Instruction', 
                `This is a unique response; rather than continuing the narrative, you should instead utilize this response to craft a new character who might patronize this establishment, ` +
                `giving them a name, a physical description, and a paragraph about their personality, background, habits, and ticks. ` +
                `Detail their personality, tics, appearance, style, and motivation (if any) for visiting the bar. ` +
                (Object.values(this.patrons).length > 0 ?
                    (`Consider the following existing patrons and ensure that the new character in your response is distinct from the existing ones below. Also consider ` +
                    `connections between this new character and one or more existing patrons:\n` +
                    `${Object.values(this.patrons).map(patron => `${patron.name} - ${patron.description}\n${patron.personality}`).join('\n\n')}\n`) :
                    '\n') +
                `Output the details for a new character in the following format:\nName: Name\nDescription: Physical description covering gender, skin tone, hair color, hair style, eye color, clothing, accessories, and other obvious traits.\nPersonality: Personality and background details here.`) +
            this.buildSection('Standard Instruction', '{{suffix}}')).trim();
    };

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

        this.beverages = (alcoholResponse?.result ?? '').split(new RegExp('NAME', 'i'))
            .filter(item => item.trim() != '')
            .map(item => {
                const nameMatch = item.match(/Name:\s*(.*)/i);
                const descriptionMatch = item.match(/Description:\s*(.*)/i);
                return new Beverage(nameMatch ? nameMatch[1].trim() : '', descriptionMatch ? descriptionMatch[1].trim() : '', '');
            }).filter(beverage => beverage.name != '' && beverage.description != '');

        this.setLoadProgress(30, 'Generating beverage images.');

        for (const beverage of this.beverages) {
            console.log(`Generating image for ${beverage.name}: ${beverage.description}`);
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
            prompt: this.buildDistillationPrompt(this.characterForGeneration.personality + ' ' + this.characterForGeneration.description),
            max_tokens: 100,
            min_tokens: 50
        });
        console.log(`Distillation: ${textResponse?.result}`);
        
        if (textResponse && textResponse.result) {

            const sourceMatch = textResponse.result.match(/Source:\s*(.*)/i);
            const settingMatch = textResponse.result.match(/Setting:\s*(.*)/i);
            const themeMatch = textResponse.result.match(/Themes:\s*(.*)/i);
            const artMatch = textResponse.result.match(/Art:\s*(.*)/i);

            this.sourceSummary = sourceMatch ? sourceMatch[1].trim() : '';
            this.settingSummary = settingMatch ? settingMatch[1].trim() : '';
            this.themeSummary = themeMatch ? themeMatch[1].trim() : '';
            this.artSummary = artMatch ? artMatch[1].trim() : '';

            if (this.sourceSummary.toLowerCase() == 'ORIGINAL') this.sourceSummary = '';

            console.log(`Source: ${this.sourceSummary}\nSetting: ${this.settingSummary}\nTheme: ${this.themeSummary}\nArt: ${this.artSummary}`);

            textResponse = await this.generator.textGen({
                prompt: this.buildBarDescriptionPrompt(this.sourceSummary, this.settingSummary, this.themeSummary),
                max_tokens: 200,
                min_tokens: 50
            });
            console.log(`Bar description: ${textResponse?.result}`);
    
            this.barDescription = textResponse?.result ?? '';

            this.setLoadProgress(10, 'Generating bar image.');
            const barPrompt = `masterpiece, high resolution, (art style notes: ${this.artSummary}), ` +
                (this.sourceSummary != '' && this.sourceSummary.toLowerCase() != 'original' ? `(source material: ${this.sourceSummary}), ` : '') +
                `(setting details: ${this.settingSummary}), (interior of a bar with this description: ${this.barDescription})`;

            this.barImageUrl = await this.makeImage({
                prompt: barPrompt,
                negative_prompt: 'grainy, low resolution, low quality, exterior, person, people, crowd, outside, daytime, outdoors',
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

            let tries = 2;
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
            //await this.advanceMessage()
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
        //const attributesRegex = /Attributes\s*[:\-]?\s*(.*)/i;
        const personalityRegex = /Personality\s*[:\-]?\s*(.*)/i;
        const nameMatches = result.match(nameRegex);
        const descriptionMatches = result.match(descriptionRegex);
        //const attributesMatches = result.match(attributesRegex);
        const personalityMatches = result.match(personalityRegex);
        if (nameMatches && nameMatches.length > 1 && descriptionMatches && descriptionMatches.length > 1 && /*attributesMatches && attributesMatches.length > 1 &&*/ personalityMatches && personalityMatches.length > 1) {
            console.log(`${nameMatches[1].trim()}:${descriptionMatches[1].trim()}:${personalityMatches[1].trim()}`);
            newPatron = new Patron(nameMatches[1].trim(), descriptionMatches[1].trim(), /*attributesMatches[1].trim(),*/ personalityMatches[1].trim(), '');
            //  Generate a normal image, then image2image for happy and unhappy image.
            this.patrons[newPatron.name] = newPatron;
        }

        return newPatron;
    }

    async generatePatronImage(patron: Patron): Promise<string> {
        let imageUrl = await this.makeImage({
            //image: bottleUrl,
            //strength: 0.1,
            prompt: `${this.patronImagePrompt}, (art style notes: ${this.artSummary}), (${patron.description}), (this is a character from this setting ${this.settingSummary})`,
            negative_prompt: this.patronImageNegativePrompt,
            aspect_ratio: AspectRatio.WIDESCREEN_VERTICAL, //.PHOTO_HORIZONTAL,
            remove_background: true
            //seed: null,
            //item_id: null,
        }, patronUrl);

        return Promise.resolve(imageUrl);
    }

    buildBeverageDescriptions(): string {
        return this.buildSection('Beverages', `${this.beverages.map(beverage => `${beverage.name} - ${beverage.description}`).join('\n')}`);
    }

    buildPatronDescriptions(): string {
        const presentPatronIds = this.getMessageSlice(this.currentMessageId).presentPatronIds;
        return this.buildSection('Absent Patrons', `${Object.values(this.patrons).filter(patron => !presentPatronIds.includes(patron.name)).map(patron => `${patron.name} - ${patron.description}`).join('\n')}`) +
            this.buildSection('Present Patrons', `${Object.values(this.patrons).filter(patron => presentPatronIds.includes(patron.name)).map(patron => `${patron.name} - ${patron.description}`).join('\n')}`);
    }

    buildStoryPrompt(currentInstruction: string): string {
        return this.buildSection('Setting', this.barDescription ?? '') +
            this.buildSection('User', `${this.player.name} is a bartender here. ${this.player.chatProfile}`) +
            this.buildPatronDescriptions() +
            this.buildBeverageDescriptions() +
            this.buildSection('Sample Response', sampleScript) +
            this.buildSection('Log', '{{messages}}') +
            this.buildSection('Instruction Override', `${this.player.name} is a bartender at this bar; refer to ${this.player.name} in second person as you describe unfolding events. ${currentInstruction}`);
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
                    include_history: true
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
