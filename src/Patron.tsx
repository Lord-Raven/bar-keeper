export class Patron {
    name: string;
    description: string;
    personality: string;
    imageUrls: {[emotion in Emotion]: string};

    constructor(name: string, description: string, personality: string) {
        this.name = name;
        this.description = description;
        this.personality = personality;
        this.imageUrls = Object.values(Emotion).reduce((acc, emotion) => {
            acc[emotion as Emotion] = '';
            return acc;
        }, {} as {[emotion in Emotion]: string});
    }
}

export enum Emotion {
    neutral = 'neutral',
    anger = 'anger',
    confusion = 'confusion',
    desire = 'desire',
    disappointment = 'disappointment',
    disgust = 'disgust',
    embarrassment = 'embarrassment',
    fear = 'fear',
    joy = 'joy',
    love = 'love',
    nervousness = 'nervousness',
    pride = 'pride',
    sadness = 'sadness',
    surprise = 'surprise'
}

export const emotionRouting: {[key: string]: Emotion} = {
    'admiration': Emotion.love,
    'amusement': Emotion.joy,
    'annoyance': Emotion.disappointment,
    'approval': Emotion.joy,
    'caring': Emotion.joy,
    'curiosity': Emotion.neutral,
    'disapproval': Emotion.disappointment,
    'excitement': Emotion.joy,
    'gratitude': Emotion.joy,
    'grief': Emotion.sadness,
    'optimism': Emotion.neutral,
    'realization': Emotion.surprise,
    'relief': Emotion.neutral,
    'remorse': Emotion.sadness
}

export const emotionPrompts: {[emotion in Emotion]: string} = {
    neutral: 'calm expression',
    anger: 'angry expression',
    confusion: 'stunned, confused expression',
    desire: 'sexy, seductive expression',
    disappointment: 'unhappy, disappointed expression',
    disgust: 'disgusted expression',
    embarrassment: 'embarrassed, blushing',
    fear: 'terrified expression',
    joy: 'happy, smiling',
    love: 'adorable, grinning, blushing, lovestruck expression',
    nervousness: 'nervous, uneasy expression',
    pride: 'proud, haughty expression',
    sadness: 'sad, upset expression, teary',
    surprise: 'pleasantly surprised expression'
}