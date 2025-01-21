export class Patron {
    name: string;
    description: string;
    personality: string;
    emotion: string;
    imageUrls: {[emotion in Emotion]: string};

    constructor(name: string, description: string, personality: string) {
        this.name = name;
        this.description = description;
        this.personality = personality;
        this.emotion = 'neutral';
        this.imageUrls = Object.values(Emotion).reduce((acc, emotion) => {
            acc[emotion as Emotion] = '';
            return acc;
        }, {} as {[emotion in Emotion]: string});
    }
}

export enum Emotion {
    neutral = 'neutral',
    joy = 'joy',
    desire = 'desire',
    anger = 'anger',
    surprise = 'surprise',
    embarrassment = 'embarrassment',
    sadness = 'sadness'
}

export const emotionPrompts: {[emotion in Emotion]: string} = {
    neutral: 'calm expression',
    joy: 'happy, smiling',
    desire: 'seductive expression',
    anger: 'angry expression',
    surprise: 'surprised or shocked expression',
    embarrassment: 'embarrassed, blushing',
    sadness: 'sad, upset expression, teary'
}