import Actor, { getStatDescription, findBestNameMatch, Stat, getRole } from "./actors/Actor";
import { Emotion, EMOTION_MAPPING } from "./actors/Emotion";
import { Stage } from "./Stage";
import { v4 as generateUuid } from 'uuid';


export interface ScriptEntry {
    speakerId?: string;
    speaker: string;
    message: string;
    speechUrl: string; // URL of TTS audio
    actorEmotions?: {[key: string]: Emotion}; // actor name -> emotion string
    servedDrink?: string; // ID of the drink served at this entry
    servedTo?: string; // ID of the actor served at this entry
    movements?: {[actorId: string]: string}; // actorId -> location ID
    endScene?: boolean;
}

export interface SkitData {
    id?: string;
    script: ScriptEntry[];
    generating?: boolean;
    currentIndex?: number;
    context: any;
    summary?: string;
    initialActorLocations?: {[actorId: string]: string}; // actorId -> locationId; used to track where actors start at the beginning of the skit
    initialLocation?: string; // Location ID of this skit. Currently unused, as all skits occur in the bar.
}

function splitScriptEntriesByLineBreaks(scriptEntries: ScriptEntry[]): ScriptEntry[] {
    const splitEntries: ScriptEntry[] = [];

    for (const entry of scriptEntries) {
        const messageLines = (entry.message || '')
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (messageLines.length <= 1) {
            splitEntries.push(entry);
            continue;
        }

        splitEntries.push({
            ...entry,
            message: messageLines[0]
        });

        for (let i = 1; i < messageLines.length; i++) {
            splitEntries.push({
                speaker: entry.speaker,
                speakerId: entry.speakerId,
                message: messageLines[i],
                speechUrl: ''
            });
        }
    }

    return splitEntries;
}

function buildScriptLog(skit: SkitData, additionalEntries: ScriptEntry[] = [], stage?: Stage): string {
    const formatSignedAmount = (amount?: number): string => {
        const value = amount || 0;
        return `${value >= 0 ? '+' : ''}${value}`;
    };

    const resolveActorName = (actorId?: string): string => {
        if (!actorId) return 'Unknown Character';
        if (actorId === 'player') return stage?.player.name || 'Player';
        return stage?.saveData.actors[actorId]?.name || actorId;
    };

    return ((skit.script && skit.script.length > 0) || additionalEntries.length > 0) ?
        [...skit.script, ...additionalEntries].map(e => {
            // Find the best matching emotion key for this speaker
            const speakerName = (stage?.saveData.actors[e.speakerId || '']?.name || (e.speakerId == 'player' ? stage?.player.name : '') || e.speaker || 'Unknown Speaker');
            const emotionKeys = Object.keys(e.actorEmotions || {});
            const candidates = emotionKeys.map(key => ({ name: key }));
            const bestMatch = findBestNameMatch(speakerName, candidates);
            const matchingKey = bestMatch?.name;
            const emotionText = matchingKey ? ` [${matchingKey} expresses ${e.actorEmotions?.[matchingKey]}]` : '';

            return `[${speakerName} turn]${emotionText} ${e.message}`.trim();
        }).join('\n')
        : '(None so far)';
}

function getCurrentActorsInScene(skit: SkitData, moduleId?: string, upToIndex: number = -1): Set<string> {
    const targetModuleId = moduleId || getCurrentSceneModuleId(skit, upToIndex);
    // Start with initial actor locations
    const currentLocations = {...(skit.initialActorLocations || {})};
    const endIndex = Math.min(skit.script.length, upToIndex === -1 ? skit.script.length : upToIndex);
    
    // Apply movements from script entries
    for (let i = 0; i < endIndex; i++) {
        const entry = skit.script[i];
        if (entry?.movements) {
            Object.entries(entry.movements).forEach(([actorId, newLocationId]) => {
                currentLocations[actorId] = newLocationId;
            });
        }
    }
    
    // Return actors at the target module
    const presentActors = new Set<string>();
    Object.entries(currentLocations).forEach(([actorId, locationId]) => {
        if (locationId === targetModuleId) {
            presentActors.add(actorId);
        }
    });
    
    return presentActors;
}

/**
 * Build a map of actorId -> current location at a point in the script.
 */
function getCurrentActorLocations(skit: SkitData, upToIndex: number = -1): {[actorId: string]: string} {
    const currentLocations = {...(skit.initialActorLocations || {})};
    const endIndex = Math.min(skit.script.length, upToIndex === -1 ? skit.script.length : upToIndex);

    for (let i = 0; i < endIndex; i++) {
        const entry = skit.script[i];
        if (entry?.movements) {
            Object.entries(entry.movements).forEach(([actorId, newLocationId]) => {
                currentLocations[actorId] = newLocationId;
            });
        }
    }

    return currentLocations;
}

/**
 * Build a map of actorName -> current emotion at a point in the script.
 */
function getCurrentActorEmotions(skit: SkitData, upToIndex: number = -1): {[actorName: string]: Emotion} {
    // All actors start neutral; map can be initialized empty.
    const currentEmotions = {} as {[actorName: string]: Emotion};
    const endIndex = Math.min(skit.script.length, upToIndex === -1 ? skit.script.length : upToIndex);
    for (let i = 0; i < endIndex; i++) {
        const entry = skit.script[i];
        if (entry?.actorEmotions) {
            Object.entries(entry.actorEmotions).forEach(([actorName, emotion]) => {
                currentEmotions[actorName] = emotion;
            });
        }
    }

    return currentEmotions;
}

function processSceneMovementTag(rawTag: string, stage: Stage): string | null {
    const sceneMovementRegex = /^SCENE\s+MOVES\s+to\s+(.+)$/i;
    const sceneMovementMatch = sceneMovementRegex.exec(rawTag);
    if (!sceneMovementMatch) return null;

    const destinationName = sceneMovementMatch[1].trim();

    const targetLocation = findBestNameMatch(destinationName, stage.saveData.locations);

    if (!targetLocation) {
        console.warn(`Could not find module matching scene move destination: ${destinationName}`);
        return null;
    }

    console.log(`Scene movement detected: scene moves to ${targetLocation.name} (${targetLocation.id})`);
    return targetLocation.id;
}


/**
 * Process a movement tag and return the destination module/faction ID if valid.
 * @param rawTag - The raw tag content (without brackets)
 * @param stage - The Stage object for accessing save data and layout
 * @param skit - The current skit data
 * @returns An object with actorId and destinationId, or null if invalid
 */
function processMovementTag(rawTag: string, stage: Stage, skit: SkitData | undefined, currentSkitLocationId?: string): { actorId: string; locationId: string } | null {
    // Look for movement tags: [Character Name moves to Module Name]
    const movementRegex = /^([^[\]]+?)\s+moves\s+to\s+(.+)$/i;
    const movementMatch = movementRegex.exec(rawTag);
    if (!movementMatch) return null;
    
    const characterName = movementMatch[1].trim();
    const destinationName = movementMatch[2].trim();
    
    // Find matching actor using findBestNameMatch
    const allActors: Actor[] = Object.values(stage.saveData.actors);
    const matched = findBestNameMatch(characterName, allActors);
    if (!matched) {
        console.warn(`Could not find actor matching: ${characterName}`);
        return null;
    }
    
    // Resolve destination module
    let destinationLocationId = '';
    
    // Check if it's a quarters reference (e.g., "Susan's quarters" or "quarters")
    if (['home', 'away', 'elsewhere'].includes(destinationName.toLowerCase())) {
        // location ID is empty
        destinationLocationId = '';
    } else if (skit && ['here'].includes(destinationName.toLowerCase())) {
        // Move to current skit location
        destinationLocationId = currentSkitLocationId || '';
    } else {
        // Try to find a module by type name
        // Use findBestNameMatch:
        const targetLocationMatch = findBestNameMatch(destinationName, stage.saveData.locations);
        if (targetLocationMatch) {
            destinationLocationId = targetLocationMatch.id;
            console.log(`Movement detected: ${matched.name} moves to location ${targetLocationMatch.name} (${targetLocationMatch.id})`);
        }
    }
    
    // Return movement data if valid destination found
    if (destinationLocationId) {
        return { actorId: matched.id, locationId: destinationLocationId };
    }
    
    return null;
}

// Weird place for this because I'm using it all over.
export function buildPromptSegment(title: string, content: string) {
    return content.trim() ? `${title}: [\n${content.trim()}\n]\n\n` : '';
}

export function buildSkitPrompt(skit: SkitData, stage: Stage, historyLength: number, instruction: string): string {
    const playerName = stage.player.name;
    const save = stage.saveData;

    // Initialize skit with all actor locations if this is the first generation
    if (skit.script.length === 0) {
        skit.initialActorLocations = {};
        Object.values(save.actors).forEach(a => {
            skit.initialActorLocations![a.id] = ''; // Default to no location
        });
    }

    // Determine present and absent actors for this moment in the skit (as of the last entry in skit.script):
    const currentLocationId = getCurrentLocationId(skit, -1);
    const presentActorIds = getCurrentActorsInScene(skit, currentLocationId, -1);
    const presentActors = Object.values(save.actors).filter(a => presentActorIds.has(a.id));
    const absentActors = Object.values(save.actors).filter(a => !presentActorIds.has(a.id));

    let pastEvents = save.skits || [];
    pastEvents = pastEvents.filter((v, index) => index > (pastEvents.length || 0) - historyLength);

    let fullPrompt = `{{messages}}` +
        buildPromptSegment('Premise', `This is a bartending visual novel game where the player, ${playerName}, works the bar and serves drinks to various interesting patrons.`) +
        buildPromptSegment(`${playerName}'s profile`, save.actors['player'].description) + 
        buildPromptSegment('Absent Characters (Available to Add)', absentActors.map(actor => {
            return `  ${actor.name}\n    Description: ${actor.description}\n    Profile: ${actor.personality}`;
        }).join('\n')) +
        
        // List characters who are here, along with full stat details:
        buildPromptSegment('Present Characters (Currently in the Scene)', presentActors.map(actor => {
            return `  ${actor.name}\n    Description: ${actor.description}\n    Profile: ${actor.personality}`;
        }).join('\n')) +

        `\n${instruction}`;
    return fullPrompt;
}

function shouldPreserveUnprocessedTag(rawTag: string): boolean {
    // Keep empty reset tags (`[]`) and single-word text style tags (e.g. `[shout]`).
    return rawTag.length === 0 || /^\w+$/.test(rawTag);
}

function stripNonStyleTags(text: string): string {
    return text.replace(/\[([^\]]*)\]/g, (fullTag, rawTag) =>
        shouldPreserveUnprocessedTag(rawTag.trim()) ? fullTag : ''
    );
}

export async function generateSkitSummary(skit: SkitData, stage: Stage): Promise<string> {
    let retries = 3;
    while (retries > 0) {
        const summaryPrompt = buildSkitPrompt(skit, stage, 0,
                buildPromptSegment('Scene Script for Analysis', buildScriptLog(skit, skit.script, stage)) +
                buildPromptSegment('Instruction', `The System will analyze the preceding scene script output a "[SUMMARY: <textSummary>]" tag with a brief summary of the entire scene's key events or outcomes.`)) +
            buildPromptSegment('Example Response',
                `[SUMMARY: A faction representative visits the PARC to make an offer to a patient, which they accept, leading to the patient's departure from the station to join that faction permanently.]`);
        let endResponse = await stage.makeText({
            prompt: summaryPrompt,
            min_tokens: 1,
            max_tokens: 300,
            include_history: true,
            stop: ['#END']
        });
        if (endResponse) {
            const summaryMatch = /\[SUMMARY:\s*([^\]]+)\]/i.exec(endResponse);
            if (summaryMatch && summaryMatch[1].trim().length > 30) {
                skit.summary = summaryMatch[1].trim();
                console.log('New summary for skit:', skit.summary);
                return skit.summary;
            }
        }
        retries--;
    }
    return '';
}

export async function generateSkitScript(skit: SkitData, stage: Stage): Promise<ScriptEntry[]> {

    const generalAlternativePrompts = [
        'Write compelling, fresh content that emphasizes dialogue and character interactions with suitable wit and flavor without recycling past material.',
        'Craft engaging and dynamic beats that highlight character dynamics and emotions while dodging redundant content.',
        'Eschew reliance on past themes by creating vivid and distinct moments that showcase character personalities through their actions and dialogue.',
        'Take care to avoid repetition of past events, instead focusing on advancing the scene with new developments and novel interactions.'
    ];
    const alternativePrompt = generalAlternativePrompts[Math.floor(Math.random() * generalAlternativePrompts.length)];

    // Retry logic if response is null or response.result is empty
    let retries = 3;
    while (retries > 0) {
        try {
            const fullPrompt = buildSkitPrompt(skit, stage, 5 + retries * 5, // Start with lots of history, reducing each iteration.
                buildPromptSegment(`Demonstrative Script and Tag Formatting`, 
                    `[SOME CHARACTER turn] Some Character does some actions in prose; for example, they may be waving to you, the player. They say, "My dialogue is in quotation marks."\n` +
                    `[SOME CHARACTER turn][SOME CHARACTER expresses PRIDE] They add, "A character can have two consecutive entries, if they have more to say or do, and it makes sense to break up a lot of activity."\n` +
                    `[ANOTHER CHARACTER turn][ANOTHER CHARACTER moves to HERE][ANOTHER CHARACTER expresses JOY][SOME CHARACTER expresses SURPRISE] ` +
                        `Changing speakers requires a new [<NAME> turn] tag; this tag demarkates a new entry in the script. Another Character explains, "Some Character changed their expression in this entry to react to my presence, but only I can speak here."\n` +
                    `[SOME CHARACTER turn] They nod in agreement, "If there's any dialogue at all, the entry must be attributed to the character speaking."\n` +
                    `[NARRATOR turn][SOME CHARACTER expresses RELIEF] Descriptive content or other scene events occurring around you, the player, can be attributed to NARRATOR. Dialogue cannot be included in NARRATOR entries.\n` +
                    (stage.saveData.disableImpersonation ? '' : `[${stage.saveData.actors['player'].name.toUpperCase()} turn] "Hey, Some Character," I greet them warmly. I'm the player, and my entries use first-person narrative voice, while all other skit entries use second-person to refer to me.\n`) +
                    `[NARRATOR turn][SOME CHARACTER moves to OTHER MODULE NAME] Some Character ducks out with a smile. You hear their boots fade away down the corridor beyond.\n` +
                    `[ANOTHER CHARACTER turn][SCENE moves to OTHER MODULE NAME][SOME CHARACTER wears FORMAL WEAR] You and Another Character follow Some Character to the other module, where they have changed into more formal attire. "[shout]We'll miss you, Some Character![]" cries Another Character, utilizing a text style tag.\n` +
                    `[SOME CHARACTER turn][SOME CHARACTER moves to FACTION NAME] Some Character waves good-bye as they step beyond the bulkhead, leaving the PARC to join Faction Name. You watch on-screen as their shuttle detaches from the station and disappears into the stars.` +
                    `Your dataslate pings as Faction Name's payment hits your account.[STATION: Wealth +1]\n`
                 ) +
                buildPromptSegment(`Ongoing Scene Log`, buildScriptLog(skit, [], stage)) +
                buildPromptSegment(`Primary Instruction`, 
                `${skit.script.length == 0 ? 'Produce the initial moments of a scene (perhaps joined in medias res)' : 'Extend or conclude the current scene script'} with three to five entries, ` +
                `based upon the Premise and the specified Scene Prompt. Primarily involve the Present Characters, although Absent Characters may be moved to this location using appropriate tags, if warranted. ` +
                `The script should tacitly consider characters' stats, relationships, past events, and the station's stats—among other factors—to craft a compelling scene. ` +
                `\n\nFollow the structure of the strict Example Script formatting above: ` +
                `actions are depicted in prose and character dialogue in quotation marks. Characters present their own actions and dialogue, while other events within the scene are attributed to NARRATOR. ` +
                `Although a loose script format is employed, the actual content should be professionally edited narrative prose. ` +
                (stage.saveData.disableImpersonation ? 
                    `New entries refer to the player, ${stage.saveData.actors['player'].name}, in second-person; all other characters are referred to in third-person, even in their own entries.` :
                    `Entries from the player, ${stage.saveData.actors['player'].name}, are written in first-person, while other entries consistently refer to ${stage.saveData.actors['player'].name} in second-person; all other characters are referred to in third-person, even in their own entries.`)) +
                buildPromptSegment(`Scene Cue Tags`, 
                    `Embedded within this script, you may employ these special cue tags to trigger desired behaviors in the game engine. ` +
                    `\n\n#Turn Tag:#\n` +
                        `A character turn tag must be used to initiate a new script entry. Use NARRATOR for general narration entries, or the specific character who is speaking or performing actions in this entry. Consecutive turns are preferred over long turns.\n` +
                        `[<characterName> turn]who is speaking or performing an action.` +
                    `\n\n#Emotion Tag:#\n` +
                        `Emotion tags should be used to indicate visible emotional shifts in a character's appearance using a single-word emotion name.\n` +
                        `[<characterName> expresses <emotion>]` +
                    `\n\n#Movement Tag:#\n` +
                        `A character movement tag must be used when an Absent Character enters the scene, a present character leaves or moves to a different module on the station, ` +
                        `or when a character moves to another faction, abstractly representing any faction mission or time away. ` +
                        `If "Scene" is used as the character name, it indicates that the scene itself is moving to a different location, and all present characters are moving with it.\n` +
                        `[<characterName|"Scene"> moves to <locationName|factionName|"Here"|"Another module">]` +
                    `\n\n#Text Style Tags:#\n` +
                        `Special style keywords can be included in a tag to indicate that the surrounded text should be styled in a particular way, such as shouting or whispering.\n` +
                        `The game engine will style recognized tags appropriately. An empty tag can be used to reset the text style to default. All known styles:\n` +
                        `arcane - Adorned with mystical symbols and a shimmering effect, ideal for magical or mysterious dialogue.\n` +
                        `burn - Smoldering, flickering effect, conveying heat or destruction.\n` +
                        `flutter - A light, airy effect with gentle movement, perfect for whimsical or romantic moments.\n` +
                        `glitch - Digital distortion and static effects, ideal for technological malfunctions or cyberpunk text.\n` +
                        `hologram - A glowing scanline effect for AI or digital communications.\n` +
                        `quake - Shaking text, indicating fear, danger, shock, or instability.\n` +
                        `shine - A radiant glow and sparkling effect, perfect for moments of awe, beauty, or revelation.\n` +
                        `shout - A bold, larger font and a bright color, conveying loudness or intensity.\n` +
                        `sigh - A soft, fading effect, ideal for sighs, tiredness, or resignation.\n` +
                        `spooky - Wavy, bouncy text, ideal for moments of suspense, eeriness, or simply awe.\n` +
                        `tears - A watery effect and soft colors, evoking sadness or emotional vulnerability.\n` +
                        `whisper - A smaller, italicized font with a muted color, suggesting secrecy or softness.\n` +
                        `zalgo - Accented with archaic symbols and corrupted effects, often used for horror or demonic themes.\n` +
                        `[styleName]Text to be styled[]` +
                    `\n\n#End Tag:#\n` +
                        `An end tag should be used when the new chunk of script hits a conclusory moment, where continuing makes little sense.\n` +
                        `[END]` +
                    `\n\n#Cue Notes:#\n` +
                    `For all Character movement tags, LOCATION should be the name of an existing module type (e.g., 'comms', 'infirmary', 'lounge'), a character's quarters (e.g., 'Susan's quarters' or just 'quarters' for their own), or simply "Here" to move to the scene's location or "Another module" to leave this area. ` +
                    `If a faction name is used for the LOCATION, it indicates that the character is departing from the PARC itself, typically to visit a faction or engage in a mission or job on that faction's behalf (use the faction name as the location, even when the job is not "at" the faction). ` +
                    `The game engine relies upon movement tags to update character locations and visually display character presence in scenes, so it is essential to use these tags when Absent Characters enter the scene, Present Characters leave, or the scene itself relocates. ` +
                    `These tags are not presented to users, so the narrative content of the script should also organically mention characters entering, exiting, or relocating. `
                ) +

                buildPromptSegment(`Current Instruction`, 
                `The System will now craft and output multiple narrative entries/turns, developing this scene for a visual novel, utilizing tags per example and historic formatting and obeying the rules above. ` +
                `This is a skit in a video game, so avoid major developments or concrete details which would fundamentally alter or subvert the mechanics of the game. ` +
                (skit.script.length == 0 ? 'As this is the initial, establishing moment of a new scene, evaluate the current appearance and alternative appearances of each character and use Appearance ("wears") tags to update the characters to the most appropriate outfit for the moment. ' : '') +
                `Generally, focus upon interpersonal dynamics, character growth, faction and patient relationships, and the Station's state, capabilities, and inhabitants. ` +
                `Ensure that the nature and writing of the scene suit the current Narrative Tone suggested above. ` +
                `\n\n${alternativePrompt}` +
                ((stage.saveData.language || 'English').toLowerCase() !== 'english' ? `\n\nNote: The game is now being played in ${stage.saveData.language}. Regardless of historic language use, generate this skit content in ${stage.saveData.language} accordingly. Special emotion, appearance, and movement tags continue to use English (these are invisible to the user).` : '') +
                ``)
            );

            const response = await stage.makeText({
                template: fullPrompt,
                min_tokens: 10,
                max_tokens: 800,
                include_history: true,
                stop: ["[END]"]
            });
            if (response && response.trim().length > 0) {
                // First, detect and parse any tags that may be embedded in the response.
                let text = response;

                // Remove everything up to the first [NAME turn] tag, if it exists, to allow for some flexibility in model output while still ensuring we start parsing from the first turn.
                const firstTurnIndex = text.search(/\[[^\]]+ turn\]/i);
                if (firstTurnIndex >= 0) {
                    text = text.slice(firstTurnIndex);
                } else {
                    console.warn('No turn tags found in response; unable to parse script entries. Response was:', response);
                    continue;
                }

                // Parse response based on turn tags, e.g. "[NAME turn] content".
                // Keep a backward-compatible fallback for legacy "NAME: content" lines.
                const lines = text.split('\n');
                const combinedEntries: { speaker: string; message: string }[] = [];
                const combinedTagData: {emotions: {[key: string]: Emotion}, movements: {[actorId: string]: string}, outfitChanges: {[actorId: string]: string}, moveToModuleId?: string, endScene: boolean}[] = [];
                let currentSpeaker = 'NARRATOR';
                let currentMessage = '';
                let hasCurrentEntry = false;
                let currentEmotionTags: {[key: string]: Emotion} = {};
                let currentMovements: {[actorId: string]: string} = {};
                let currentOutfitChanges: {[actorId: string]: string} = {};
                let currentSceneMoveToModuleId: string | undefined;

                let parsedSceneModuleId = getCurrentSceneModuleId(skit, -1);
                const parsedCurrentLocations = getCurrentActorLocations(skit, -1);
                const parsedCurrentOutfits = getCurrentActorOutfits(skit, stage, -1);
                const parsedCurrentEmotions = getCurrentActorEmotions(skit, -1);
                for (const line of lines) {
                    // Skip empty lines
                    let trimmed = line.trim().replace(/[“”]/g, '"').replace(/[‘’]/g, '\'');

                    console.log(`Process line: ${trimmed}`);

                    // If a line doesn't end with ], ., !, ?, or ", then it's likely incomplete and we should drop it.
                    if (!trimmed || ![']', '*', '_', ')', '.', '!', '?', '"', '\''].some(end => trimmed.endsWith(end))) continue;

                    const newEmotionTags: {[key: string]: Emotion} = {};
                    const newMovements: {[actorId: string]: string} = {};
                    const newOutfitChanges: {[actorId: string]: string} = {};
                    let newSceneMoveToModuleId: string | undefined;

                    // Prepare list of all actors (not just present)
                    const allActors: Actor[] = Object.values(stage.getSave().actors);
                    
                    // Process tags in the line
                    for (const tag of trimmed.match(/\[[^\]]+\]/g) || []) {
                        const raw = tag.slice(1, -1).trim();
                        if (!raw) continue;

                        console.log(`Processing tag: ${raw}`);
                        
                        const sceneMoveModuleId = processSceneMovementTag(raw, stage);
                        if (sceneMoveModuleId) {
                            // Move every actor currently present in the active scene module.
                            Object.entries(parsedCurrentLocations).forEach(([actorId, locationId]) => {
                                if (locationId === parsedSceneModuleId) {
                                    newMovements[actorId] = sceneMoveModuleId;
                                }
                            });
                            newSceneMoveToModuleId = sceneMoveModuleId;
                            Object.keys(newMovements).forEach(actorId => {
                                parsedCurrentLocations[actorId] = sceneMoveModuleId;
                            });
                            parsedSceneModuleId = sceneMoveModuleId;
                            continue;
                        }

                        // Process movement tags using the shared function
                        const movementResult = processMovementTag(raw, stage, skit, parsedSceneModuleId);
                        if (movementResult && movementResult.locationId !== parsedCurrentLocations[movementResult.actorId]) {
                            newMovements[movementResult.actorId] = movementResult.locationId;
                            parsedCurrentLocations[movementResult.actorId] = movementResult.locationId;
                            continue;
                        }

                        const wearResult = processWearTag(raw, stage);
                        if (wearResult && wearResult.outfitId !== parsedCurrentOutfits[wearResult.actorId]) {
                            newOutfitChanges[wearResult.actorId] = wearResult.outfitId;
                            parsedCurrentOutfits[wearResult.actorId] = wearResult.outfitId;
                            console.log(`Processed wear tag for ${wearResult.actorId}: ${wearResult.outfitId}`);
                            continue;
                        }
                        
                        // Look for expresses tags:
                        const emotionTagRegex = /([^[\]]+)\s+expresses\s+([^[\]]+)/gi;
                        let emotionMatch = emotionTagRegex.exec(raw);
                        if (emotionMatch) {
                            const characterName = emotionMatch[1].trim();
                            const emotionName = emotionMatch[2].trim().toLowerCase();
                            // Find matching actor using findBestNameMatch
                            const matched = findBestNameMatch(characterName, allActors);
                            if (!matched) continue;

                            // Try to map emotion using EMOTION_SYNONYMS if not a standard emotion
                            let finalEmotion: Emotion | undefined;
                            if (emotionName in Emotion) {
                                finalEmotion = emotionName as Emotion;
                                console.log(`Recognized standard emotion "${finalEmotion}" for ${matched.name}`);
                            } else {
                                const closestEmotion = findBestNameMatch(emotionName, Object.keys(EMOTION_MAPPING).map(e => ({ name: e })));
                                if (closestEmotion) {
                                    console.log(`Emotion "${emotionName}" for ${matched.name} mapped to emotion "${EMOTION_MAPPING[closestEmotion.name]}".`);
                                    finalEmotion = EMOTION_MAPPING[closestEmotion.name];
                                } else {
                                    console.warn(`Unrecognized emotion "${emotionName}" for ${matched.name} and no close match found; skipping tag.`);
                                }
                            }
                            
                            if (!finalEmotion || finalEmotion === parsedCurrentEmotions[matched.name]) continue;
                            newEmotionTags[matched.name] = finalEmotion;
                            parsedCurrentEmotions[matched.name] = finalEmotion;
                        }
                    }

                    const tagsInLine = trimmed.match(/\[[^\]]+\]/g) || [];
                    const turnTagRegex = /^(.+?)\s+turn$/i;
                    const turnTag = tagsInLine
                        .map(tag => tag.slice(1, -1).trim())
                        .find(raw => turnTagRegex.test(raw));
                    const turnMatch = turnTag ? turnTagRegex.exec(turnTag) : null;

                    // Strip parsed/non-style tags but preserve text style tags and reset tags.
                    trimmed = stripNonStyleTags(trimmed).trim();

                    const startsNewEntry = !!turnMatch;

                    if (startsNewEntry) {
                        if (hasCurrentEntry) {
                            combinedEntries.push({ speaker: currentSpeaker, message: currentMessage.trim() });
                            combinedTagData.push({
                                emotions: currentEmotionTags,
                                movements: currentMovements,
                                outfitChanges: currentOutfitChanges,
                                moveToModuleId: currentSceneMoveToModuleId,
                                endScene: false // Not currently used.
                            });
                        }

                        currentSpeaker = turnMatch ? turnMatch[1].trim() : 'NARRATOR';
                        currentMessage = turnMatch ? trimmed : '';
                        hasCurrentEntry = true;
                        currentEmotionTags = newEmotionTags;
                        currentMovements = newMovements;
                        currentOutfitChanges = newOutfitChanges;
                        currentSceneMoveToModuleId = newSceneMoveToModuleId;
                    } else if (hasCurrentEntry) {
                        // Continuation of previous entry
                        if (trimmed) {
                            currentMessage += (currentMessage ? '\n' : '') + trimmed;
                        }
                        currentEmotionTags = {...currentEmotionTags, ...newEmotionTags};
                        currentMovements = {...currentMovements, ...newMovements};
                        currentOutfitChanges = {...currentOutfitChanges, ...newOutfitChanges};
                        currentSceneMoveToModuleId = newSceneMoveToModuleId || currentSceneMoveToModuleId;
                    } else if (trimmed) {
                        // If content appears before any explicit turn tag, attribute it to NARRATOR.
                        currentSpeaker = 'NARRATOR';
                        currentMessage = trimmed;
                        hasCurrentEntry = true;
                        currentEmotionTags = newEmotionTags;
                        currentMovements = newMovements;
                        currentOutfitChanges = newOutfitChanges;
                        currentSceneMoveToModuleId = newSceneMoveToModuleId;
                    }
                }
                if (hasCurrentEntry) {
                    combinedEntries.push({ speaker: currentSpeaker, message: currentMessage.trim() });
                    combinedTagData.push({
                        emotions: currentEmotionTags,
                        movements: currentMovements,
                        outfitChanges: currentOutfitChanges,
                        moveToModuleId: currentSceneMoveToModuleId,
                        endScene: false // Not currently used.
                    });
                }

                // Convert parsed entries into ScriptEntry objects.
                const scriptEntries: ScriptEntry[] = combinedEntries.map((parsedEntry, index) => {
                    let speaker = parsedEntry.speaker || 'NARRATOR';
                    let message = parsedEntry.message || '';
                    
                    // Keep single-word style tags and empty reset tags in final text.
                    message = stripNonStyleTags(message).trim();
                    
                    const entry: ScriptEntry = { speaker, message, speechUrl: '' };
                    const tagData = combinedTagData[index];
                    
                    if (tagData.emotions && Object.keys(tagData.emotions).length > 0) {
                        entry.actorEmotions = tagData.emotions;
                    }
                    if (tagData.movements && Object.keys(tagData.movements).length > 0) {
                        entry.movements = tagData.movements;
                    }
                    return entry;
                });

                // Drop empty entries from scriptEntries and adjust speaker to any matching actor's name:
                for (const entry of scriptEntries) {
                    if (!entry.message || entry.message.trim().length === 0) {
                        const movements = entry.movements || {};
                        const emotions = entry.actorEmotions || {};
                        const nextEntry = scriptEntries[scriptEntries.indexOf(entry) + 1];
                        if (nextEntry) {
                            nextEntry.movements = {...(nextEntry.movements || {}), ...movements};
                            nextEntry.actorEmotions = {...(nextEntry.actorEmotions || {}), ...emotions};
                            nextEntry.endScene = !!(nextEntry.endScene || entry.endScene);
                        }
                        scriptEntries.splice(scriptEntries.indexOf(entry), 1);
                        continue;
                    }
                    // Adjust speaker name to match actor name if possible
                    const matched = findBestNameMatch(entry.speaker, [...Object.values(stage.getSave().actors), {name: stage.getSave().player.name, id: 'player'}]); // Include player as a possible match
                    if (matched) {
                        entry.speakerId = matched.id;
                        entry.speaker = matched.name;
                    }
                }

                if (stage.getSave().disableImpersonation) {
                    // If impersonation is undesired, find any entry where the speaker matches the player's name and drop all messages beyond that point.
                    const playerEntryIndex = scriptEntries.findIndex(entry => entry.speaker.toLowerCase() === stage.getSave().player.name.toLowerCase());
                    if (playerEntryIndex !== -1) {
                        console.log(`Player entry found at index ${playerEntryIndex}. Removing all subsequent entries to disable impersonation.`);
                        scriptEntries.splice(playerEntryIndex);
                    }
                }

                const normalizedScriptEntries = splitScriptEntriesByLineBreaks(scriptEntries);


                // Run implied-outcome analysis in parallel with TTS generation.
                const impliedOutcomesPromise = generateImpliedOutcomesForCurrentEnd(skit, normalizedScriptEntries, stage);

                // TTS for each entry's dialogue
                const ttsPromises = normalizedScriptEntries.map(async (entry) => {
                    const actor = findBestNameMatch(entry.speaker, Object.values(stage.getSave().actors));
                    // Only TTS if entry.speaker matches an actor from stage().getSave().actors and entry.message includes dialogue in quotes.
                    if (!actor || !entry.message.includes('"') || stage.getSave().disableTextToSpeech) {
                        entry.speechUrl = '';
                        return;
                    }
                    let transcript = entry.message.split('"').filter((_, i) => i % 2 === 1).join('.........').trim();
                    // Strip asterisks or other markdown-like emphasis characters
                    transcript = transcript.replace(/[\*_~`]+/g, '');
                    // Strip tagged content like [shout], [whisper], etc.
                    transcript = transcript.replace(/\[[^\]]+\]/g, '').trim();
                    try {
                        const ttsResponse = await stage.generator.speak({
                            transcript: transcript,
                            voice_id: actor.voiceId ?? undefined
                        });
                        if (ttsResponse && ttsResponse.url) {
                            entry.speechUrl = ttsResponse.url;
                        } else {
                            entry.speechUrl = '';
                        }
                    } catch (err) {
                        console.error('Error generating TTS:', err);
                        entry.speechUrl = '';
                    }
                });

                // Wait for both TTS and implied outcomes.
                const [, impliedOutcomes] = await Promise.all([
                    Promise.all(ttsPromises),
                    impliedOutcomesPromise
                ]);

                stage.pushMessage(text);

                return normalizedScriptEntries;
            }
        } catch (error) {
            console.error('Error generating skit script:', error);
        }
        retries--;
    }

    stage.saveGame();
    return [];
}

export async function updateCharacterArc(stage: Stage, skit: SkitData, actor: Actor): Promise<void> {
    const analysisPrompt = buildSkitPrompt(skit, stage, 0,
        buildPromptSegment(`Scene Script for Analysis`, `${buildScriptLog(skit, [], stage)}`) +
        buildPromptSegment(`${actor.name}'s Current Character Arc`, `${actor.characterArc || 'No established character arc.'}`) +
        buildPromptSegment(`Instruction`, 
            `Analyze the preceding scene script and ${actor.name}'s character arc, then output a revised character arc paragraph that reflects any significant developments from the latest scene script. ` +
            `The character arc should be a concise summary of the character's growth, challenges, and changes experienced so far on the PARC. ` +
            `Focus on key emotional beats, relationships, and personal growth that have occurred up to this point. ` +
            `The System output should be a single paragraph, maintaining the same tone and style as the existing character arc.` +
            `If there are no significant developments, simply repeat the existing character arc without changes. `) +
        buildPromptSegment(`Full Examples`, 
            `Revised Character Arc: John Smith has yet to find their footing in the PARC; they can't seem to make friends with the other patients—beyond the StationAide—, and the director hasn't proven trustworthy.\n[END]\n\n` +
            `Revised Character Arc: Jane Doe has started to open up to others, forming tentative friendships. She feels a bit out of her depth in her role as Custodian, but appreciates the trust the director has placed in her and hopes to prove that faith justified.\n[END]\n`)
        );
    
    const requestAnalysis = await stage.makeText({
        prompt: analysisPrompt,
        min_tokens: 50,
        max_tokens: 400,
        include_history: true,
        stop: ['[END]']
    });
    if (requestAnalysis) {
        let analysisText = requestAnalysis.trim();
        // Some prefix ending with "Arc:" may be present; remove it.
        const arcPrefixMatch = analysisText.match(/^(.*Arc:)/i);
        if (arcPrefixMatch) {
            analysisText = analysisText.substring(arcPrefixMatch[1].length).trim();
        }
        analysisText = analysisText.replace(/^"|"$/g, '').trim();
        // Update actor's character arc
        actor.characterArc = analysisText || actor.characterArc;
        console.log(`Updated character arc for ${actor.name}: ${actor.characterArc}`);
    }
}


export default {
    SkitType: SkitType
};
