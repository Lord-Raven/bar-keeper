import { Emotion } from "./Emotion";

export class Actor {
    id: string;
    name: string;
    description: string;
    personality: string;
    affection: number = 0;
    imageUrls: {[emotion in Emotion]: string};

    constructor(id: string, name: string, description: string, personality: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.personality = personality;
        this.imageUrls = Object.values(Emotion).reduce((acc, emotion) => {
            acc[emotion as Emotion] = '';
            return acc;
        }, {} as {[emotion in Emotion]: string});
    }
}
