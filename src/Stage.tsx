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
import ForwardIcon from "@mui/icons-material/Forward";
import {Director} from "./Director";
import bottleUrl from './assets/bottle.png'

type MessageStateType = any;

type ConfigType = any;

type InitStateType = any;

type ChatStateType = any;

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    buildBarDescriptionPrompt(description: string): string {
        return `[INST]Digest and appreciate the vibe, style, and setting of the following flavor text:[/INST]\n${description}\n` +
            `[INST]Write two or three sentences describing a pub, bar, or tavern set in the universe of this flavor text, focusing on the ` +
            `ambiance, setting, theming, fixtures, and general clientele of the establishment.[/INST]`
    };

    buildAlcoholDescriptionsPrompt(): string {
        return `[INST]Thoughtfully consider a bar with the following description:[/INST]\n${this.barDescription}\n` +
            `[INST]Output six lines, each with the name of a type of alcohol that this bar might serve, as well as a brief description of ` +
            `its appearance, bottle, and flavor. Follow the format of these examples:\n` +
            `Cherry Rotgut - A viscous, blood-red liqueur in a garishly bright bottle--tastes like cough syrup.\n` +
            `Tritium Delight - An impossibly fluorescent liquor; the tinted glass of the bottle does nothing to shield the eyes. Tastes like sweetener on cocaine.\n` +
            `Rosewood Ale - This nutty, mellow ale comes in an elegant bottle embossed with a Eldridge Brewery logo.\n` +
            `Toilet Wine - A plastic pitcher of questionably-sourced-but-unquestionably-alcoholic red wine.[/INST]`
    };

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
    messageBodies: {[key: string]: string};
    patrons: {[key: string]: Patron};
    presentPatronIds: string[]
    currentPatron: string;
    director: Director;
    currentMessageId: string|undefined;

    // Not saved:
    characterForGeneration: Character;
    player: User;

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
            characters,         // @type:  { [key: string]: Character }
            users,                  // @type:  { [key: string]: User}
            messageState,                           //  @type:  MessageStateType
            chatState                              // @type: null | ChatStateType
        } = data;

        this.characterForGeneration = characters[Object.keys(characters)[0]];
        console.log(this.characterForGeneration);
        this.patrons = {};
        this.presentPatronIds = [];
        this.currentPatron = '';
        this.player = users[Object.keys(users)[0]];
        this.beverages = [];
        this.messageParentIds = {};
        this.messageBodies = {};
        this.readChatState(chatState);
        this.readMessageState(messageState);
        this.director = new Director();
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {

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
        /***
         This is called after someone presses 'send', but before anything is sent to the LLM.
         ***/
        const {
            content,
            identity
        } = userMessage;

        console.log('beforePrompt()');

        this.messageParentIds[identity] = this.currentMessageId ?? '';
        this.messageBodies[identity] = content;
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
            this.messageBodies[identity] = content;
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
            this.director = chatState.director ?? new Director();
        }
    }

    buildMessageState(): MessageStateType {
        return {
            //currentMessageId: this.currentMessageId
        };
    }

    readMessageState(messageState: MessageStateType) {
        if (messageState) {
            //this.currentMessageId = messageState.currentMessageId;
        }
    }

    setLoadProgress(loadingProgress: number|undefined, loadingDescription: string) {
        console.log(loadingProgress != undefined ? loadingDescription : 'Marking load complete.');
        this.loadingProgress = loadingProgress;
        this.loadingDescription = loadingDescription;
    }

    async generate() {
        if (this.loadingProgress !== undefined) return;
        this.setLoadProgress(0, 'Generating bar description.');

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
                if (++count >= 1) {
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
            this.director.setDirection(undefined);
            this.director.chooseDirection();
            this.setLoadProgress(70, 'Writing intro.');
            let intro = await this.generator.textGen({
                prompt: this.buildStoryPrompt(
                    this.buildHistory(this.currentMessageId ?? ''),
                    `${this.director.getPromptInstruction(this.barDescription, this.player.name)}`),
                max_tokens: 400,
                min_tokens: 50
            });

            let impersonation = await this.messenger.impersonate({
                message: intro?.result ?? '',
                parent_id: '-2',
                is_main: true,
                speaker_id: this.player.anonymizedId
            });

            this.messageParentIds[impersonation.identity] = this.currentMessageId ?? '';
            this.messageBodies[impersonation.identity] = intro?.result ?? '';
            this.currentMessageId = impersonation.identity;
        }

        await this.messenger.updateChatState(this.buildChatState());
        this.setLoadProgress(undefined, '');

        // If there was a failure, consider reloading from chatState rather than saving.
    }

    async generatePatron() {

    }

    buildHistory(messageId: string): string {
        let currentId = messageId;
        let historyString = this.getMessageBody(messageId);
        let depth = 0;
        while(this.messageParentIds[currentId] && depth < 10) {
            currentId = this.messageParentIds[currentId];
            historyString = `###Response: ${this.getMessageBody(currentId)}\n\n${historyString}`;
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

    async continue() {
        console.log('continuing');
        //if (this.entranceSoundUrl) {
        //    useSound(this.entranceSoundUrl);
        //}
        this.director.chooseDirection();
        console.log('choseDirection');
        let entry = await this.generator.textGen({
            prompt: this.buildStoryPrompt(
                this.buildHistory(this.currentMessageId ?? ''),
                `${this.director.getPromptInstruction(this.barDescription ?? '', this.player.name)}`),
            max_tokens: 400,
            min_tokens: 50
        });
        console.log('did textGen');

        let impersonation = await this.messenger.impersonate({
            message: entry?.result ?? '',
            parent_id: this.currentMessageId ?? '-2',
            is_main: true,
            speaker_id: this.player.anonymizedId
        });

        this.messageParentIds[impersonation.identity] = this.currentMessageId ?? '';
        this.messageBodies[impersonation.identity] = entry?.result ?? '';
        this.currentMessageId = impersonation.identity;
    }

    getMessageBody(messageId: string|undefined): string {
        return this.messageBodies[messageId ?? ''] ?? '';
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
            color: '#ffffff'
        }}>
            <ThemeProvider theme={this.theme}>
                <div style={{height: '8%'}}>
                    <div>
                        <IconButton style={{outline: 1}} disabled={this.loadingProgress !== undefined} color={'primary'} onClick={() => this.generate()}>
                            <ReplayIcon/>
                        </IconButton>
                        {this.loadingProgress && (
                            <div>
                                <Typography>
                                    {this.loadingProgress}% - {this.loadingDescription}
                                </Typography>
                                <LinearProgress sx={{outline: 'primary'}} variant="determinate" color="success" value={this.loadingProgress}/>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{maxHeight: '70%'}}>
                </div>
                <div style={{overflow: 'hidden'}}>
                    <Box component="section" sx={{height: '100%', p: 2, border: '1px dashed grey', backgroundColor: '#00000088', '&:hover': {backgroundColor: '#000000BB'}}}>
                        <div style={{maxHeight: '100%'}}>
                            <Typography>{this.getMessageBody(this.currentMessageId)}</Typography>
                        </div>
                        <div style={{verticalAlign: 'right'}}>
                            <IconButton style={{outline: 1, float: 'right'}} disabled={false} color={'primary'} onClick={() => this.continue()}>
                                <ForwardIcon/>
                            </IconButton>
                        </div>
                    </Box>
                </div>
                <div style={{height: '10%'}}>
                    <Box component="section" sx={{
                        p: 2,
                        height: '100%',
                        border: '1px dashed grey',
                        backgroundColor: '#00000088',
                        '&:hover': {backgroundColor: '#000000BB'}
                    }}>
                        <div style={{height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end'}}>
                            {this.beverages.map(beverage => beverage.render())}
                        </div>
                    </Box>
                </div>
                <div style={{height: '2%'}}>
                </div>
            </ThemeProvider>
        </div>;
    };

}
