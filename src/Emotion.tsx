enum Emotion {
    neutral = 'neutral',
    joy = 'joy',
    desire = 'desire',
    anger = 'anger',
    surprise = 'surprise',
    embarrassment = 'embarrassment',
    sadness = 'sadness'
}

const emotionPrompts: {[emotion in Emotion]: string} = {
    neutral: 'calm expression',
    joy: 'happy, smiling',
    desire: 'seductive expression',
    anger: 'angry expression',
    surprise: 'surprised expression',
    embarrassment: 'embarrassed, blushing',
    sadness: 'sad, upset expression, teary'
}