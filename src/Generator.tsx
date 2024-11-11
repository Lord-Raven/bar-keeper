import { AspectRatio } from "@chub-ai/stages-ts";
import { Stage } from "./Stage";
import { Patron } from "./Patron";
import bottleUrl from './assets/bottle.png'
import patronUrl from './assets/elf2.png'
import { Beverage } from "./Beverage";


export function buildSection(name: string, body: string) {
    return `###${name.toUpperCase()}: ${body.trim()}\n\n`;
}

export function buildDistillationPrompt(description: string): string {
    return (
        buildSection('Flavor Text', description) +
        buildSection('Priority Instruction', 
            `The FLAVOR TEXT is merely inspirational material that you will use to establish a SOURCE, SETTING, THEMES, and ART style for upcoming narration and illustration. ` +
            `This initial response includes four specific and clearly defined fields, each containing a comma-delimitted list of words or phrases that distill or embody the spirit of the FLAVOR TEXT.\n` +
            `"SOURCE" should name the source material of FLAVOR TEXT, if any; leave this blank or 'Original' if FLAVOR TEXT is not derived from a known work.\n` +
            `"SETTING" should briefly summarize the overarching location, vibe, or time period derived from the FLAVOR TEXT, including any key ways in which the setting deviates from the expectations for that setting.\n` +
            `"THEMES" should list all of the prominent themes or concepts from the FLAVOR TEXT.\n` +
            `"ART" should identify a target artist name, art style, art genre, medium, palette, stroke, linework, or other style choices that suit or align with the setting and themes of the FLAVOR TEXT; this will be used to generate appropriate images later.\n` +
            `Define these four fields and promptly end your response.\n`) +
        buildSection('Example Responses', 
            `"SOURCE: H.P. Lovecraft\nSETTING: A metaphysical 1930s Innsmouth, Massachusetts\nTHEMES: Mind control, dementia, gore, mysticism, Old Ones\nART: noir, dark, gritty, hyperrealism, wet"\n` +
            `"SOURCE: Robert E. Howard\nSETTING: Cimeria, a dark fantasy wasteland\nTHEMES: barbarians, hedonism, violence, domination\nART: dark fantasy, oil painting, Frank Frazetta, hypersexualized"\n` +
            `"SOURCE: Original\nSETTING: Quirky, fantastic modern Japanese countryside\nTHEMES: magical, fantasy modern, non-violence, exaggerated, silly, funny\nART: Studio Ghibli, bright, anime, vibrant, sparkly"\n` +
            `"SOURCE: Alien\nSETTING: Hard sci-fi, isolated space station\nTHEMES: Slow burn, danger, alien infestation, psychological horror\nART: Creepy, greebling, gross, hyperrealism, H. R. Geiger"\n` +
            `"SOURCE: Mass Effect\nSETTING: Far future, the Citadel\nTHEMES: Space opera, friendship, trying times, relationships\nART: Clean, 3D render, vibrant, pristine, lens flares"\n` +
            `"SOURCE: Original\nSETTING: Underground, 80s biker bar\nTHEMES: turf war, drug running, machismo, brutality\nART: Comic book, neon, chrome, heavy inks"\n` +
            `"SOURCE: Original\nSETTING: 70s disco scene, Los Angeles\nTHEMES: Free love, vampires, lycanthropes, disco, underworld, clubs\nART: Psychedelic, high-contrast, hyperrealism, exaggerated character proportions"\n`) +
        buildSection('Standard Instruction', '{{suffix}}')).trim();
}

export function buildBarDescriptionPrompt(stage: Stage): string {
    return (
        (stage.sourceSummary != '' ? buildSection('Source Material', stage.sourceSummary ?? '') : '') +
        buildSection('Setting', stage.settingSummary ?? '') +
        buildSection('Themes', stage.themeSummary ?? '') +
        buildSection('Priority Instruction', 
            'You are doing prep work for a roleplaying narrative. Instead of narrating, you will use this planning response to write a few sentences describing a fictional pub, bar, club, or tavern set in SETTING, drawing upon the THEMES. ' +
            'This descriptive paragraph should focus on the ambience, setting, theming, fixtures, and general clientele of the establishment. ' +
            'This informative and flavorful description will later be used in future, narrative responses.\n') +
        buildSection('Standard Instruction', '{{suffix}}')).trim();
}

export function buildAlcoholDescriptionsPrompt(stage: Stage): string {
    return (
        buildSection('Setting', stage.settingSummary ?? '') +
        buildSection('Location', stage.barDescription ?? '') +
        buildSection('Established Beverages', stage.buildBeverageDescriptions()) +
        buildSection('Priority Instruction', 
            `You are doing prep work for a roleplaying narrative. Instead of narrating, you must use this preparatory response to list out several types of alcohol that the LOCATION might serve, ` +
            `providing a NAME and brief DESCRIPTION of each drink's appearance, bottle, odor, and flavor. ` +
            `Output several varied and interesting beverages that suit the SETTING and LOCATION, each formatted into a single line with two properties defined on each line: a NAME field followed by a DESCRIPTION field. ` +
            `Use the EXAMPLE RESPONSES for formatting reference, but be original with each of your entries. `) +
        buildSection('Example Responses', 
            `NAME: Cherry Rotgut DESCRIPTION: A viscous, blood-red liqueur in a garishly bright bottle--tastes like cough syrup.\n` +
            `NAME: Tritium Delight DESCRIPTION: An impossibly fluorescent liquor; the tinted glass of the bottle does nothing to shield the eyes. Tastes like artificial sweetener on crack.\n` +
            `NAME: Rosewood Ale DESCRIPTION: This nutty, mellow ale comes in an elegant bottle embossed with the Eldridge Brewery logo.\n` +
            `NAME: Toilet Wine DESCRIPTION: An old bleach jug of questionably-sourced-but-unquestionably-alcoholic red 'wine.'\n` +
            `NAME: Love Potion #69 DESCRIPTION: It's fuzzy, bubbly, and guaranteed to polish your drunk goggles.\n` +
            `NAME: Classic Grog DESCRIPTION: Cheap rum cut with water and lime juice until it barely tastes like anything, served in a sandy bottle.\n` +
            `NAME: Synth Mead DESCRIPTION: Bees died out long ago, but hypervikings still live for the sweet taste of synthetic honey wine.\n` +
            `NAME: Super Hazy Imperial Double IPA DESCRIPTION: More IBUs than anyone's ever cared for. The bottle's plastered with cute bullshit about the local microbrewery that produced it.\n` +
            `NAME: USB Port DESCRIPTION: Alcohol for wannabe techbros. Not legally a 'port' because of international protections surrounding the term.\n`) +
        buildSection('Standard Instruction', '{{suffix}}')).trim();
}

export function buildPatronPrompt(stage: Stage): string {
    return (
        buildSection('Location', stage.barDescription ?? '') +
        buildSection('Priority Instruction', 
            `This is a unique response; rather than continuing the narrative, you should instead utilize this response to craft a new character who might patronize this establishment, ` +
            `giving them a name, a physical description, and a paragraph about their personality, background, habits, and ticks. ` +
            `Detail their personality, tics, appearance, style, and motivation (if any) for visiting the bar. ` +
            (Object.values(stage.patrons).length > 0 ?
                (`Consider the following existing patrons and ensure that the new character in your response is distinct from the existing ones below. Also consider ` +
                `connections between this new character and one or more existing patrons:\n` +
                `${Object.values(stage.patrons).map(patron => `${patron.name} - ${patron.description}\n${patron.personality}`).join('\n\n')}\n`) :
                '\n') +
            `Output the details for a new character in the following format:\nName: Name\nDescription: Physical description covering gender, skin tone, hair color, hair style, eye color, clothing, accessories, and other obvious traits.\nPersonality: Personality and background details here.`) +
        buildSection('Standard Instruction', '{{suffix}}')).trim();
}



export async function regenerateBeverages(stage: Stage) {
    stage.setLoadProgress(0, 'Generating beverages.');
    await generateBeverages(stage);
    stage.setLoadProgress(undefined, '');
}

export async function generateBeverages(stage: Stage) {
    stage.beverages = [];
    let tries = 3;
    while (stage.beverages.length < 5) {
        let alcoholResponse = await stage.generator.textGen({
            prompt: buildAlcoholDescriptionsPrompt(stage),
            max_tokens: 300,
            min_tokens: 50
        });

        console.log(alcoholResponse?.result);
        stage.beverages.push(...(alcoholResponse?.result ?? '').split(new RegExp('NAME:', 'i'))
            .filter(item => item.trim() != '')
            .map(item => {
                const nameMatch = item.match(/\s*(.*?)\s*Description:/i);
                const descriptionMatch = item.match(/Description:\s*(.*)/i);
                console.log(`${nameMatch ? nameMatch[1].trim() : ''}, ${descriptionMatch ? descriptionMatch[1].trim() : ''}`);
                return new Beverage(nameMatch ? nameMatch[1].trim() : '', descriptionMatch ? descriptionMatch[1].trim() : '', '');
            }).filter(beverage => beverage.name != '' && beverage.description != ''));
    }

    if (stage.beverages.length < 5) {
        throw Error('Failed to generate sufficient beverages.');
    } else {
        stage.beverages = stage.beverages.slice(0, 4);
    }

    stage.setLoadProgress(30, 'Generating beverage images.');

    for (const beverage of stage.beverages) {
        console.log(`Generating image for ${beverage.name}: ${beverage.description}`);
        beverage.imageUrl = await stage.makeImage({
            //image: new URL(bottleUrl, import.meta.url).href,
            //strength: 0.75,
            prompt: `Professional, illustration, vibrant colors, head-on, centered, upright, empty background, negative space, contrasting color-keyed background, (a standalone bottle of the alcohol in this description: ${beverage.description})`,
            negative_prompt: `background, frame, realism, borders, perspective, effects`,
            remove_background: true,
        }, bottleUrl);
        if (beverage.imageUrl == '') {
            throw Error('Failed to generate a beverage image');
        }
        stage.setLoadProgress((stage.loadingProgress ?? 0) + 5, 'Generating beverage images.');
    }
}

async function generateDistillation(stage: Stage) {
    stage.sourceSummary = '';
    stage.settingSummary = '';
    stage.themeSummary = '';
    stage.artSummary = '';

    let tries = 3;
    while ((stage.settingSummary == '' || stage.themeSummary == '' || stage.artSummary == '') && tries > 0) {
        let textResponse = await stage.generator.textGen({
            prompt: buildDistillationPrompt(stage.characterForGeneration.personality + ' ' + stage.characterForGeneration.description),
            max_tokens: 120,
            min_tokens: 50
        });
        console.log(`Distillation: ${textResponse?.result}`);
        
        if (textResponse && textResponse.result) {
    
            const sourceMatch = textResponse.result.match(/Source:\s*(.*)/i);
            const settingMatch = textResponse.result.match(/Setting:\s*(.*)/i);
            const themeMatch = textResponse.result.match(/Themes:\s*(.*)/i);
            const artMatch = textResponse.result.match(/Art:\s*(.*)/i);
    
            stage.sourceSummary = sourceMatch ? sourceMatch[1].trim() : '';
            stage.settingSummary = settingMatch ? settingMatch[1].trim() : '';
            stage.themeSummary = themeMatch ? themeMatch[1].trim() : '';
            stage.artSummary = artMatch ? artMatch[1].trim() : '';
    
            if (stage.sourceSummary.toLowerCase() == 'original') stage.sourceSummary = '';
        }
        
        tries--;
    }

    if (stage.settingSummary == '' || stage.themeSummary == '' || stage.artSummary == '') {
        throw Error('Failed to generate a distillation.');
    }

    console.log(`Source: ${stage.sourceSummary}\nSetting: ${stage.settingSummary}\nTheme: ${stage.themeSummary}\nArt: ${stage.artSummary}`);
}

export async function generate(stage: Stage) {
    if (stage.loadingProgress !== undefined) return;

    try {
        await generateDistillation(stage);

        stage.setLoadProgress(5, 'Generating bar description.');
        let textResponse = await stage.generator.textGen({
            prompt: buildBarDescriptionPrompt(stage),
            max_tokens: 200,
            min_tokens: 50
        });
        console.log(`Bar description: ${textResponse?.result}`);

        stage.barDescription = textResponse?.result ?? '';

        stage.setLoadProgress(10, 'Generating bar image.');
        const barPrompt = `masterpiece, high resolution, (art style notes: ${stage.artSummary}), ` +
            (stage.sourceSummary && stage.sourceSummary != '' && stage.sourceSummary.toLowerCase() != 'original' ? `(source material: ${stage.sourceSummary}), ` : '') +
            `(setting details: ${stage.settingSummary}), ((interior of a bar with this description: ${stage.barDescription}))`;

        stage.barImageUrl = await stage.makeImage({
            prompt: barPrompt,
            negative_prompt: 'grainy, low resolution, low quality, ((exterior)), person, people, crowd, (outside), daytime, outdoors',
            aspect_ratio: AspectRatio.WIDESCREEN_HORIZONTAL
        }, '');

        stage.setLoadProgress(25, 'Generating beverages.');

        await generateBeverages(stage);

        // Generate a sound effect
        stage.setLoadProgress(60, 'Generate sounds.');
        
        /*this.entranceSoundUrl = await this.makeSound({
            prompt: `[INSTRUCTION OVERRIDE]Create a brief sound effect (2-4 seconds) to indicate that someone has entered the following establishment:\n${this.barDescription}\nThis sound could be a chime, bell, tone, or door closing sound--something that suits the ambiance of the setting.[/INSTRUCTION OVERRIDE]`,
            seconds: 5
        },'');*/

        let tries = 2;
        stage.patrons = {};
        while (Object.keys(stage.patrons).length < 3 && tries-- >= 0) {
            stage.setLoadProgress((stage.loadingProgress ?? 0) + 5, 'Generating patrons.');
            let patron = await generatePatron(stage);
            if (patron) {
                console.log('Generated patron:');
                console.log(patron);
                stage.patrons[patron.name] = patron;
                generatePatronImage(patron, stage).then(result => patron.imageUrl = result);
            } else {
                console.log('Failed a patron generation');
            }
        }

        // Finally, display an intro
        stage.currentMessageId = undefined;
        stage.currentMessageIndex = 500;
        stage.setLoadProgress(95, 'Writing intro.');
        await stage.advanceMessage()
        stage.setLoadProgress(undefined, 'Complete');
    } catch (e) {
        console.log(e);
    }

    await stage.messenger.updateChatState(stage.buildChatState());
    stage.setLoadProgress(undefined, '');

    // TODO: If there was a failure, consider reloading from chatState rather than saving.
}



export async function generatePatron(stage: Stage): Promise<Patron|undefined> {
    // TODO: Generate a name, brief description, and longer description, passing in existing patrons with instruction to make this patron
    //  distinct from others while potentially having a connection to other established patrons.
    let patronResponse = await stage.generator.textGen({
        prompt: buildPatronPrompt(stage),
        max_tokens: 500,
        min_tokens: 50
    });
    let result = patronResponse?.result ?? '';
    let newPatron: Patron|undefined = undefined;
    console.log(patronResponse);
    const nameRegex = /Name\s*[:\-]?\s*(.*)/i;
    const descriptionRegex = /Description\s*[:\-]?\s*(.*)/i;
    //const attributesRegex = /Attributes\s*[:\-]?\s*(.*)/i;
    const personalityRegex = /Personality\s*[:\-]?\s*(.*)/i;
    const nameMatches = result.match(nameRegex);
    const descriptionMatches = result.match(descriptionRegex);
    //const attributesMatches = result.match(attributesRegex);
    const personalityMatches = result.match(personalityRegex);
    if (nameMatches && nameMatches.length > 1 && descriptionMatches && descriptionMatches.length > 1 && /*attributesMatches && attributesMatches.length > 1 &&*/ personalityMatches && personalityMatches.length > 1) {
        console.log(`${nameMatches[1].trim()}:${descriptionMatches[1].trim()}:${personalityMatches[1].trim()}`);
        newPatron = new Patron(nameMatches[1].trim(), descriptionMatches[1].trim(), /*attributesMatches[1].trim(),*/ personalityMatches[1].trim(), '');
        //  Generate a normal image, then image2image for happy and unhappy image.
        stage.patrons[newPatron.name] = newPatron;
    }

    return newPatron;
}

export async function generatePatronImage(patron: Patron, stage: Stage): Promise<string> {
    let imageUrl = await stage.makeImage({
        //image: bottleUrl,
        //strength: 0.1,
        prompt: `${stage.patronImagePrompt}, (art style notes: ${stage.artSummary}), (${patron.description}), (this is a character from this setting ${stage.settingSummary})`,
        negative_prompt: stage.patronImageNegativePrompt,
        aspect_ratio: AspectRatio.WIDESCREEN_VERTICAL, //.PHOTO_HORIZONTAL,
        remove_background: true
        //seed: null,
        //item_id: null,
    }, patronUrl);

    return Promise.resolve(imageUrl);
}
