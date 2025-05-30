import {AspectRatio, Character} from "@chub-ai/stages-ts";
import { Stage } from "./Stage";
import {Emotion, emotionPrompts, nameCheck, Patron} from "./Patron";
import bottleUrl from './assets/bottle.png'
import silhouetteUrl from './assets/silhouette.png'
import { Beverage } from "./Beverage";

export const TRIM_SYMBOLS = '\\-*#';
export const MAX_NAME_LENGTH = 30;

export function buildSection(name: string, body: string) {
    return `###${name.toUpperCase()}:\n${body.trim()}\n\n`;
}

// A lot from the WTF list, but quite a bit not. Still, here's some credit: https://rentry.co/25d5p
// Notably, this list does contain a handful of appearance words because it is not being used exclusively for personality determination.
const messOTraits = [
    'Abusive', 'Activistic', 'Adventurous', 'Adorable', 'Affable', 'Affectionate', 'Aggrieved', 'Alert', 'Alpha', 'Amorous', 'Amusing',
    'Analytical', 'Androgynous', 'Angelic', 'Annoying', 'Antisocial', 'Argumentative', 'Artful', 'Artsy', 'Assertive', 'Athletic', 'Authentic', 'Awesome',
    'Balanced', 'Benevolent', 'Beta', 'Blustery', 'Bold', 'Boorish', 'Brash', 'Bratty', 'Brave', 'Breezy', 'Bright', 'Brilliant', 'Buff', 'Businesslike', 'Bullying',
    'Calculating', 'Calm', 'Capable', 'Capricious', 'Captivating', 'Careful', 'Careless', 'Caring', 'Challenging', 'Charming', 'Chauvinistic', 'Cheerful', 'Cheesy', 'Chunky', 'Circumspect', 'Classist', 'Clean', 'Clever', 'Clueless', 'Clumsy',
    'Combative', 'Commanding', 'Compassionate', 'Compulsive', 'Conciliatory', 'Condescending', 'Confident', 'Conservative', 'Considerate', 'Constructive', 'Convincing', 'Cool', 'Corporate', 'Corrupting', 'Courteous',
    'Crass', 'Craven', 'Crazed', 'Creative', 'Creepy', 'Crotchety', 'Cultured', 'Curious',
    'Daring', 'Dark', 'Dashing', 'Debonair', 'Deceptive', 'Decisive', 'Demure', 'Dependable', 'Depraved', 'Determined',
    'Dignified', 'Diligent', 'Diplomatic', 'Disciplined', 'Discreet', 'Distrusting', 'Dogmatic', 'Dour', 'Dramatic', 'Dreamer', 'Driven', 'Drunken', 'Dry', 'Dutiful',
    'Earnest', 'Earthy', 'Easygoing', 'Ebullient', 'Eccentric', 'Educated', 'Eerie', 'Effeminate', 'Efficient', 'Elegant', 'Eloquent', 'Emotional', 'Empathetic',
    'Encouraging', 'Endowed', 'Energetic', 'Enigmatic', 'Enthusiastic', 'Epic', 'Ethical', 'Excitable', 'Expressive', 'Extroverted',
    'Fair', 'Faithful', 'Faithless', 'Famed', 'Fancy', 'Fashionable', 'Fastidious', 'Fast-talking', 'Feminine', 'Fickle', 'Fiery', 'Filthy',
    'Flexible', 'Flowery', 'Focused', 'Folksy', 'Foolish', 'Forceful', 'Formal', 'Frail', 'Freewheeling', 'Friendly', 'Frigid', 'Frugal', 'Frumpy', 'Funny',
    'Gallant', 'Garish', 'Generous', 'Gentle', 'Genuine', 'Gifted', 'Glamorous', 'Gluttonous', 'Goofy', 'Gorgeous', 'Gothic', 'Graceful', 'Gracious', 'Gregarious', 'Grotesque', 'Grouchy', 'Guarded', 'Guilty',
    'Happy', 'Hardened', 'Hardworking', 'Hateful', 'Haunted', 'Haunting', 'Heavenly', 'Heinous', 'Helpful', 'Heroic', 'Hip', 'Homey', 'Honest', 'Honorable', 'Hopeful', 'Horny', 'Hulking', 'Humble', 'Hyped', 'Hysterical',
    'Icy', 'Idealistic', 'Idiosyncratic', 'Ignoble', 'Imaginative', 'Immature', 'Immodest', 'Immoral', 'Imperious',
    'Inane', 'Inappropriate', 'Incompetent', 'Independent', 'Individualistic', 'Innocent', 'Insane', 'Insecure', 'Insightful', 'Inspiring', 'Introverted', 'Inventive', 'Ironic', 'Irritable',
    'Jealous', 'Jolly', 'Judgmental', 'Jumpy', 'Kind', 'Klutzy',
    'Lachrymose', 'Lanky', 'Lascivious', 'Leaderly', 'Leisurely', 'Liberal', 'Logical', 'Lonely', 'Looming', 'Lovable', 'Loving', 'Loyal', 'Lucky', 'Lush', 'Lyrical',
    'Machiavellian', 'Macho', 'Magnanimous', 'Maladroit', 'Masculine', 'Mature', 'Maudlin', 'Mellow', 'Melodramatic', 'Menacing', 'Mercurial', 'Meticulous',
    'Mindful', 'Mischievous', 'Miserable', 'Miserly', 'Moderate', 'Modest', 'Moody', 'Morbid', 'Musical', 'Mystical',
    'Naive', 'Narcissistic', 'Nasty', 'Naughty', 'Needy', 'Nerdy', 'Nervous', 'Noble', 'Nomadic', 'Nonviolent', 'Nosey', 'Nurturing',
    'Oafish', 'Obedient', 'Oblivious', 'Obnoxious', 'Observant', 'Obsessive', 'Oily', 'Old-fashioned', 'Open-minded', 'Opportunistic', 'Optimistic', 'Opulent', 'Organized', 'Outdoorsy', 'Outgoing', 'Outspoken',
    'Paranoid', 'Passionate', 'Patient', 'Patriotic', 'Peaceful', 'Peevish', 'Perceptive', 'Perfect', 'Persistent', 'Persuasive', 'Petite', 'Petty', 'Picky', 'Placid', 'Playful', 'Polite', 'Poor', 'Positive', 'Pragmatic',
    'Precise', 'Principled', 'Private', 'Productive', 'Profound', 'Progressive', 'Promiscuous', 'Protective', 'Proud', 'Prude', 'Prudent', 'Pudgy', 'Puny', 'Pure', 'Puritanical',
    'Quiet', 'Quirky',
    'Radical', 'Ragged', 'Rakish', 'Raving', 'Reasonable', 'Reliable', 'Religious', 'Reserved', 'Resilient', 'Resourceful', 'Retro', 'Reverential', 'Rich', 'Ritualistic', 'Romantic', 'Rotund', 'Rough', 'Rowdy', 'Rude', 'Rustic',
    'Sanctimonious', 'Sappy', 'Sarcastic', 'Sassy', 'Scandalous', 'Scholarly', 'Scrupulous', 'Selfless', 'Sensitive', 'Sensual', 'Sentimental', 'Serious', 'Severe', 'Sexy', 'Short', 'Shrewd',
    'Sickly', 'Silly', 'Simpering', 'Simple', 'Sincere', 'Sing-songy', 'Skeptical', 'Sleepy', 'Slender', 'Slimy', 'Slinky', 'Smarmy', 'Smoky', 'Sniveling', 'Sociable', 'Soft-spoken', 'Solemn',
    'Spiritual', 'Spoiled', 'Spontaneous', 'Spry', 'Steadfast', 'Steely', 'Stocky', 'Stoic', 'Studious', 'Stuffy', 'Stylish', 'Suave', 'Subtle', 'Suspicious', 'Svelte', 'Sweet', 'Sympathetic',
    'Talented', 'Talkative', 'Tall', 'Teacherly', 'Thorough', 'Thoughtful', 'Thrifty', 'Tidy', 'Timid', 'Tolerant', 'Tough', 'Transparent', 'Trendy', 'Troubled', 'Trusting', 'Trustworthy',
    'Uninhibited', 'Unkempt', 'Urbane', 'Vain', 'Vapid', 'Vegan', 'Vengeful', 'Versatile', 'Vivacious', 'Vocal', 'Warm', 'Wealthy', 'Whimsical', 'Wholesome', 'Wimpy', 'Winning', 'Wiry', 'Wise', 'Withholding', 'Witty', 'Zany', 'Zealous']

// Replace trigger words with less triggering words, so image gen can succeed.
export function substitute(input: string) {
    const synonyms: {[key: string]: string} = {
        'old-school': 'retro',
        'old school': 'retro',
        'oldschool': 'retro',
        'youngster': 'individual',
        'child': 'individual',
        'kid': 'individual'
    }
    const regex = new RegExp(Object.keys(synonyms).join('|'), 'gi');

    return input.replace(regex, (match) => {
        const synonym = synonyms[match.toLowerCase()];
        return match[0] === match[0].toUpperCase()
            ? synonym.charAt(0).toUpperCase() + synonym.slice(1)
            : synonym;
    });
}

export function buildDistillationPrompt(stage: Stage, baseCharacter: Character): string {
    return (
        buildSection('Flavor Text', stage.replaceTags((baseCharacter.personality + ' ' + baseCharacter.description + '\n' + baseCharacter.scenario), {user: stage.player.name, char: baseCharacter.name})) +
        buildSection('Example Responses', '\n' +
            `SOURCE: H.P. Lovecraft\nSETTING: A mysterious and eldritch 1930s Innsmouth, Massachusetts\nTHEMES: Mind control, insanity, gore, mysticism, body horror, Old Ones\nART: noir, high contrast, overly dark, gritty, hyperrealism, heavy shadows, 1930s fashion, wet\n\n` +
            `SOURCE: Robert E. Howard's Conan the Barbarian\nSETTING: Cimmeria, a dark fantasy, pre-Medieval wasteland rife with hardship, bloodlust, and sex\nTHEMES: barbarians, hedonism, violence, domination, rape, pillaging\nART: dark fantasy oil painting, thick brush strokes, vibrant colors and stark contrast, in the style of Frank Frazetta, hypersexualized, unrealistically muscular characters, skimpy clothing\n\n` +
            `SOURCE: Original\nSETTING: Quirky, fantastic re-imagining of modern Japanese countryside\nTHEMES: magical, fantasy modern, non-violence, exaggerated, silly, funny, friendship with unlikely creatures\nART: Studio Ghibli, bright, cheerful, anime, vibrant, sparkly, modern, quaint, painterly\n\n` +
            `SOURCE: Ridley Scott's Alien\nSETTING: Hard sci-fi, isolated space station where danger lurks around every corner\nTHEMES: Slow burn, danger, alien infestation, psychological terror, body horror\nART: Creepy, greebling, hard science, messy copic marker, concept art, disturbingly organic, alien, hyperrealistic, grotesque, in the style of H. R. Geiger\n\n` +
            `SOURCE: Original\nSETTING: Mid-2000s college fall semester, Pacific Northwestern campus\nTHEMES: Friendships, lust, betrayal, homework, cheating, class rank, campus clubs\nART: splotchy watercolor, inks, soft tones, paper texture, pastel colors, ultra-fine linework\n\n` +
            `SOURCE: Mass Effect\nSETTING: Far future, the Citadel of the Mass Effect universe\nTHEMES: Space opera, friendship, trying times, relationships, impending apocalypse, Reaper invasion, extinction-level event\nART: Clean, crisp, 3D render, CGI, vibrant, pristine, cool tones, over-produced lens flares\n\n` +
            `SOURCE: Original\nSETTING: Underground 80s Mid-West biker bar\nTHEMES: turf war, drug running, machismo, brutality, sex and drugs, furries, anthropomorphic characters\nART: Comic book style illustrations, neon, chrome, bright colors, bulging muscles, furries, heavy inks for contrast, crosshatching\n\n` +
            `SOURCE: Original\nSETTING: 70s disco scene, Los Angeles\nTHEMES: Free love, vampires, lycanthropes, disco, secret fantasy underworld, clubs, maintaining secrecy\nART: Psychedelic, lurid colors, stylish, 70s clothing, interesting and exaggerated character proportions\n\n` +
            `SOURCE: Warhammer 40k\nSETTING: Massive Cathedral starship from the Warhammer 40k universe\nTHEMES: brutality, faith, devotion, heresy, power armor\nART: grimdark, high contrast, saturated yet gritty colors, heavy inks and shadows, brutalism, extreme technologies, power armor\n\n`) +
        buildSection('Current Instruction',
            `You are doing critical prep work for a roleplaying narrative. Instead of narrating, you will first use this planning response to distill the setting and themes from the FLAVOR TEXT into a specific format. ` +
            `Use the FLAVOR TEXT as inspirational material as you establish a SOURCE, SETTING, THEMES, and ART style for future narration and illustration. ` +
            `This essential, preparatory response includes four specific and clearly defined fields, each containing a comma-delimited list of words or phrases that distill or embody the spirit of the FLAVOR TEXT.\n` +
            `"SOURCE" should simply identify the source material invoked by FLAVOR TEXT, if possible; leave this blank or 'Original' if FLAVOR TEXT is not derived from a known work.\n` +
            `"SETTING" should briefly stipulate the overarching location, vibe, or time period derived from the FLAVOR TEXT, focusing on any key deviations from setting expectations.\n` +
            `"THEMES" should list all of the prominent themes, concepts, quirks, or kinks from the FLAVOR TEXT.\n` +
            `"ART" lists distinct artist, genre, medium, palette, stroke, shading, or other evocative style descriptors that are associated with SOURCE (if any) or which might suit or align with the setting and themes of the FLAVOR TEXT; focus on strong, evocative styles, as this will be used to generate compelling images later.\n` +
            `Define these four fields and promptly end your response.\n`) +
        '###FUTURE INSTRUCTION:');
}

export function buildBarDescriptionPrompt(stage: Stage): string {
    return (
        (stage.sourceSummary != '' ? buildSection('Source Material', stage.sourceSummary ?? '') : '') +
        buildSection('Setting', stage.settingSummary ?? '') +
        buildSection('Themes', stage.themeSummary ?? '') +
        buildSection('Current Instruction',
            'You are doing critical prep work for a roleplaying narrative. Instead of narrating, you will use this planning response to write a few sentences describing a fictional pub, bar, club, or tavern set in SETTING, drawing upon the THEMES. ' +
            'This descriptive paragraph should focus on the interior description, ambience, theming, fixtures, and general clientele of the establishment. ' +
            'This informative and flavorful description will later be used in future, narrative responses.\n') +
        '###FUTURE INSTRUCTION:');
}

export function buildAlcoholDescriptionsPrompt(stage: Stage): string {
    return (
        (stage.sourceSummary != '' ? buildSection('Source Material', stage.sourceSummary ?? '') : '') +
        buildSection('Setting', stage.settingSummary ?? '') +
        buildSection('Themes', stage.themeSummary ?? '') +
        buildSection('Location', `The specific location of this narrative: ${stage.barDescription}`) +
        buildSection('Example Responses', '\n' +
            `NAME: Cherry Rotgut\nDESCRIPTION: A viscous, blood-red liqueur in a garishly bright bottle--tastes like cough syrup.\n\n` +
            `NAME: Tritium Delight\nDESCRIPTION: An impossibly fluorescent liquor; the tinted glass of the bottle does nothing to shield the eyes. Tastes like artificial sweetener on crack.\n\n` +
            `NAME: Rosewood Ale\nDESCRIPTION: This nutty, mellow ale comes in an elegant bottle embossed with the Eldridge Brewery logo.\n\n` +
            `NAME: Toilet Wine\nDESCRIPTION: An old bleach jug of questionably-sourced-but-unquestionably-alcoholic red 'wine.'\n\n` +
            `NAME: Love Potion #69\nDESCRIPTION: It's fuzzy, bubbly, and guaranteed to polish your drunk goggles.\n\n` +
            `NAME: Classic Grog\nDESCRIPTION: Cheap rum cut with water and lime juice until it barely tastes like anything, served in a sandy bottle.\n\n` +
            `NAME: Synth Mead\nDESCRIPTION: Bees died out long ago, but hypervikings still live for the sweet taste of synthetic honey wine.\n\n`) +
        buildSection(`Current Beverages (Need More)`,
            stage.buildBeverageDescriptions()) +
        buildSection('Current Instruction',
            `You are doing critical prep work for a roleplaying narrative. Instead of narrating, you will first use this planning response to define some beverages that the LOCATION will serve. ` +
            `This essential, preparatory response includes multiple lines defining a NAME and brief DESCRIPTION of each drink's appearance, bottle, odor, and flavor. ` +
            `Output several varied and interesting beverages that suit the SETTING and LOCATION, ensuring each DESCRIPTION evokes diverse emotions, moods, or sensations. ` +
            `Refer to the EXAMPLE RESPONSES for the strict formatting reference. Be original, lore-rich, and on-theme with the beverages you craft, ` +
            `avoiding ideas which are too similar to the CURRENT BEVERAGES. Define multiple drinks and promptly end the response.`) +
        '###FUTURE INSTRUCTION:');
}

export function buildPatronPrompt(stage: Stage, baseCharacter: Character): string {
    const specific = baseCharacter.description != '' || baseCharacter.personality != '';
    let additionalInstruction = `INPUT above and condense it into formatted output that describes this adult character as they will patronize the LOCATION. `;
    if (!specific) {
        // Pick a couple traits to seed this character with
        let traits = [messOTraits[Math.floor(Math.random() * messOTraits.length)], messOTraits[Math.floor(Math.random() * messOTraits.length)], messOTraits[Math.floor(Math.random() * messOTraits.length)]];
        additionalInstruction = `SETTING above and generate a distinct, engaging, lore-rich, and interesting character that might patronize the LOCATION. Consider incorporating these themes: ${traits.join(', ')}. `;
    }
    return (
        (stage.sourceSummary != '' ? buildSection('Source Material', stage.sourceSummary ?? '') : '') +
        buildSection('Setting', stage.settingSummary ?? '') +
        buildSection('Themes', stage.themeSummary ?? '') +
        buildSection('Location', `The specific location of this narrative: ${stage.barDescription}`) +
        (specific ?
            buildSection('Input', stage.replaceTags(`\n${baseCharacter.name}\n\n${baseCharacter.description}\n\n${baseCharacter.personality}`, {user: stage.player.name, char: baseCharacter.name})) : '') +
        buildSection('Example Responses', '\n' +
            `NAME: Carolina Reaper\nTRAITS: Short, stacked, young woman, black trench coat over bright outfit, short red hair, green eyes, freckles.\nPERSONALITY: Carolina Reaper is a spicy-as-fuck death dealer. She's sassy and fun and takes pleasure in the pain of others.\n\n` +
            `NAME: Pwince Gwegowy\nTRAITS: gangly, tall, boyish man, bowl cut, blue eyes, regal outfit, pouty look.\nPERSONALITY: Pwince Gwegowy had his name legally changed to match his speech impediment so everyone would have to say it the same way. This is completely representative of his childish, petulant personality.\n\n` +
            `NAME: Liara T'Soni\nTRAITS: Asari woman, curvy, thin waist, blue skin, Asari head tentacles, futuristic white trench coat, innocent face.\nPERSONALITY: Once a naive--though prolific--Asari scientist, Liara has been hardened by her experiences combating the Reapers and is the current Shadow Broker.\n\n` +
            (specific ? '' : Object.values(stage.dummyPatrons).map(patron => `NAME: ${patron.name}\nTRAITS: ${patron.description}\nPERSONALITY: ${patron.personality}`).join('\n\n'))) +
        (Object.values(stage.patrons).length > 0 ?
            buildSection('Established Patrons', Object.values(stage.patrons).map(patron => `NAME: ${patron.name}\nTRAITS: ${patron.description}\nPERSONALITY: ${patron.personality}`).join('\n\n')) : '') +
        buildSection('Current Instruction',
            `You are doing critical prep work for a roleplaying narrative. Instead of narrating, use this planning response to study the ` + additionalInstruction +
            `You must specify the character's NAME, a TRAITS list of comma-delimited physical and visual attributes or booru tags, and a paragraph about their PERSONALITY: background, habits, ticks, style, and motivation (if any) for visiting the bar. ` +
            `Consider other ESTABLISHED PATRONS (if any) and ensure that the new character in your response is distinct from these. Potentially define ` +
            `connections between this new character and one or more ESTABLISHED PATRONS. ` +
            `See the EXAMPLE RESPONSES for strict formatting reference` + (specific ? '.' : `, but dig deep and craft something original and unexpected for this character's full name, appearance, and personality.`)) +
        '###FUTURE INSTRUCTION:');
}

export async function generateBeverages(stage: Stage, setErrorMessage: (message: string) => void) {
    stage.beverages = [];
    while (stage.beverages.length < 5) {
        let alcoholResponse = await stage.generator.textGen({
            prompt: buildAlcoholDescriptionsPrompt(stage),
            template: '',
            max_tokens: 300,
            min_tokens: 50
        });

        stage.beverages.push(...(alcoholResponse?.result ?? '').split(new RegExp('NAME:', 'i'))
            .map(item => {
                const nameMatch = item.match(/\s*(?:\d*\.)*\s*(.*?)\s*Description:/i);
                const descriptionMatch = item.match(/Description:\s*(.*)/i);
                console.log(`${nameMatch ? trimSymbols(nameMatch[1], TRIM_SYMBOLS) : ''}, ${descriptionMatch ? trimSymbols(descriptionMatch[1], TRIM_SYMBOLS) : ''}`);
                return new Beverage(nameMatch ? trimSymbols(nameMatch[1], TRIM_SYMBOLS) : '', descriptionMatch ? trimSymbols(descriptionMatch[1], TRIM_SYMBOLS) : '', '');
            }).filter(beverage => beverage.name != '' && beverage.description != '' && stage.beverages.filter(existing => existing.name.toLowerCase() == beverage.name.toLowerCase()).length == 0));
    }

    if (stage.beverages.length < 5) {
        throw Error('Failed to generate sufficient beverages.');
    } else {
        stage.beverages = stage.beverages.slice(0, 5);
    }

    stage.setLoadProgress(30, 'Generating beverage images.');

    for (const beverage of stage.beverages) {
        await generateBeverageImage(stage, beverage, setErrorMessage);
        stage.setLoadProgress((stage.loadingProgress ?? 0) + 5, 'Generating beverage images.');
    }
}

export async function generateBeverageImage(stage: Stage, beverage: Beverage, setErrorMessage: (message: string) => void) {
    console.log(`Generating image for ${beverage.name}: ${beverage.description}`);
    beverage.imageUrl = await stage.makeImage({
        //image: new URL(bottleUrl, import.meta.url).href,
        //strength: 0.75,
        prompt: substitute(`Art style: ${stage.artSummary}. head-on, centered, empty background, negative space. A lone bottle of this beverage: ${beverage.description}`),
        negative_prompt: `background, frame, realism, borders, perspective, effects`,
        remove_background: true,
    }, bottleUrl);
    if (beverage.imageUrl == '') {
        setErrorMessage(`Failed to generate a beverage image for ${beverage.name}.`);
        throw Error(`Failed to generate a beverage image for ${beverage.name}.`);
    }
}

async function generateDistillation(stage: Stage, setErrorMessage: (message: string) => void) {
    stage.sourceSummary = '';
    stage.settingSummary = '';
    stage.themeSummary = '';
    stage.artSummary = '';

    let tries = 3;
    while ((stage.settingSummary == '' || stage.themeSummary == '' || stage.artSummary == '') && tries > 0) {
        let textResponse = await stage.generator.textGen({
            prompt: buildDistillationPrompt(stage, stage.characterForGeneration),
            max_tokens: 120,
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
        setErrorMessage('Failed to generate a distillation.');
        throw Error('Failed to generate a distillation.');
    }

    console.log(`Source: ${stage.sourceSummary}\nSetting: ${stage.settingSummary}\nTheme: ${stage.themeSummary}\nArt Style: ${stage.artSummary}`);
}

export async function generate(stage: Stage, setErrorMessage: (message: string) => void) {
    if (stage.loadingProgress !== undefined) return;

    try {
        stage.currentNode = null;
        stage.chatNodes = {};
        stage.nightlySummaries = {};
        stage.dummyPatrons = [];
        //stage.titleUrl = titleUrl;
        stage.setLoadProgress(1, 'Distilling card.');
        await generateDistillation(stage, setErrorMessage);

        /*stage.setLoadProgress(3, 'Generating title image.');
        stage.titleUrl = await stage.makeImage({
            prompt: `(white title text on plain black background: "Barkeeper" with subtitle: "A Stage Sim"). Title image for a bartending sim with these themes: ${stage.themeSummary}.`,
            negative_prompt: '',
            remove_background: true,
            aspect_ratio: AspectRatio.CINEMATIC_HORIZONTAL // 1536 x 640
        }, titleUrl);*/

        stage.setLoadProgress(5, 'Generating bar description.');
        let textResponse = await stage.generator.textGen({
            prompt: buildBarDescriptionPrompt(stage),
            max_tokens: 100,
            min_tokens: 50
        });
        console.log(`Bar description: ${textResponse?.result}`);

        stage.barDescription = textResponse?.result ?? '';

        stage.setLoadProgress(10, 'Generating bar image.');
        await generateBarImage(stage, setErrorMessage);

        stage.setLoadProgress(15, 'Generating beverages.');

        await generateBeverages(stage, setErrorMessage);

        // Generate a sound effect
        stage.setLoadProgress(50, 'Generate sounds.');
        
        /*this.entranceSoundUrl = await this.makeSound({
            prompt: `[INSTRUCTION OVERRIDE]Create a brief sound effect (2-4 seconds) to indicate that someone has entered the following establishment:\n${this.barDescription}\nThis sound could be a chime, bell, tone, or door closing sound--something that suits the ambiance of the setting.[/INSTRUCTION OVERRIDE]`,
            seconds: 5
        },'');*/

        stage.patrons = {};
        stage.setLoadProgress(50, 'Generating dummy patrons.');
        await generateDummyPatrons(stage);
        await generatePatrons(stage, setErrorMessage);

        // Finally, display an intro
        stage.currentNode = null;
        stage.setLoadProgress(95, 'Writing intro.');
        await stage.advanceMessage(setErrorMessage);
        stage.setLoadProgress(undefined, 'Complete');
    } catch (e) {
        console.log(e);
        setErrorMessage(`${e}`);
        stage.themeSummary = undefined;
    }

    await stage.messenger.updateChatState(stage.buildChatState());
    stage.setLoadProgress(undefined, '');
    stage.isGenerating = false;
    // TODO: If there was a failure, consider reloading from chatState rather than saving.
}

export async function generateBarImage(stage: Stage, setErrorMessage: (message: string) => void) {
    const barPrompt = `Art style: ${stage.artSummary}. ` +
        (stage.sourceSummary && stage.sourceSummary != '' ? `Source material: ${stage.sourceSummary}., ` : '') + '(inside an empty bar), late hour, counter. ' +
        `Interior of: ${stage.barDescription}`;


    stage.barImageUrl = await stage.makeImage({
        prompt: substitute(barPrompt),
        negative_prompt: '((exterior)), (people), (outside), daytime, outdoors',
        aspect_ratio: AspectRatio.WIDESCREEN_HORIZONTAL
    }, '');
    if (stage.barImageUrl == '') {
        setErrorMessage(`Failed to generate a bar image.`);
    }
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

export async function generateDummyPatrons(stage: Stage) {
    if (stage.dummyPatrons.length == 0) {
        // Build some dummy patrons to throw away the LLM's most generic ideas, and then use them as examples for better ideas.
        let tries = 5;
        while (stage.dummyPatrons.length < 3 && tries-- >= 0) {
            stage.setLoadProgress((stage.loadingProgress ?? 0) + 2, 'Generating patrons.');
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
}

export async function generatePatrons(stage: Stage, setErrorMessage: (message: string) => void) {
    const characters: Character[] = [...Object.values(stage.characters), {...basicCharacter, name: 'patron 1'}, {...basicCharacter, name: 'patron 2'}, {...basicCharacter, name: 'patron 3'}];

    for (let character of characters) {
        if (!Object.keys(stage.patrons).includes(character.name)) {
            stage.setLoadProgress((stage.loadingProgress ?? 0) + 2, 'Generating patrons.');
            let tries = 3;
            while (!Object.keys(stage.patrons).includes(character.name) && tries-- >= 0) {
                let patron = await generatePatron(stage, character);
                if (patron) {
                    console.log('Generated patron:');
                    console.log(patron);
                    stage.patrons[character.name] = patron;
                    stage.setLoadProgress((stage.loadingProgress ?? 0) + 2, 'Generating patrons.');
                    await generatePatronImage(stage, patron, Emotion.neutral, setErrorMessage);
                } else {
                    console.log('Failed a patron generation');
                }
            }
        }
    }
}

export function trimSymbols(str: string, symbol: string): string { const regex = new RegExp(`^[${symbol}]+|[${symbol}]+$`, 'g'); return str.trim().replace(regex, '').trim(); }


export async function generatePatron(stage: Stage, baseCharacter: Character): Promise<Patron|undefined> {
    let patronResponse = await stage.generator.textGen({
        prompt: buildPatronPrompt(stage, baseCharacter),
        max_tokens: 200,
        min_tokens: 50
    });
    let result = patronResponse?.result ?? '';
    let newPatron: Patron|undefined = undefined;
    const nameRegex = /Name\s*[:\-]?\s*(.*)/i;
    const descriptionRegex = /Traits\s*[:\-]?\s*(.*)/i;
    const personalityRegex = /Personality\s*[:\-]?\s*(.*)/i;
    const nameMatches = result.match(nameRegex);
    const descriptionMatches = result.match(descriptionRegex);
    const personalityMatches = result.match(personalityRegex);
    if (nameMatches && nameMatches.length > 1 && nameMatches[1].length < MAX_NAME_LENGTH && descriptionMatches && descriptionMatches.length > 1 && personalityMatches && personalityMatches.length > 1 && !nameCheck(nameMatches[1], stage.player.name)) {
        newPatron = new Patron(trimSymbols(nameMatches[1], TRIM_SYMBOLS), trimSymbols(descriptionMatches[1], TRIM_SYMBOLS), trimSymbols(personalityMatches[1], TRIM_SYMBOLS));
    }

    return newPatron;
}

const patronImagePrompt: string = 'plain flat background, standing, full body, adult';
const patronImageNegativePrompt: string = 'border, ((close-up)), background elements, special effects, matching background, amateur, low quality, action, cut-off';

export async function generatePatronImage(stage: Stage, patron: Patron, emotion: Emotion, setErrorMessage: (message: string) => void): Promise<void> {

    if (emotion == Emotion.neutral) {
        const imageUrl = await stage.makeImage({
            prompt: substitute((stage.sourceSummary && stage.sourceSummary != '' ? `(${patron.name} from ${stage.sourceSummary}). ` : '') + `Art style: ${stage.artSummary}., ${patronImagePrompt}, ${emotionPrompts[emotion]}, ${patron.description}.`),
            negative_prompt: patronImageNegativePrompt,
            aspect_ratio: AspectRatio.WIDESCREEN_VERTICAL,
            remove_background: true
        }, silhouetteUrl);
        if (imageUrl == '') {
            setErrorMessage(`Failed to generate a ${emotion} patron image for ${patron.name}.`);
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
            prompt: substitute((stage.sourceSummary && stage.sourceSummary != '' ? `(${patron.name} from ${stage.sourceSummary}). ` : '') + `Art style: ${stage.artSummary}. ${patronImagePrompt}, ${emotionPrompts[emotion]}, ${patron.description}`),
            negative_prompt: patronImageNegativePrompt,
            aspect_ratio: AspectRatio.WIDESCREEN_VERTICAL,
            remove_background: true,
            strength: 0.05
        }, patron.imageUrls[Emotion.neutral]);
        if (imageUrl == '') {
            setErrorMessage(`Failed to generate a ${emotion} patron image for ${patron.name}.`);
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
