import React, {ReactElement} from "react";
import {AspectRatio, Character, InitialData, Message, StageBase, StageResponse} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";
import {Actor} from "./Actor";
import {Beverage} from "./Beverage";
import {ThemeProvider, createTheme, LinearProgress, Box} from "@mui/material";

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

    // Message State:
    currentMessageId: string|undefined;

    // Chat State:
    barDescription: string|undefined;
    barImageUrl: string|undefined;
    beverages: Beverage[];
    loadingProgress: number|undefined;
    loadingDescription: string|undefined;
    messageParentIds: {[key: string]: string}|undefined;
    messageBodies: {[key: string]: string}|undefined;
    actors: {[key: string]: Actor};
    presentActorIds: string[]
    currentActor: string;

    // Not saved:
    characterForGeneration: Character;
    playerId: string;

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
        this.actors = {};
        this.presentActorIds = [];
        this.currentActor = '';
        this.playerId = users[Object.keys(users)[0]].anonymizedId;
        this.beverages = [];
        this.readChatState(chatState);
        this.readMessageState(messageState);
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

        if (this.messageParentIds && this.messageBodies) {
            this.messageParentIds[identity] = this.currentMessageId ?? '';
            this.messageBodies[identity] = content;
        }
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
            beverages: this.beverages,
            messageParentIds: this.messageParentIds,
            messageBodies: this.messageBodies
        };
    }

    readChatState(chatState: ChatStateType) {
        if (chatState) {
            this.barDescription = chatState.barDescription;
            this.barImageUrl = chatState.barImageUrl;
            this.beverages = (chatState.beverages ?? []).map((beverage: { name: string, description: string, imageUrl: string }) => new Beverage(beverage.name, beverage.description, beverage.imageUrl));
            this.messageParentIds = chatState.messageParentIds ?? {};
            this.messageBodies = chatState.messageBodies ?? {};
        }
    }

    buildMessageState(): MessageStateType {
        return {
            currentMessageId: this.currentMessageId
        };
    }

    readMessageState(messageState: MessageStateType) {
        if (messageState) {
            this.currentMessageId = messageState.currentMessageId;
        }
    }

    async generate() {
        this.loadingProgress = 0;
        this.loadingDescription = 'Generating bar description.';
        console.log('Generating');

        let textResponse = await this.generator.textGen({
            prompt: this.buildBarDescriptionPrompt(this.characterForGeneration.personality + ' ' + this.characterForGeneration.description),
            max_tokens: 150,
            min_tokens: 50
        });
        console.log('Got a response');
        this.loadingProgress = 20;
        this.loadingDescription = 'Generating bar image.';


        this.barDescription = textResponse?.result ?? undefined;

        if (this.barDescription) {
            console.log('Generate an image');

            let imageResponse = await this.generator.makeImage({
                prompt: `Clean, professional, stylized illustration. Visual novel background image of a bar matching this description: ${this.barDescription}`,
                aspect_ratio: AspectRatio.WIDESCREEN_HORIZONTAL
            });

            this.barImageUrl = imageResponse?.url;

            this.loadingProgress = 40;
            this.loadingDescription = 'Generating beverages.';

            this.beverages = [];

            let alcoholResponse = await this.generator.textGen({
                prompt: this.buildAlcoholDescriptionsPrompt(),
                max_tokens: 300,
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

            this.loadingProgress = 50;
            this.loadingDescription = 'Generating beverage images.';

            for (const beverage of this.beverages) {
                console.log(`Generating image for ${beverage.name}`)
                let alcoholImageResponse = await this.generator.makeImage({
                    prompt: `Clean and stylized illustration of a single, standalone bottle of alcohol on an empty background, suiting this description: ${beverage.description} Viewed head-on. Bottle upright.`,
                    negative_prompt: `background, frame, multiple bottles, realism, out-of-frame, borders, dynamic angle, perspective, tilted, skewed`,
                    aspect_ratio: AspectRatio.PHOTO_VERTICAL,
                    remove_background: true
                });
                beverage.imageUrl = alcoholImageResponse?.url ?? '';
                this.loadingProgress += 5;
            }
        }

        /*let finalResponse = await this.messenger.impersonate({
            message: `[Generated content: ${this.barDescription}]`,
            parent_id: this.currentMessageId ?? null,
            speaker_id: this.playerId
        });*/
        await this.messenger.updateChatState(this.buildChatState());
        this.loadingProgress = this.loadingDescription = undefined;
    }

    async continue() {

    }

    getMessageBody(messageId: string|undefined): string {
        return (this.messageBodies ?? {})[messageId ?? ''] ?? '';
    }


    render(): ReactElement {

        return <div style={{
            backgroundImage: `url(${this.barImageUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            width: '100vw',
            height: '100vh',
            display: 'grid',
            alignItems: 'stretch',
            color: '#ffffff'
        }}>
            <ThemeProvider theme={this.theme}>
                <div>
                    <div>
                        <button style={{color: '#ffffff'}} disabled={this.loadingProgress !== undefined} onClick={() => this.generate()}>Generate</button>
                    </div>

                    {this.loadingProgress && (
                        <div>
                            <LinearProgress variant="determinate" color="secondary" value={this.loadingProgress} />
                            <p style={{color: '#ffffff', background: '#111122', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                {this.loadingDescription} - {this.loadingProgress}%
                            </p>
                        </div>
                    )}
                </div>
                <div>{this.getMessageBody(this.currentMessageId)}</div>
                <div>
                    <button style={{color: '#ffffff'}} onClick={() => this.continue()}>Continue</button>
                </div>
                <Box component="section" sx={{p: 2, border: '1px dashed grey', backgroundColor: '#111111' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
                        {this.beverages.map(beverage => beverage.render())}
                    </div>
                </Box>
            </ThemeProvider>
        </div>;
    };

}
