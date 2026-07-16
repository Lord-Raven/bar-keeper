import React, {FC, useEffect, useState} from "react";
import {ThemeProvider} from "@mui/material";
import {Title} from "./Title";
import {PlayArea} from "./PlayArea";
import {Stage} from "./Stage";
import ErrorPopup from "./ErrorPopup";
import { ChatNode } from "./ChatNode";
import { NovelVisualizer } from "@lord-raven/novel-visualizer";

interface ScreenProps {
    stage: () => Stage;
}

export const Screen: FC<ScreenProps> = ({ stage }) => {
    const [onMenu, setOnMenu] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const sendError = (message: string) => {
        setErrorMessage(message);
        setTimeout(() => {setErrorMessage('')}, 5000);
    }

    const handleSetOnMenu = (onMenu: boolean) => {
        setOnMenu(onMenu);
    };

    useEffect(() => {}, [errorMessage]);

    return (
        <div style={{
            backgroundImage: stage().barImageUrl ? `url(${stage().barImageUrl})` : '',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            width: '100vw',
            height: '100vh',
            color: '#ffffff'
        }}>
            <ErrorPopup message={errorMessage}/>
            <ThemeProvider theme={stage().theme}>
                {onMenu ? (
                        <Title stage={stage} setOnMenu={handleSetOnMenu} setErrorMessage={sendError}/>
                ) : (
                    <NovelVisualizer
                        skit={skit}
                        loading={isLoading}
                        renderNameplate={(actor: any) => {
                            if (!actor || !actor.name) return null;
                            return <Nameplate
                                actor={actor}
                                size={isVerticalLayout ? 'medium' : 'large'}
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 5
                                }}
                                role={(() => {
                                    const roleModules = stage().getSave().layout.getModulesWhere((m: any) =>
                                        m && m.type !== 'quarters' && m.ownerId === actor.id
                                    );
                                    return roleModules.length > 0 ? roleModules[0].getAttribute('role') : undefined;
                                })()}
                                layout="inline"
                            />;
                        }}
                        setTooltip={setTooltip}
                        isVerticalLayout={isVerticalLayout}
                        actors={actors}
                        playerActorId={'player'}
                        getPresentActors={(_script, _index) =>
                            getActorsAtIndex(_script, _index, stage().getSave().actors) || []
                        }
                        getActorImageUrl={(actor, _script, index) => {
                            let emotion = Emotion.neutral;

                            if (skit.script && skit.script.length > 0 && index < skit.script.length) {
                                for (let j = index; j >= 0; j--) {
                                    const entry = skit.script[j];
                                    if (entry.actorEmotions && entry.actorEmotions[actor.name]) {
                                        emotion = entry.actorEmotions[actor.name];
                                        break;
                                    }
                                }
                            }

                            const outfitId = getActorOutfitsAtIndex(_script, index, stage().getSave().actors)[actor.id] || actor.outfitId;
                            return actor.getEmotionImage(emotion, stage(), outfitId);
                        }}
                        getActorFilter={(actor, _script, index) => {
                            const actorLocationId = (() => {
                                const locations = _script.initialActorLocations || {};
                                let currentLocationId = locations[actor.id] || '';
                                for (let i = 0; i <= index && i < _script.script.length; i++) {
                                    const entry = _script.script[i];
                                    if (entry.movements && entry.movements[actor.id]) {
                                        currentLocationId = entry.movements[actor.id];
                                    }
                                }
                                return currentLocationId;
                            })();

                            const useHoloFilter = isHologram(actor, stage().getSave(), actorLocationId);

                            return {
                                filter: useHoloFilter ? 'hologram' : undefined,
                                filterColor: useHoloFilter ? clampHexColor(actor.themeColor) : undefined,
                            };
                        }}
                        onSubmitInput={handleSkitSubmit}
                        onSkitChange={onSkitChange}
                        getSubmitButtonConfig={(_script, index, inputText) => {
                            return {
                                label: inputText.trim().length > 0 ? 'Send' : 'Continue',
                                enabled: true,
                                colorScheme: inputText.trim().length > 0 ? 'secondary' : 'primary',
                                icon: inputText.trim().length > 0 ? <Send /> : <PlayArrow />,
                            };
                        }}
                        enableAudio={isTextToSpeechEnabled && isAudioEnabled}
                        enablePopInSpeakers={true}
                        enableTalkingAnimation={true}
                        responsiveOverlay={(skit, actor) => {
                            return (
                                <div>
                                    <AnimatePresence mode="wait">
                                        {actor && actor.id != 'player' && (
                                            <motion.div
                                                key={`actor-card-${actor.id}`}
                                                initial={{ opacity: 0, x: -100 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -100 }}
                                                transition={{ duration: 0.28, ease: 'easeInOut' }}
                                            >
                                                <div style={{
                                                    position: 'relative',
                                                    maxWidth: isVerticalLayout ? '30vw' : '15vw',
                                                    right: 0,
                                                    top: 0
                                                }}>
                                                    <ActorCard
                                                        actor={actor}
                                                        visitingFaction={undefined}
                                                        role={getRole(actor, stage().getSave())}
                                                        collapsedSections={[ActorCardSection.STATS]}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence mode="wait">
                                        {accumulatedOutcomes.length > 0 && (
                                            <SkitOutcomeDisplay
                                                key={outcomesAnimationKey}
                                                outcomes={accumulatedOutcomes}
                                                stage={stage()}
                                                layout={stage().getSave().layout}
                                                isOutcomeTransient={(skit && skit.script && skit.currentIndex === skit.script.length - 1 && skit.outcomes && skit.outcomes.length > 0) || false}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        }}
                    />
                    /*<PlayArea
                        advance={(setErrorMessage: (message: string) => void) => stage().advanceMessage(setErrorMessage)}
                        regen={(targetNode: ChatNode, setErrorMessage: (message: string) => void) => stage().regenMessage(targetNode, setErrorMessage)}
                        reverse={() => stage().reverseMessage()}
                        stage={stage}
                        setOnMenu={handleSetOnMenu}
                        setErrorMessage={sendError}
                    />*/
                )}
            </ThemeProvider>
        </div>
    );
}