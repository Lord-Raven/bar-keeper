import {ReactElement} from "react";
import {AspectRatio, Character, InitialData, Message, StageBase, StageResponse} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";
import LoadingBar from 'react-top-loading-bar';
import {Actor} from "./Actor";

/***
 The type that this stage persists message-level state in.
 This is primarily for readability, and not enforced.

 @description This type is saved in the database after each message,
  which makes it ideal for storing things like positions and statuses,
  but not for things like history, which is best managed ephemerally
  in the internal state of the Stage class itself.
 ***/
type MessageStateType = any;

/***
 The type of the stage-specific configuration of this stage.

 @description This is for things you want people to be able to configure,
  like background color.
 ***/
type ConfigType = any;

/***
 The type that this stage persists chat initialization state in.
 If there is any 'constant once initialized' static state unique to a chat,
 like procedurally generated terrain that is only created ONCE and ONLY ONCE per chat,
 it belongs here.
 ***/
type InitStateType = any;

/***
 The type that this stage persists dynamic chat-level state in.
 This is for any state information unique to a chat,
    that applies to ALL branches and paths such as clearing fog-of-war.
 It is usually unlikely you will need this, and if it is used for message-level
    data like player health then it will enter an inconsistent state whenever
    they change branches or jump nodes. Use MessageStateType for that.
 ***/
type ChatStateType = any;

/***
 A simple example class that implements the interfaces necessary for a Stage.
 If you want to rename it, be sure to modify App.js as well.
 @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/stage.ts
 ***/
export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    buildBarDescriptionPrompt(description: string): string {
        return `[INST]Digest and appreciate the vibe, style, and setting of the following flavor text:[/INST]\n${description}\n` +
            `[INST]Write two or three sentences describing a bar set in the fictional universe of this flavor text; focusing on the ` +
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
    alcoholDescriptions: {[key: string]: string}|undefined;
    alcoholImageUrls: {[key: string]: string}|undefined;
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

    constructor(data: InitialData<InitStateType, ChatStateType, MessageStateType, ConfigType>) {
        /***
         This is the first thing called in the stage,
         to create an instance of it.
         The definition of InitialData is at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/initial.ts
         Character at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/character.ts
         User at @link https://github.com/CharHubAI/chub-stages-ts/blob/main/src/types/user.ts
         ***/
        super(data);
        const {
            characters,         // @type:  { [key: string]: Character }
            users,                  // @type:  { [key: string]: User}
            config,                                 //  @type:  ConfigType
            messageState,                           //  @type:  MessageStateType
            environment,                     // @type: Environment (which is a string)
            initState,                             // @type: null | InitStateType
            chatState                              // @type: null | ChatStateType
        } = data;

        this.characterForGeneration = characters[Object.keys(characters)[0]];
        console.log(this.characterForGeneration);
        this.readChatState(chatState);
        this.readMessageState(messageState);
        this.actors = {};
        this.presentActorIds = [];
        this.currentActor = '';
        this.playerId = users[Object.keys(users)[0]].anonymizedId;
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
            anonymizedId,
            isBot,
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
            anonymizedId,
            isBot,
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
            alcoholDescriptions: this.alcoholDescriptions,
            alcoholImageUrls: this.alcoholImageUrls,
            messageParentIds: this.messageParentIds,
            messageBodies: this.messageBodies
        };
    }

    readChatState(chatState: ChatStateType) {
        if (chatState) {
            this.barDescription = chatState.barDescription;
            this.barImageUrl = chatState.barImageUrl;
            this.alcoholDescriptions = chatState.alcoholDescriptions;
            this.alcoholImageUrls = chatState.alcoholImageUrls;
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

            this.alcoholDescriptions = {};
            this.alcoholImageUrls = {};

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
                this.alcoholDescriptions[match[1].trim()] = match[2].trim();
                console.log(`${match[1].trim()} - ${this.alcoholDescriptions[match[1].trim()]}`);
                if (++count >= 6) {
                    break;
                }
            }

            this.loadingProgress = 50;
            this.loadingDescription = 'Generating beverage images.';

            for (const [key, value] of Object.entries(this.alcoholDescriptions)) {
                console.log(`Generating image for ${key}`)
                let alcoholImageResponse = await this.generator.makeImage({
                    prompt: `Clean, professional, stylized illustration of a single, standalone bottle of alcohol on an empty background, matching this description: ${value}`,
                    negative_prompt: `background, frame, multiple bottles`,
                    aspect_ratio: AspectRatio.PHOTO_VERTICAL,
                    remove_background: true
                });
                this.alcoholImageUrls[key] = alcoholImageResponse?.url ?? '';
                this.loadingProgress += 5;
            }
        }
        this.loadingProgress = this.loadingDescription = undefined;

        let finalResponse = await this.messenger.impersonate({
            message: `[Generated content: ${this.barDescription}]`,
            parent_id: this.currentMessageId ?? null,
            speaker_id: this.playerId
        });
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
            <div>
                <div>
                    <button style={{color: '#ffffff'}} disabled={!!this.loadingProgress ?? false} onClick={() => this.generate()}>Generate</button>
                </div>

                {this.loadingProgress && (
                    <div>
                        <LoadingBar color="#f11946" height={30} progress={this.loadingProgress}/>
                        <p style={{color: '#ffffff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            {this.loadingDescription} - {this.loadingProgress}%
                        </p>
                    </div>
                )}
            </div>
            <div>{this.getMessageBody(this.currentMessageId)}</div>
            <div>
                <button style={{color: '#ffffff'}} onClick={() => this.continue()}>Continue</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
                {Object.entries(this.alcoholImageUrls ?? {}).map(([key, url]) => (
                    <img key={key} src={url} alt={key} style={{ margin: '0 5px' }} />
                ))}
            </div>
        </div>;
    };

}
