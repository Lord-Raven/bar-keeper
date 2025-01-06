import {AspectRatio, Character} from "@chub-ai/stages-ts";
import { Stage } from "./Stage";
import { Patron } from "./Patron";
import bottleUrl from './assets/bottle.png'
import { Beverage } from "./Beverage";


export function buildSection(name: string, body: string) {
    return `###${name.toUpperCase()}: ${body.trim()}\n\n`;
}

export function buildDistillationPrompt(description: string): string {
    return (
        buildSection('Flavor Text', description) +
        buildSection('Priority Instruction', 
            `The FLAVOR TEXT is merely inspirational material that you will use to establish a SOURCE, SETTING, THEMES, and ART style for upcoming narration and illustration. ` +
            `This initial response includes four specific and clearly defined fields, each containing a comma-delimited list of words or phrases that distill or embody the spirit of the FLAVOR TEXT.\n` +
            `"SOURCE" should name the source material of FLAVOR TEXT, if any; leave this blank or 'Original' if FLAVOR TEXT is not derived from a known work.\n` +
            `"SETTING" should briefly summarize the overarching location, vibe, or time period derived from the FLAVOR TEXT, including any key deviations from setting expectations.\n` +
            `"THEMES" should list all of the prominent themes, concepts, quirks, or kinks from the FLAVOR TEXT.\n` +
            `"ART" should identify a target artist name, art style, art genre, medium, palette, stroke, linework, or other style choices that suit or align with the setting and themes of the FLAVOR TEXT; this will be used to generate appropriate images later.\n` +
            `Define these four fields and promptly end your response.\n`) +
        buildSection('Example Responses', 
            `"SOURCE: H.P. Lovecraft\nSETTING: A mysterious and eldritch 1930s Innsmouth, Massachusetts\nTHEMES: Mind control, insanity, gore, mysticism, body horror, Old Ones\nART: noir, high contrast, overly dark, gritty, hyperrealism, heavy shadows, 1930s fashion, wet"\n` +
            `"SOURCE: Robert E. Howard's Conan the Barbarian\nSETTING: Cimmeria, a dark fantasy, pre-Medieval wasteland rife with hardship, bloodlust, and sex\nTHEMES: barbarians, hedonism, violence, domination, rape, pillaging\nART: barbaric, dark fantasy, oil painting, visible brush strokes, vibrant colors, stark contrast, in the style of Frank Frazetta, hypersexualized, unrealistically muscular characters, busty women, skimpy clothing"\n` +
            `"SOURCE: Original\nSETTING: Quirky, fantastic re-imagining of modern Japanese countryside\nTHEMES: magical, fantasy modern, non-violence, exaggerated, silly, funny, friendship with unlikely creatures\nART: Studio Ghibli, bright, cheerful, anime, vibrant, sparkly, modern, quaint, painterly"\n` +
            `"SOURCE: Ridley Scott's Alien\nSETTING: Hard sci-fi, isolated space station where danger lurks around every corner\nTHEMES: Slow burn, danger, alien infestation, psychological terror, body horror\nART: Creepy, detailed, greebling, gross, hard science, realistic, organic, alien, hyperrealistic, grotesque, in the style of H. R. Geiger"\n` +
            `"SOURCE: Original\nSETTING: Mid-2000s college fall semester, Pacific Northwestern campus\nTHEMES: Friendships, lust, betrayal, homework, cheating, class rank, campus clubs\nART: splotchy watercolor, inks, soft tones, paper texture, pastel colors, ultra-fine linework"\n` +
            `"SOURCE: Mass Effect\nSETTING: Far future, the Citadel of the Mass Effect universe\nTHEMES: Space opera, friendship, trying times, relationships, impending apocalypse, Reaper invasion, extinction-level event\nART: Clean, crisp, 3D render, CGI, vibrant, pristine, cool tones, over-produced lens flares"\n` +
            `"SOURCE: Original\nSETTING: Underground 80s Mid-West biker bar\nTHEMES: turf war, drug running, machismo, brutality, sex and drugs, furries, anthropomorphic characters\nART: Comic book style illustrations, neon, chrome, bright colors, bulging muscles, furries, heavy inks for contrast, crosshatching"\n` +
            `"SOURCE: Original\nSETTING: 70s disco scene, Los Angeles\nTHEMES: Free love, vampires, lycanthropes, disco, secret fantasy underworld, clubs, maintaining secrecy\nART: Psychedelic, lurid colors, stylish, 70s clothing, interesting and exaggerated character proportions"\n` +
            `"SOURCE: Warhammer 40k\nSETTING: Massive Cathedral starship from the Warhammer 40k universe\nTHEMES: brutality, faith, devotion, heresy, power armor\nART: grimdark, high contrast, saturated yet gritty colors, heavy inks and shadows, strong characters, extreme technologies, power armor"\n`) +
        buildSection('Standard Instruction', '{{suffix}}')).trim();
}

export function buildBarDescriptionPrompt(stage: Stage): string {
    return (
        (stage.sourceSummary != '' ? buildSection('Source Material', stage.sourceSummary ?? '') : '') +
        buildSection('Setting', stage.settingSummary ?? '') +
        buildSection('Themes', stage.themeSummary ?? '') +
        buildSection('Priority Instruction', 
            'You are doing prep work for a roleplaying narrative. Instead of narrating, you will use this planning response to write a few sentences describing a fictional pub, bar, club, or tavern set in SETTING, drawing upon the THEMES. ' +
            'This descriptive paragraph should focus on the interior description, ambience, theming, fixtures, and general clientele of the establishment. ' +
            'This informative and flavorful description will later be used in future, narrative responses.\n') +
        buildSection('Standard Instruction', '{{suffix}}')).trim();
}

export function buildAlcoholDescriptionsPrompt(stage: Stage): string {
    return (
        (stage.sourceSummary != '' ? buildSection('Source Material', stage.sourceSummary ?? '') : '') +
        buildSection('Setting', stage.settingSummary ?? '') +
        buildSection('Themes', stage.themeSummary ?? '') +
        buildSection('Location', stage.barDescription ?? '') +
        buildSection('Example Responses',
            `NAME: Cherry Rotgut DESCRIPTION: A viscous, blood-red liqueur in a garishly bright bottle--tastes like cough syrup.\n` +
            `NAME: Tritium Delight DESCRIPTION: An impossibly fluorescent liquor; the tinted glass of the bottle does nothing to shield the eyes. Tastes like artificial sweetener on crack.\n` +
            `NAME: Rosewood Ale DESCRIPTION: This nutty, mellow ale comes in an elegant bottle embossed with the Eldridge Brewery logo.\n` +
            `NAME: Toilet Wine DESCRIPTION: An old bleach jug of questionably-sourced-but-unquestionably-alcoholic red 'wine.'\n` +
            `NAME: Love Potion #69 DESCRIPTION: It's fuzzy, bubbly, and guaranteed to polish your drunk goggles.\n` +
            `NAME: Classic Grog DESCRIPTION: Cheap rum cut with water and lime juice until it barely tastes like anything, served in a sandy bottle.\n` +
            `NAME: Synth Mead DESCRIPTION: Bees died out long ago, but hypervikings still live for the sweet taste of synthetic honey wine.\n` +
            `NAME: Super Hazy Imperial Double IPA DESCRIPTION: More IBUs than anyone's ever cared for. The bottle's plastered with cute bullshit about the local microbrewery that produced it.\n` +
            `NAME: USB Port DESCRIPTION: Alcohol for wannabe techbros. Not legally a 'port' because of international protections surrounding the term.\n` +
            `NAME: Swamp Brew DESCRIPTION: This greenish-brown ale is served in makeshift cups fashioned from skulls, with a frothy head that never settles and a flavor profile dominated by algae and muddy undertones.\n`) +
        stage.buildBeverageDescriptions() +
        buildSection('Priority Instruction', 
            `You are doing prep work for a roleplaying narrative. Instead of narrating, this preparatory response firsts lists out several types of alcohol that the LOCATION might serve, ` +
            `providing a NAME and brief DESCRIPTION of each drink's appearance, bottle, odor, and flavor. ` +
            `Output several wildly varied and interesting beverages that suit the SETTING and LOCATION, yet evoke different moods or sensations. ` +
            `Format each into a single line with two properties defined on each line: a NAME field followed by a DESCRIPTION field. ` +
            `Use the EXAMPLE RESPONSES for strict formatting reference, but be original and creative with each of your entries`) +
        buildSection('Standard Instruction', '{{suffix}}')).trim();
}

export function buildPatronPrompt(stage: Stage, baseCharacter: Character): string {
    return (
        (stage.sourceSummary != '' ? buildSection('Source Material', stage.sourceSummary ?? '') : '') +
        buildSection('Setting', stage.settingSummary ?? '') +
        buildSection('Themes', stage.themeSummary ?? '') +
        buildSection('Location', stage.barDescription ?? '') +
        buildSection('Character', stage.replaceTags(`${baseCharacter.description}\n${baseCharacter.personality}`, {user: stage.player.name, char: baseCharacter.name})) +
        buildSection('Priority Instruction',
            `You are doing prep work for a roleplay. Instead of narrating, this preparatory response will look at the CHARACTER section and distill it into sections that describe a patron of the LOCATION, ` +
            `defining a NAME, a DESCRIPTION list of discrete physical and visual traits, and a paragraph about their PERSONALITY: background, habits, and ticks, style, and motivation (if any) for visiting the bar. ` +
            (Object.values(stage.patrons).length > 0 ?
                (`Consider the following existing patrons and ensure that the new character in your response is distinct from the existing ones below. Also consider ` +
                `connections between this new character and one or more existing patrons:\n` +
                `${Object.values(stage.patrons).map(patron => `${patron.name} - ${patron.description}\n${patron.personality}`).join('\n\n')}\n`) :
                '\n')) +
        buildSection('Example Responses', `NAME: Character Name\nDESCRIPTION: A comma-delimited list of exhaustive physical and visual qualities or booru tags, including gender, race, skin tone, hair color/style, eye color, build, clothing, accessories, and other visually defining traits.\nPERSONALITY: In depth personality and background details.`) +
        buildSection('Standard Instruction', '{{suffix}}')).trim();
}

export async function generateBeverages(stage: Stage) {
    stage.beverages = [];
    while (stage.beverages.length < 5) {
        let alcoholResponse = await stage.generator.textGen({
            prompt: buildAlcoholDescriptionsPrompt(stage),
            max_tokens: 300,
            min_tokens: 50
        });

        console.log(alcoholResponse?.result);
        stage.beverages.push(...(alcoholResponse?.result ?? '').split(new RegExp('NAME:', 'i'))
            .map(item => {
                const nameMatch = item.match(/\s*(.*?)\s*Description:/i);
                const descriptionMatch = item.match(/Description:\s*(.*)/i);
                console.log(`${nameMatch ? nameMatch[1].trim() : ''}, ${descriptionMatch ? descriptionMatch[1].trim() : ''}`);
                return new Beverage(nameMatch ? nameMatch[1].trim() : '', descriptionMatch ? descriptionMatch[1].trim() : '', '');
            }).filter(beverage => beverage.name != '' && beverage.description != '' && stage.beverages.filter(existing => existing.name.toLowerCase() == beverage.name.toLowerCase()).length == 0));
    }

    if (stage.beverages.length < 5) {
        throw Error('Failed to generate sufficient beverages.');
    } else {
        stage.beverages = stage.beverages.slice(0, 5);
    }

    stage.setLoadProgress(30, 'Generating beverage images.');

    for (const beverage of stage.beverages) {
        await generateBeverageImage(stage, beverage);
        stage.setLoadProgress((stage.loadingProgress ?? 0) + 5, 'Generating beverage images.');
    }
}

export async function generateBeverageImage(stage: Stage, beverage: Beverage) {
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
            max_tokens: 100,
            min_tokens: 50
        });
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
        stage.currentNode = null;
        stage.chatNodes = {};
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
        const barPrompt = `(art style: ${stage.artSummary}), ` +
            (stage.sourceSummary && stage.sourceSummary != '' ? `(source material: ${stage.sourceSummary}), ` : '') + 'evening, counter, bottles, ' +
            `(general setting: ${stage.settingSummary}), (inside a bar), ((interior of a bar with this description: ${stage.barDescription}))`;

        stage.barImageUrl = await stage.makeImage({
            prompt: barPrompt,
            negative_prompt: '((exterior)), (people), (outside), daytime, outdoors',
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
        stage.setLoadProgress((stage.loadingProgress ?? 0) + 5, 'Generating patrons.');
        await generatePatrons(stage);

        // Finally, display an intro
        stage.currentNode = null;
        stage.setLoadProgress(95, 'Writing intro.');
        await stage.advanceMessage()
        stage.setLoadProgress(undefined, 'Complete');
    } catch (e) {
        console.log(e);
    }

    console.log(`save background: ${stage.barImageUrl}`);
    await stage.messenger.updateChatState(stage.buildChatState());
    stage.setLoadProgress(undefined, '');

    // TODO: If there was a failure, consider reloading from chatState rather than saving.
}

export async function generatePatrons(stage: Stage) {
    for (let character of Object.values(stage.characters)) {
        if (!Object.keys(stage.patrons).includes(character.name)) {
            console.log(`Generating a patron for ${character.name}.`);
            let tries = 3;
            while (!Object.keys(stage.patrons).includes(character.name) && tries-- >= 0) {
                let patron = await generatePatron(stage, character);
                if (patron) {
                    console.log('Generated patron:');
                    console.log(patron);
                    stage.patrons[character.name] = patron;
                    generatePatronImage(stage, patron);
                } else {
                    console.log('Failed a patron generation');
                }
            }
        }
    }
}

export async function generatePatron(stage: Stage, baseCharacter: Character): Promise<Patron|undefined> {
    let patronResponse = await stage.generator.textGen({
        prompt: buildPatronPrompt(stage, baseCharacter),
        max_tokens: 300,
        min_tokens: 50
    });
    let result = patronResponse?.result ?? '';
    let newPatron: Patron|undefined = undefined;
    console.log(patronResponse);
    const nameRegex = /Name\s*[:\-]?\s*(.*)/i;
    const descriptionRegex = /Description\s*[:\-]?\s*(.*)/i;
    const attributesRegex = /Attributes\s*[:\-]?\s*(.*)/i;
    const personalityRegex = /Personality\s*[:\-]?\s*(.*)/i;
    const nameMatches = result.match(nameRegex);
    const descriptionMatches = result.match(descriptionRegex);
    //const attributesMatches = result.match(attributesRegex);
    const personalityMatches = result.match(personalityRegex);
    if (nameMatches && nameMatches.length > 1 && descriptionMatches && descriptionMatches.length > 1 && /*attributesMatches && attributesMatches.length > 1 &&*/ personalityMatches && personalityMatches.length > 1) {
        console.log(`${nameMatches[1].trim()}:${descriptionMatches[1].trim()}:${personalityMatches[1].trim()}`);
        newPatron = new Patron(nameMatches[1].trim(), descriptionMatches[1].trim(), /*attributesMatches[1].trim(),*/ personalityMatches[1].trim(), '');
        stage.patrons[newPatron.name] = newPatron;
    }

    return newPatron;
}

const patronImagePrompt: string = 'calm expression, (contrasting empty background color), standing';
const patronImageNegativePrompt: string = 'border, ((close-up)), background elements, special effects, matching background, amateur, low quality, action, cut-off';

export async function generatePatronImage(stage: Stage, patron: Patron): Promise<void> {
    patron.imageUrl = await stage.makeImage({
        //image: bottleUrl,
        //strength: 0.1,
        prompt: (stage.sourceSummary && stage.sourceSummary != '' ? `(source material: ${stage.sourceSummary}), ` : '') + `(art style: ${stage.artSummary}), ${patronImagePrompt}, (${patron.description})`,
        negative_prompt: patronImageNegativePrompt,
        aspect_ratio: AspectRatio.CINEMATIC_VERTICAL, //.WIDESCREEN_VERTICAL,
        remove_background: true
        //seed: null,
        //item_id: null,
    }, '');

    if (patron.imageUrl == '') {
        throw Error('Failed to generate a patron image');
    }
}
