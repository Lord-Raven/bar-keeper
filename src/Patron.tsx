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
    admiration = 'admiration',
    amusement = 'amusement',
    anger = 'anger',
    annoyance = 'annoyance',
    approval = 'approval',
    caring = 'caring',
    confusion = 'confusion',
    curiosity = 'curiosity',
    desire = 'desire',
    disappointment = 'disappointment',
    disapproval = 'disapproval',
    disgust = 'disgust',
    embarrassment = 'embarrassment',
    excitement = 'excitement',
    fear = 'fear',
    gratitude = 'gratitude',
    grief = 'grief',
    joy = 'joy',
    love = 'love',
    nervousness = 'nervousness',
    optimism = 'optimism',
    pride = 'pride',
    realization = 'realization',
    relief = 'relief',
    remorse = 'remorse',
    sadness = 'sadness',
    surprise = 'surprise'
}

export const emotionRouting: {[emotion in Emotion]: Emotion} = {
    neutral: Emotion.neutral,
    admiration: Emotion.love,
    amusement: Emotion.joy,
    anger: Emotion.anger,
    annoyance: Emotion.disappointment,
    approval: Emotion.joy,
    caring: Emotion.joy,
    confusion: Emotion.confusion,
    curiosity: Emotion.neutral,
    desire: Emotion.desire,
    disappointment: Emotion.disappointment,
    disapproval: Emotion.disappointment,
    disgust: Emotion.disgust,
    embarrassment: Emotion.embarrassment,
    excitement: Emotion.joy,
    fear: Emotion.fear,
    gratitude: Emotion.joy,
    grief: Emotion.sadness,
    joy: Emotion.joy,
    love: Emotion.love,
    nervousness: Emotion.nervousness,
    optimism: Emotion.neutral,
    pride: Emotion.pride,
    realization: Emotion.surprise,
    relief: Emotion.neutral,
    remorse: Emotion.sadness,
    sadness: Emotion.sadness,
    surprise: Emotion.surprise
}

export const emotionPrompts: {[emotion in Emotion]: string} = {
    neutral: 'calm expression',
    admiration: '',
    amusement: '',
    anger: 'angry expression',
    annoyance: '',
    approval: '',
    caring: '',
    confusion: 'stunned, confused expression',
    curiosity: '',
    desire: 'sexy, seductive expression',
    disappointment: 'unhappy, disappointed expression',
    disapproval: '',
    disgust: 'disgusted expression',
    embarrassment: 'embarrassed, blushing',
    excitement: '',
    fear: 'terrified expression',
    gratitude: '',
    grief: '',
    joy: 'happy, smiling',
    love: 'adoring, lovestruck expression',
    nervousness: 'nervous, uneasy expression',
    optimism: '',
    pride: 'proud, haughty expression',
    realization: '',
    relief: '',
    remorse: '',
    sadness: 'sad, upset expression, teary',
    surprise: 'surprised or shocked expression'
}