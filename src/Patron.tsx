export class Patron {
    id: string;
    name: string;
    description: string;
    personality: string;
    imageUrl: string;

    constructor(id: string, name: string, description: string, personality: string, imageUrl: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.personality = personality;
        this.imageUrl = imageUrl;
    }
}
