import {AspectRatio, Character} from "@chub-ai/stages-ts";
import { Stage } from "./Stage";
import {Emotion, emotionPrompts, Patron} from "./Patron";
import bottleUrl from './assets/bottle.png'
import { Beverage } from "./Beverage";

const TRIM_SYMBOLS = '\\-*#';

export function buildSection(name: string, body: string) {
    return `###${name.toUpperCase()}: ${body.trim()}\n\n`;
}

export function buildDistillationPrompt(stage: Stage, baseCharacter: Character): string {
    return (
        buildSection('Flavor Text', stage.replaceTags((baseCharacter.personality + ' ' + baseCharacter.description + '\n' + baseCharacter.scenario), {user: stage.player.name, char: baseCharacter.name})) +
        buildSection('Example Responses', '\n' +
            `SOURCE: H.P. Lovecraft\nSETTING: A mysterious and eldritch 1930s Innsmouth, Massachusetts\nTHEMES: Mind control, insanity, gore, mysticism, body horror, Old Ones\nART: noir, high contrast, overly dark, gritty, hyperrealism, heavy shadows, 1930s fashion, wet\n` +
            `SOURCE: Robert E. Howard's Conan the Barbarian\nSETTING: Cimmeria, a dark fantasy, pre-Medieval wasteland rife with hardship, bloodlust, and sex\nTHEMES: barbarians, hedonism, violence, domination, rape, pillaging\nART: barbaric, dark fantasy, oil painting, visible brush strokes, vibrant colors, stark contrast, in the style of Frank Frazetta, hypersexualized, unrealistically muscular characters, busty women, skimpy clothing\n` +
            `SOURCE: Original\nSETTING: Quirky, fantastic re-imagining of modern Japanese countryside\nTHEMES: magical, fantasy modern, non-violence, exaggerated, silly, funny, friendship with unlikely creatures\nART: Studio Ghibli, bright, cheerful, anime, vibrant, sparkly, modern, quaint, painterly\n` +
            `SOURCE: Ridley Scott's Alien\nSETTING: Hard sci-fi, isolated space station where danger lurks around every corner\nTHEMES: Slow burn, danger, alien infestation, psychological terror, body horror\nART: Creepy, detailed, greebling, gross, hard science, realistic, organic, alien, hyperrealistic, grotesque, in the style of H. R. Geiger\n` +
            `SOURCE: Original\nSETTING: Mid-2000s college fall semester, Pacific Northwestern campus\nTHEMES: Friendships, lust, betrayal, homework, cheating, class rank, campus clubs\nART: splotchy watercolor, inks, soft tones, paper texture, pastel colors, ultra-fine linework\n` +
            `SOURCE: Mass Effect\nSETTING: Far future, the Citadel of the Mass Effect universe\nTHEMES: Space opera, friendship, trying times, relationships, impending apocalypse, Reaper invasion, extinction-level event\nART: Clean, crisp, 3D render, CGI, vibrant, pristine, cool tones, over-produced lens flares\n` +
            `SOURCE: Original\nSETTING: Underground 80s Mid-West biker bar\nTHEMES: turf war, drug running, machismo, brutality, sex and drugs, furries, anthropomorphic characters\nART: Comic book style illustrations, neon, chrome, bright colors, bulging muscles, furries, heavy inks for contrast, crosshatching\n` +
            `SOURCE: Original\nSETTING: 70s disco scene, Los Angeles\nTHEMES: Free love, vampires, lycanthropes, disco, secret fantasy underworld, clubs, maintaining secrecy\nART: Psychedelic, lurid colors, stylish, 70s clothing, interesting and exaggerated character proportions\n` +
            `SOURCE: Warhammer 40k\nSETTING: Massive Cathedral starship from the Warhammer 40k universe\nTHEMES: brutality, faith, devotion, heresy, power armor\nART: grimdark, high contrast, saturated yet gritty colors, heavy inks and shadows, strong characters, extreme technologies, power armor\n`) +
        buildSection('Priority Instruction',
            `You are doing prep work for a roleplaying narrative. Instead of narrating, you will first use this planning response to distill the setting and themes from the FLAVOR TEXT into a specific format. ` +
            `Use the FLAVOR TEXT as inspirational material as you establish a SOURCE, SETTING, THEMES, and ART style for future narration and illustration. ` +
            `This essential, preparatory response includes four specific and clearly defined fields, each containing a comma-delimited list of words or phrases that distill or embody the spirit of the FLAVOR TEXT.\n` +
            `"SOURCE" should identify the source material of FLAVOR TEXT, if any; leave this blank or 'Original' if FLAVOR TEXT is not derived from a known work.\n` +
            `"SETTING" should briefly summarize the overarching location, vibe, or time period derived from the FLAVOR TEXT, including any key deviations from setting expectations.\n` +
            `"THEMES" should list all of the prominent themes, concepts, quirks, or kinks from the FLAVOR TEXT.\n` +
            `"ART" should identify a target artist name, art style, genre, medium, palette, stroke, linework, or other style choices that are associated with SOURCE (if any) or which suit or align with the setting and themes of the FLAVOR TEXT; this will be used to generate appropriate images later.\n` +
            `Define these four fields and promptly end your response.\n`) +
        buildSection('Default Instruction', '{{suffix}}')).trim();
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
        buildSection('Default Instruction', '{{suffix}}')).trim();
}

export function buildAlcoholDescriptionsPrompt(stage: Stage): string {
    return (
        (stage.sourceSummary != '' ? buildSection('Source Material', stage.sourceSummary ?? '') : '') +
        buildSection('Setting', stage.settingSummary ?? '') +
        buildSection('Themes', stage.themeSummary ?? '') +
        buildSection('Location', `A description of the specific location of this setting: ${stage.barDescription}` ?? '') +
        buildSection('Example Responses', '\n' +
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
        buildSection('Overriding Instruction',
            `You are doing prep work for a roleplaying narrative. Instead of narrating, you will use this planning response to define a formatted list of beverages that the LOCATION might serve, ` +
            `providing a NAME and brief DESCRIPTION of each drink's appearance, bottle, odor, and flavor. ` +
            `Output several wildly varied and interesting beverages that suit the SETTING and LOCATION and evoke diverse and emotions, moods, or sensations. ` +
            `Format each into a single line with two properties defined on each line: a NAME field followed by a DESCRIPTION field. ` +
            `Use the EXAMPLE RESPONSES for strict formatting reference, but be original and creative with each of your entries, ` +
            `avoiding drinks which are too similar to previously generated content.`) +
        buildSection('Default Instruction', '{{suffix}}')).trim();
}

export function buildPatronPrompt(stage: Stage, baseCharacter: Character): string {
    const specific = baseCharacter.description != '' || baseCharacter.personality != '';
    return (
        (stage.sourceSummary != '' ? buildSection('Source Material', stage.sourceSummary ?? '') : '') +
        buildSection('Setting', stage.settingSummary ?? '') +
        buildSection('Themes', stage.themeSummary ?? '') +
        buildSection('Location', `A description of the specific location of this setting: ${stage.barDescription}` ?? '') +
        (specific ?
            buildSection('Input', stage.replaceTags(`\n${baseCharacter.name}\n\n${baseCharacter.description}\n\n${baseCharacter.personality}`, {user: stage.player.name, char: baseCharacter.name})) : '') +
        buildSection('Example Responses', '\n' +
            `NAME: Carolina Reaper\nTRAITS: Short, stacked, young woman, black trench coat over bright outfit, short red hair, green eyes, freckles.\nPERSONALITY: Carolina Reaper is a spicy-as-fuck death dealer. She's sassy and fun and takes pleasure in the pain of others.\n\n` +
            `NAME: Pwince Gwegowy\nTRAITS: gangly, tall, boyish man, bowl cut, blue eyes, regal outfit, pouty look.\nPERSONALITY: Pwince Gwegowy had his name legally changed to match his speech impediment so everyone would have to say it the same way. This is completely representative of his childish, petulant personality.\n\n` +
            `NAME: Liara T'Soni\nTRAITS: Asari woman, curvy, thin waist, blue skin, Asari head tentacles, futuristic white trench coat, innocent face.\nPERSONALITY: Once a naive--though prolific--Asari scientist, Liara has been hardened by her experiences combating the Reapers and is the current Shadow Broker.\n\n` +
            (specific ? '' : Object.values(stage.dummyPatrons).map(patron => `NAME: ${patron.name}\nTRAITS: ${patron.description}\nPERSONALITY: ${patron.personality}`).join('\n\n'))) +
        (Object.values(stage.patrons).length > 0 ?
            buildSection('Established Patrons', Object.values(stage.patrons).map(patron => `NAME: ${patron.name}\nTRAITS: ${patron.description}\nPERSONALITY: ${patron.personality}`).join('\n\n')) : '') +
        buildSection('Overriding Instruction',
            `You are doing prep work for a roleplaying narrative. Instead of narrating, use this planning response to study the ` + (specific ?
                `INPUT above and condense it into formatted output that describes this character as they will patronize the LOCATION. ` :
                `SETTING above and generate a distinct, creative, and interesting character that might patronize the LOCATION. `) +
            `You must specify the character's NAME, a TRAITS list of comma-delimited physical and visual attributes or booru tags, and a paragraph about their PERSONALITY: background, habits, ticks, style, and motivation (if any) for visiting the bar. ` +
            `Consider other ESTABLISHED PATRONS (if any) and ensure that the new character in your response is distinct from these. Potentially define ` +
            `connections between this new character and one or more ESTABLISHED PATRONS patrons. ` +
            `See the EXAMPLE RESPONSES for strict formatting reference` + (specific ? '.' : `, but craft something new and unexpected for this creation.`)) +
        buildSection('Default Instruction', '{{suffix}}')).trim();
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
                console.log(`${nameMatch ? trimSymbols(nameMatch[1], TRIM_SYMBOLS).trim() : ''}, ${descriptionMatch ? trimSymbols(descriptionMatch[1], TRIM_SYMBOLS).trim() : ''}`);
                return new Beverage(nameMatch ? trimSymbols(nameMatch[1], TRIM_SYMBOLS).trim() : '', descriptionMatch ? trimSymbols(descriptionMatch[1], TRIM_SYMBOLS).trim() : '', '');
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
        prompt: `(art style: ${stage.artSummary}), head-on, centered, empty background, negative space, garish color-keyed background, (a lone bottle of this beverage: ${beverage.description})`,
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
            prompt: buildDistillationPrompt(stage, stage.characterForGeneration),
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
        stage.setLoadProgress(1, 'Distilling card.');
        await generateDistillation(stage);

        stage.setLoadProgress(5, 'Generating bar description.');
        let textResponse = await stage.generator.textGen({
            prompt: buildBarDescriptionPrompt(stage),
            max_tokens: 100,
            min_tokens: 50
        });
        console.log(`Bar description: ${textResponse?.result}`);

        stage.barDescription = textResponse?.result ?? '';

        stage.setLoadProgress(10, 'Generating bar image.');
        const barPrompt = `(art style: ${stage.artSummary}), ` +
            (stage.sourceSummary && stage.sourceSummary != '' ? `(source material: ${stage.sourceSummary}), ` : '') + '((interior of an empty bar)), (dark outside), counter, ' +
            `(general setting: ${stage.settingSummary})`;//, ((${stage.barDescription}))`;

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
        stage.themeSummary = undefined;
    }

    await stage.messenger.updateChatState(stage.buildChatState());
    stage.setLoadProgress(undefined, '');
    stage.isGenerating = false;
    // TODO: If there was a failure, consider reloading from chatState rather than saving.
}

const basicCharacter: Character = {
    name: 'spare',
    description: '',
    first_message: '',
    example_dialogs: '',
    personality: "",
    scenario: "",
    tavern_personality: "",
    system_prompt: null,
    post_history_instructions: null,
    alternate_greetings: [],
    partial_extensions: {},
    anonymizedId: "",
    isRemoved: false
}

export async function generatePatrons(stage: Stage) {
    const characters: Character[] = [...Object.values(stage.characters), {...basicCharacter, name: 'spare'}, {...basicCharacter, name: 'another'}, {...basicCharacter, name: 'more'}];
    if (stage.dummyPatrons.length == 0) {
        // Build some dummy patrons to throw away the LLM's most generic ideas, and then use them as examples for better ideas.
        console.log(`Generating a dummy patron.`);
        let tries = 5;
        while (stage.dummyPatrons.length < 3 && tries-- >= 0) {
            let patron = await generatePatron(stage, {...basicCharacter, name: 'something'});
            if (patron) {
                console.log('Generated dummy patron:');
                console.log(patron);
                stage.dummyPatrons.push(patron);
            } else {
                console.log('Failed a dummy patron generation');
            }
        }
    }

    for (let character of characters) {
        if (!Object.keys(stage.patrons).includes(character.name)) {
            console.log(`Generating a patron for ${character.name}.`);
            let tries = 3;
            while (!Object.keys(stage.patrons).includes(character.name) && tries-- >= 0) {
                let patron = await generatePatron(stage, character);
                if (patron) {
                    console.log('Generated patron:');
                    console.log(patron);
                    stage.patrons[character.name] = patron;
                    generatePatronImage(stage, patron, Emotion.neutral);
                } else {
                    console.log('Failed a patron generation');
                }
            }
        }
    }
}

function trimSymbols(str: string, symbol: string): string { const regex = new RegExp(`^[${symbol}]+|[${symbol}]+$`, 'g'); return str.replace(regex, ''); }


export async function generatePatron(stage: Stage, baseCharacter: Character): Promise<Patron|undefined> {
    let patronResponse = await stage.generator.textGen({
        prompt: buildPatronPrompt(stage, baseCharacter),
        max_tokens: 200,
        min_tokens: 50
    });
    let result = patronResponse?.result ?? '';
    let newPatron: Patron|undefined = undefined;
    console.log(patronResponse);
    const nameRegex = /Name\s*[:\-]?\s*(.*)/i;
    const descriptionRegex = /Traits\s*[:\-]?\s*(.*)/i;
    const personalityRegex = /Personality\s*[:\-]?\s*(.*)/i;
    const nameMatches = result.match(nameRegex);
    const descriptionMatches = result.match(descriptionRegex);
    const personalityMatches = result.match(personalityRegex);
    if (nameMatches && nameMatches.length > 1 && nameMatches[1].length < 100 && descriptionMatches && descriptionMatches.length > 1 && personalityMatches && personalityMatches.length > 1) {
        console.log(`${nameMatches[1].trim()}:${descriptionMatches[1].trim()}:${personalityMatches[1].trim()}`);
        newPatron = new Patron(trimSymbols(nameMatches[1], TRIM_SYMBOLS).trim(), trimSymbols(descriptionMatches[1], TRIM_SYMBOLS).trim(), trimSymbols(personalityMatches[1], TRIM_SYMBOLS).trim());
    }

    return newPatron;
}

const patronImagePrompt: string = '(garish empty background color), standing, full body';
const patronImageNegativePrompt: string = 'border, ((close-up)), background elements, special effects, matching background, amateur, low quality, action, cut-off';

export async function generatePatronImage(stage: Stage, patron: Patron, emotion: Emotion): Promise<void> {

    if (emotion == Emotion.neutral) {
        const imageUrl = await stage.makeImage({
            prompt: (stage.sourceSummary && stage.sourceSummary != '' ? `(${patron.name} from ${stage.sourceSummary}), ` : '') + `(art style: ${stage.artSummary}), ${patronImagePrompt}, ${emotionPrompts[emotion]}, (${patron.description})`,
            negative_prompt: patronImageNegativePrompt,
            aspect_ratio: AspectRatio.CINEMATIC_VERTICAL,
            remove_background: true
        }, '');
        if (imageUrl == '') {
            throw Error(`Failed to generate a ${emotion} patron image for ${patron.name}.`);
        } else {
            // Replace all existing emotion images with this one
            for (let otherEmotion of Object.values(Emotion)) {
                patron.imageUrls[otherEmotion] = imageUrl;
            }
        }
    } else {
        console.log(`Generate ${emotion} image for ${patron.name}.`)
        const imageUrl = await stage.makeImageFromImage({
            image: patron.imageUrls[Emotion.neutral],
            prompt: (stage.sourceSummary && stage.sourceSummary != '' ? `(${patron.name} from ${stage.sourceSummary}), ` : '') + `(art style: ${stage.artSummary}), ${patronImagePrompt}, ${emotionPrompts[emotion]}, (${patron.description})`,
            negative_prompt: patronImageNegativePrompt,
            aspect_ratio: AspectRatio.CINEMATIC_VERTICAL,

            remove_background: true,
            strength: 0.5
        }, patron.imageUrls[Emotion.neutral]);
        if (imageUrl == '') {
            throw Error(`Failed to generate a ${emotion} patron image for ${patron.name}.`);
        } else {
            patron.imageUrls[emotion] = imageUrl;
        }
    }

    /*await stage.inpaintImage({
        image: patron.imageNeutral,
        prompt: 'Happy, smiling',
        mask: 'face',
        transferType: 'face',
        strength: 0.8
    }, patron.imageNeutral);*/
}
