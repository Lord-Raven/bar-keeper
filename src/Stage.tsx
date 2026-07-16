import React, {ReactElement} from "react";
import {
    Character,
    InitialData,
    Message,
    StageBase,
    StageResponse,
    User
} from "@chub-ai/stages-ts";
import {LoadResponse} from "@chub-ai/stages-ts/dist/types/load";
import {Actor} from "./actors/Actor";
import {Beverage} from "./Beverage";
import {createTheme} from "@mui/material";
import {ChatNode, createNodes} from "./ChatNode";
import {Screen} from "./Screen";
import titleUrl from './assets/title.png'
import { SkitData } from "./Skit";

type MessageStateType = any;

type ConfigType = any;

type InitStateType = any;

type ChatStateType = any;

type Location = {
    name: string;
    description: string;
    imageUrl: string;
}

type SaveData = {
    barDescription: string|undefined;
    sourceSummary: string|undefined;
    settingSummary: string|undefined;
    themeSummary: string|undefined;
    artSummary: string|undefined;
    barImageUrl: string|undefined;
    entranceSoundUrl: string|undefined;
    beverages: Beverage[];
    actors: {[key: string]: Actor};
    dummyActors: Actor[];
    titleUrl: string;
    skits: SkitData[];
    disableImpersonation: boolean;
    language: string|undefined;
    locations: Location[];
}

export class Stage extends StageBase<InitStateType, ChatStateType, MessageStateType, ConfigType> {

    readonly disableContentGeneration: boolean = false;

    // Chat State:
    saveData: SaveData;
    loadingProgress: number|undefined;
    loadingDescription: string|undefined;


    // Not saved:
    characters: {[key: string]: Character};
    characterForGeneration: Character;
    player: User;
    requestedNodes: Promise<ChatNode[]|null>|null = null;
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
            config,
            chatState
        } = data;

        this.loadingProgress = 30;
        this.characters = characters;
        this.characterForGeneration = characters[Object.keys(characters)[0]];

        this.player = users[Object.keys(users)[0]];
        this.saveData = {
            barDescription: undefined,
            sourceSummary: undefined,
            settingSummary: undefined,
            themeSummary: undefined,
            artSummary: undefined,
            barImageUrl: undefined,
            entranceSoundUrl: undefined,
            beverages: [],
            actors: {},
            dummyActors: [],
            titleUrl: titleUrl,
            skits: [],
            disableImpersonation: false,
            language: undefined,
            locations: []
        };
        this.readChatState(chatState);

        this.loadingProgress = 50;

        //console.log('Config loaded:');
        //console.log(config);
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
        return this.saveData;
    }

    readChatState(chatState: ChatStateType) {
        if (chatState) {
            this.saveData = chatState;
        }
    }

    setLoadProgress(loadingProgress: number|undefined, loadingDescription: string) {
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

    getCurrentSkit() {
        return this.saveData.skits[this.saveData.skits.length - 1] ?? {}
    }

    getCurrentSkitEntry() {
        const currentSkit = this.getCurrentSkit();
        return currentSkit.script && currentSkit.script.length > 0 ? currentSkit.script[currentSkit.currentIndex ?? 0] : {};
    }

    buildBeverageDescriptions(): string {
        return this.saveData.beverages.length > 0 ? `${this.saveData.beverages.map(beverage => `NAME: ${beverage.name}\nDESCRIPTION: ${beverage.description}`).join('\n\n')}` : '';
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

    render(): ReactElement {

        return <Screen stage={() => {return this}}/>;
    };

}
