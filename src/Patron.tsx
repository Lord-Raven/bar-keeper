export class Patron {
    name: string;
    description: string;
    personality: string;
    imageNeutral: string;
    imageHappy: string;

    constructor(name: string, description: string, personality: string) {
        this.name = name;
        this.description = description;
        this.personality = personality;
        this.imageNeutral = '';
        this.imageHappy = '';
    }
}
