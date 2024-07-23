export class Patron {
    name: string;
    description: string;
    attributes: string;
    personality: string;
    imageUrl: string;

    constructor(name: string, description: string, attributes: string, personality: string, imageUrl: string) {
        this.name = name;
        this.description = description;
        this.attributes = attributes;
        this.personality = personality;
        this.imageUrl = imageUrl;
    }
}
