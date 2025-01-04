export class Patron {
    name: string;
    description: string;
    personality: string;
    imageUrl: string;

    constructor(name: string, description: string, personality: string, imageUrl: string) {
        this.name = name;
        this.description = description;
        this.personality = personality;
        this.imageUrl = imageUrl;
    }
}
