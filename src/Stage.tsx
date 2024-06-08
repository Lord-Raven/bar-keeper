import {ReactElement} from "react";
import {AspectRatio, Character, InitialData, Message, StageBase, StageResponse} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";
import LoadingBar from 'react-top-loading-bar';

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

    barDescription: string|undefined;
    barImageUrl: string|undefined;
    alcoholDescription: {[key: string]: string}|undefined;
    alcoholImageUrl: {[key: string]: string}|undefined;
    loadingProgress: number|undefined;
    loadingDescription: string|undefined;
    character: Character;


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

        this.character = characters[Object.keys(characters)[0]];
        console.log(this.character);
        this.readChatState(chatState);
    }

    async load(): Promise<Partial<LoadResponse<InitStateType, ChatStateType, MessageStateType>>> {

        return {
            /*** @type boolean @default null
             @description The 'success' boolean returned should be false IFF (if and only if), some condition is met that means
              the stage shouldn't be run at all and the iFrame can be closed/removed.
              For example, if a stage displays expressions and no characters have an expression pack,
              there is no reason to run the stage, so it would return false here. ***/
            success: true,
            /*** @type null | string @description an error message to show
             briefly at the top of the screen, if any. ***/
            error: null,
            initState: null,
            chatState: this.buildChatState(),
        };
    }

    async setState(state: MessageStateType): Promise<void> {

    }

    async beforePrompt(userMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        /***
         This is called after someone presses 'send', but before anything is sent to the LLM.
         ***/
        const {
            content,            /*** @type: string
             @description Just the last message about to be sent. ***/
            anonymizedId,       /*** @type: string
             @description An anonymized ID that is unique to this individual
              in this chat, but NOT their Chub ID. ***/
            isBot             /*** @type: boolean
             @description Whether this is itself from another bot, ex. in a group chat. ***/
        } = userMessage;
        return {
            /*** @type null | string @description A string to add to the
             end of the final prompt sent to the LLM,
             but that isn't persisted. ***/
            stageDirections: null,
            /*** @type MessageStateType | null @description the new state after the userMessage. ***/
            messageState: null,
            /*** @type null | string @description If not null, the user's message itself is replaced
             with this value, both in what's sent to the LLM and in the database. ***/
            modifiedMessage: null,
            /*** @type null | string @description A system message to append to the end of this message.
             This is unique in that it shows up in the chat log and is sent to the LLM in subsequent messages,
             but it's shown as coming from a system user and not any member of the chat. If you have things like
             computed stat blocks that you want to show in the log, but don't want the LLM to start trying to
             mimic/output them, they belong here. ***/
            systemMessage: null,
            /*** @type null | string @description an error message to show
             briefly at the top of the screen, if any. ***/
            error: null,
            chatState: this.buildChatState(),
        };
    }

    async afterResponse(botMessage: Message): Promise<Partial<StageResponse<ChatStateType, MessageStateType>>> {
        /***
         This is called immediately after a response from the LLM.
         ***/
        const {
            content,            /*** @type: string
             @description The LLM's response. ***/
            anonymizedId,       /*** @type: string
             @description An anonymized ID that is unique to this individual
              in this chat, but NOT their Chub ID. ***/
            isBot             /*** @type: boolean
             @description Whether this is from a bot, conceivably always true. ***/
        } = botMessage;
        return {
            /*** @type null | string @description A string to add to the
             end of the final prompt sent to the LLM,
             but that isn't persisted. ***/
            stageDirections: null,
            /*** @type MessageStateType | null @description the new state after the botMessage. ***/
            messageState: null,
            /*** @type null | string @description If not null, the bot's response itself is replaced
             with this value, both in what's sent to the LLM subsequently and in the database. ***/
            modifiedMessage: null,
            /*** @type null | string @description an error message to show
             briefly at the top of the screen, if any. ***/
            error: null,
            systemMessage: null,
            chatState: this.buildChatState(),
        };
    }

    buildChatState(): ChatStateType {
        return {
            barDescription: this.barDescription,
            barImageUrl: this.barImageUrl,
            alcoholDescription: this.alcoholDescription,
            alcoholImageUrl: this.alcoholImageUrl
        };
    }

    readChatState(chatState: ChatStateType) {
        if (chatState) {
            this.barDescription = chatState.barDescription;
            this.barImageUrl = chatState.barImageUrl;
            this.alcoholDescription = chatState.alcoholDescription;
            this.alcoholImageUrl = chatState.alcoholImageUrl;
        }
    }

    async generate() {
        this.loadingProgress = 0;
        this.loadingDescription = 'Generating bar description.';
        console.log('Generating');

        let textResponse = await this.generator.textGen({
            prompt: this.buildBarDescriptionPrompt(this.character.personality + ' ' + this.character.description),
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

            this.alcoholDescription = {};
            this.alcoholImageUrl = {};

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
                this.alcoholDescription[match[1].trim()] = match[2].trim();
                console.log(`${match[1].trim()} - ${this.alcoholDescription[match[1].trim()]}`);
                if (++count >= 6) {
                    break;
                }
            }

            this.loadingProgress = 50;
            this.loadingDescription = 'Generating beverage images.';

            for (const [key, value] of Object.entries(this.alcoholDescription)) {
                console.log(`Generating image for ${key}`)
                let alcoholImageResponse = await this.generator.makeImage({
                    prompt: `Clean, professional, stylized illustration of a bottle of alcohol on an empty background, matching this description: ${value}`,
                    aspect_ratio: AspectRatio.PHOTO_VERTICAL,
                    remove_background: true
                });
                this.alcoholImageUrl[key] = alcoholImageResponse?.url ?? '';
                this.loadingProgress += 5;
            }
        }
        this.loadingProgress = this.loadingDescription = undefined;

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
                    <button onClick={() => this.generate()}>Generate</button>
                </div>

                {this.loadingProgress && (
                    <div>
                        <LoadingBar color="#f11946" height={3} progress={this.loadingProgress}/>
                        <p style={{color: '#ffffff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                            {this.loadingDescription} - {this.loadingProgress}%
                        </p>
                    </div>
                )}
            </div>
            <div>{this.barDescription ?? ''}</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
                {Object.entries(this.alcoholImageUrl ?? {}).map(([key, url]) => (
                    <img key={key} src={url} alt={key} style={{ margin: '0 5px' }} />
                ))}
            </div>
        </div>;
    };

}
