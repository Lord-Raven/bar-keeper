export class Patron {
    id: string;
    name: string;
    description: string;
    imageUrl: string;

    constructor(id: string, name: string, description: string, imageUrl: string) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
    }
}
