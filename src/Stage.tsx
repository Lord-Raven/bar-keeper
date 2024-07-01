import React, {ReactElement} from "react";
import {useSound} from "use-sound";
import {
    AspectRatio,
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
import {Director} from "./Director";
import {MessageWindow} from "./MessageWindow"
import bottleUrl from './assets/bottle.png'

type MessageStateType = any;

type ConfigType = any;

type InitStateType = any;

type ChatStateType = any;

// nvm use 21.7.1
// yarn install (if dependencies changed)
// yarn dev --host --mode staging

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    buildBarDescriptionPrompt(description: string): string {
        return `[INST]Digest and appreciate the vibe, style, and setting of the following flavor text:[/INST]\n${description}\n` +
            `[INST]Write two or three sentences describing a pub, bar, or tavern set in the universe of this flavor text, focusing on the ` +
            `ambiance, setting, theming, fixtures, and general clientele of the establishment.[/INST]`
    };

    buildAlcoholDescriptionsPrompt(): string {
        return `[INST]Thoughtfully consider a bar with the following description:[/INST]\n${this.barDescription}\n` +
            `[INST]Output six lines, each with the name of a type of alcohol that this bar might serve, as well as a brief description of ` +
            `its appearance, bottle, odor, and flavor. Follow the format of these examples:\n` +
            `Cherry Rotgut - A viscous, blood-red liqueur in a garishly bright bottle--tastes like cough syrup.\n` +
            `Tritium Delight - An impossibly fluorescent liquor; the tinted glass of the bottle does nothing to shield the eyes. Tastes like artificial sweetener on crack.\n` +
            `Rosewood Ale - This nutty, mellow ale comes in an elegant bottle embossed with the Eldridge Brewery logo.\n` +
            `Toilet Wine - An old bleach jug of questionably-sourced-but-unquestionably-alcoholic red 'wine.'\n` +
            `Love Potion #69 - It's fuzzy, bubbly, and guaranteed to polish your drunk goggles.\n` +
            `Classic Grog - Cheap rum cut with water and lime juice until it barely tastes like anything, served in a sandy bottle.\n` +
            `[/INST]`;
    };

    buildPatronPrompt(): string {
        return `[INST]Thoughtfully consider a bar with the following description:[/INST]\n${this.barDescription}\n` +
            `[INST]Craft a character who might patronize this establishment, giving them a name and a one-to-two-paragraph description. ` +
            `Detail their personality, tics, appearance, style, and motivation (if any) for visiting the bar. ` +
            (Object.values(this.director.patrons).length > 0 ?
                (`Consider the following other known patrons and avoid making this character too similar or ` +
                `include a connection between this new character and one or more existing patrons:[/INST]\n` +
                `${Object.values(this.director.patrons).map(patron => `${patron.name} - ${patron.description}`).join('\n')}[INST]\n`) :
                '\n') +
            `Output the name of this new character on the first line, and their description on the remaining lines.[/INST]`;
    }

    readonly disableContentGeneration: boolean = true;
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
    messageBodies: {[key: string]: string[]};

    director: Director;
    currentMessageId: string|undefined;
    currentMessageIndex: number = 0;
    currentMessage: string;

    // Not saved:
    characterForGeneration: Character;
    player: User;
    requestedMessage: Promise<string>|null = null;
    isGenerating: boolean = false;

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
            messageState,
            chatState
        } = data;

        this.loadingProgress = 30;
        console.log('constructor');
        this.characterForGeneration = characters[Object.keys(characters)[0]];
        console.log(this.characterForGeneration);

        this.player = users[Object.keys(users)[0]];
        this.beverages = [];
        this.messageParentIds = {};
        this.messageBodies = {};
        this.readChatState(chatState);
        this.readMessageState(messageState);
        this.director = new Director();
        this.currentMessage = this.getMessageIndexBody(this.currentMessageId, this.currentMessageIndex);
        console.log('currentMessage: ' + this.currentMessage);
        this.loadingProgress = 50;
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

        console.log('beforePrompt()');

        this.messageParentIds[identity] = this.currentMessageId ?? '';
        this.messageBodies[identity] = this.chopMessage(content);
        this.currentMessageId = identity;

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

        console.log('afterResponse()');
        if (this.messageParentIds && this.messageBodies) {
            this.messageParentIds[identity] = this.currentMessageId ?? '';
            this.messageBodies[identity] = this.chopMessage(content);
        }
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
            messageBodies: this.messageBodies,
            currentMessageId: this.currentMessageId,
            currentMessageIndex: this.currentMessageIndex,
            director: this.director
        };
    }

    readChatState(chatState: ChatStateType) {
        if (chatState) {
            this.barDescription = chatState.barDescription;
            this.barImageUrl = chatState.barImageUrl;
            this.entranceSoundUrl = chatState.entranceSoundUrl;
            this.beverages = (chatState.beverages ?? []).map((beverage: { name: string, description: string, imageUrl: string }) => new Beverage(beverage.name, beverage.description, beverage.imageUrl));
            this.messageParentIds = chatState.messageParentIds ?? {};
            this.messageBodies = chatState.messageBodies ?? {};
            this.currentMessageId = chatState.currentMessageId ?? undefined;
            this.currentMessageIndex = chatState.currentMessageIndex ?? 0;
            this.director = chatState.director ?? new Director();
        }
    }

    buildMessageState(): MessageStateType {
        return {
        };
    }

    readMessageState(messageState: MessageStateType) {
        if (messageState) {
        }
    }

    setLoadProgress(loadingProgress: number|undefined, loadingDescription: string) {
        console.log(loadingProgress != undefined ? loadingDescription : 'Marking load complete.');
        this.loadingProgress = loadingProgress;
        this.loadingDescription = loadingDescription;
    }

    async generate() {
        if (this.loadingProgress !== undefined) return;
        this.setLoadProgress(5, 'Generating bar description.');

        let textResponse = await this.generator.textGen({
            prompt: this.buildBarDescriptionPrompt(this.characterForGeneration.personality + ' ' + this.characterForGeneration.description),
            max_tokens: 200,
            min_tokens: 50
        });
        console.log(`Bar description: ${textResponse?.result}`);
        this.barDescription = textResponse?.result ?? undefined;

        if (this.barDescription) {
            this.setLoadProgress(10, 'Generating bar image.');

            this.barImageUrl = await this.makeImage({
                prompt: `Professional, stylized, painterly illustration. Clean linework and vibrant colors and striking lighting. Visual novel background image of a bar suiting this description: ${this.barDescription}`,
                negative_prompt: 'grainy, low-resolution, realism',
                aspect_ratio: AspectRatio.WIDESCREEN_HORIZONTAL
            }, '');

            this.setLoadProgress(25, 'Generating beverages.');

            this.beverages = [];
            let alcoholResponse = await this.generator.textGen({
                prompt: this.buildAlcoholDescriptionsPrompt(),
                max_tokens: 400,
                min_tokens: 50
            });

            const lines = alcoholResponse?.result ?? '';
            const regex = /^[^\p{L}]*(\p{L}.+?)\s+-\s+(.+)$/gmu;
            let match;
            let count = 0;
            console.log(lines);
            while ((match = regex.exec(lines)) !== null) {
                this.beverages.push(new Beverage(match[1].trim(), match[2].trim(), ''));
                if (++count >= 6) {
                    break;
                }
            }

            this.setLoadProgress(30, 'Generating beverage images.');

            for (const beverage of this.beverages) {
                console.log(`Generating image for ${beverage.name}`)
                beverage.imageUrl = await this.makeImage({
                    //image: bottleUrl,
                    //strength: 0.1,
                    prompt: `Professional, stylized illustration. Clean linework and vibrant colors. A single, standalone bottle of alcohol on an empty background, suiting this description: ${beverage.description} Viewed head-on. Bottle upright.`,
                    negative_prompt: `background, frame, multiple bottles, realism, out-of-frame, grainy, borders, dynamic angle, perspective, tilted, skewed`,
                    aspect_ratio: AspectRatio.PHOTO_HORIZONTAL,
                    remove_background: true,
                    //seed: null,
                    //item_id: null,
                }, bottleUrl);
                this.setLoadProgress((this.loadingProgress ?? 0) + 5, 'Generating beverage images.');
            }

            // Generate a sound effect
            this.setLoadProgress(60, 'Generate sounds.');
            this.entranceSoundUrl = await this.makeSound({
                prompt: `[INST]Create a brief sound effect (1-2 seconds) to indicate that someone has entered the following establishment:[/INST}\n${this.barDescription}\n[INST]This can be a chime, bell, or door closing sound that suits the ambiance of the setting.`,
                seconds: 3
            },'');

            // Finally, display an intro
            this.currentMessageId = undefined;
            this.currentMessageIndex = 500;
            this.director.setDirection(undefined);
            this.director.chooseDirection();
            this.setLoadProgress(70, 'Writing intro.');
            await this.advanceMessage()
            this.setLoadProgress(undefined, 'Complete');
        }


        await this.messenger.updateChatState(this.buildChatState());
        this.setLoadProgress(undefined, '');

        // TODO: If there was a failure, consider reloading from chatState rather than saving.
    }

    async addNewMessage(message: string) {
        console.log('addNewMessage');
        let impersonation = await this.messenger.impersonate({
            message: message,
            parent_id: this.currentMessageId ?? '-2',
            is_main: true,
            speaker_id: this.player.anonymizedId
        });

        console.log(`IDs: ${this.currentMessageId}:${impersonation.identity}`);
        this.messageParentIds[impersonation.identity] = this.currentMessageId ?? '';
        this.messageBodies[impersonation.identity] = this.chopMessage(message);
        this.currentMessageId = impersonation.identity;
        this.currentMessageIndex = 0;
        this.currentMessage = this.getMessageIndexBody(this.currentMessageId, this.currentMessageIndex);
        console.log(`addNewMessage: ${this.currentMessage}`);
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
            max_tokens: 400,
            min_tokens: 50
        });
        const splitRegex = /[\r\n]+/;
        let newPatron: Patron|undefined = undefined;
        console.log(patronResponse);
        const lines = patronResponse?.result?.split(splitRegex, 2) ?? [];
        if (lines.length >= 2) {
            const nameRegex = /(?:(?:^|[\s\-<*])name[:\s\->]*)*(\S.*)/i;
            const descriptionRegex = /(?:(?:^|[\s\-<*])description[:\s\->]*)*(\S.*)/i
            const name = nameRegex.exec(lines[0]);
            const description = descriptionRegex.exec(lines[1]);
            console.log(description);
            if (name && name.length > 0 && description && description.length > 0) {
                console.log(name[0] + ":" + description[0]);
                newPatron = new Patron(name[0], description[0], '');
                //  Generate a normal image, then image2image for happy and unhappy image.
                this.director.patrons[newPatron.name] = newPatron;
            }
        }

        return newPatron;
    }

    buildHistory(messageId: string): string {
        let currentId = messageId;
        let historyString = this.getMessageBody(messageId);
        let depth = 0;
        while(this.messageParentIds[currentId] && depth < 10) {
            currentId = this.messageParentIds[currentId];
            historyString = `${this.getMessageBody(currentId)}\n\n${historyString}`;
            depth++;
        }

        return historyString;
    }

    buildStoryPrompt(history: string, currentInstruction: string): string {
        return `[SETTING]${this.barDescription}[/SETTING]\n` +
            `[USER]${this.player.name} is a bartender here. ${this.player.chatProfile}[/USER]\n` +
            `[LOG]${history}[/LOG]\n` +
            `[INST]${this.player.name} is a bartender at this bar; refer to ${this.player.name} in second person as you describe unfolding events. ${currentInstruction}[/INST]`;
    }

    async advanceMessage() {
        console.log('advanceMessage');
        if (!this.requestedMessage) {
            console.log('Kick off generation');
            this.requestedMessage = this.generateMessage();
        }
        if (this.currentMessageIndex >= this.getMessageBodies(this.currentMessageId).length - 1) {
            await this.processNextResponse();
        } else {
            console.log('Increment index.')
            this.currentMessageIndex++;
        }
        this.currentMessage = this.getMessageIndexBody(this.currentMessageId, this.currentMessageIndex);
        console.log(`advanceMessage: ${this.currentMessage}`);
    }

    async generateMessage(): Promise<string> {
        console.log('generateNextResponse');
        //let patron = await this.generatePatron();
        let entry = await this.generator.textGen({
            prompt: this.buildStoryPrompt(
                this.buildHistory(this.currentMessageId ?? ''),
                `${this.director.getPromptInstruction(this.barDescription ?? '', this.player.name)}`),
            max_tokens: 400,
            min_tokens: 50
        });
        console.log('did textGen');

        return Promise.resolve(entry?.result ?? '');
    }

    async processNextResponse() {
        this.isGenerating = true;
        let tries = 3;
        let result = await this.requestedMessage;
        while ((!result || result === '') && tries-- >= 0) {
            console.log(result);
            console.log('Try again');
            this.requestedMessage = this.generateMessage();
            result = await this.requestedMessage;
        }

        if (result && result !== '') {
            this.director.chooseDirection();
            console.log('choseDirectionForNextResponse');

            await this.addNewMessage(result);
            await this.messenger.updateChatState(this.buildChatState());
        } else {
            console.log('Failed to generate new content; try again.');
        }
        this.requestedMessage = null;
        this.isGenerating = false;
    }

    getMessageIndexBody(messageId: string|undefined, messageIndex: number): string {
        return this.getMessageBodies(messageId)[messageIndex] ?? '';
    }

    getMessageBody(messageId: string|undefined): string {
        return this.getMessageBodies(messageId).join('\n\n') ?? '';
    }

    getMessageBodies(messageId: string|undefined): string[] {
        return this.messageBodies[messageId ?? ''] ?? [''];
    }

    async makeImage(imageRequest: Object, defaultUrl: string): Promise<string> {
        return !this.disableContentGeneration ? (await this.generator.makeImage(imageRequest))?.url ?? defaultUrl : defaultUrl;
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
            color: '#ffffff'
        }}>
            <ThemeProvider theme={this.theme}>
                <div style={{height: '8%'}}>
                    <div>
                        <IconButton style={{outline: 1}} disabled={this.loadingProgress !== undefined} color={'primary'}
                                    onClick={() => this.generate()}>
                            <ReplayIcon/>
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
                <div style={{flexGrow: '1', overflow: 'auto'}}>
                </div>
                {!this.loadingProgress && (
                    <div style={{flexShrink: '0'}}>
                        <div>
                            <MessageWindow advance={() => {
                                void this.advanceMessage()
                            }} message={() => {
                                return this.currentMessage;
                            }}/>
                        </div>
                    </div>
                )}
                <div style={{height: '1%'}}></div>
                {!this.loadingProgress && (
                    <div style={{height: '15%'}}>
                        <Box component="section" sx={{
                            p: 2,
                            height: '100%',
                            border: '1px dashed grey',
                            backgroundColor: '#00000088',
                            '&:hover': {backgroundColor: '#000000BB'}
                        }}>
                            <div
                                style={{height: '100%', display: 'flex', flexDirection: 'row'}}>
                                {this.beverages.map(beverage => beverage.render())}
                            </div>
                        </Box>
                    </div>
                )}
                <div style={{height: '1%'}}></div>
            </ThemeProvider>
        </div>;
    };

}
