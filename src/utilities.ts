import {
    AudioPlayer,
    AudioResource,
    AudioPlayerStatus,
    entersState,
} from "@discordjs/voice";

/**
 * Create a function playing sounds without any cancellations
 *
 * Note: AudioPlayer.play cancels a sound when it receives a new sound
 * @param player
 * @returns buffered play function
 */
export const attachBufferToPlay = <T>(player: AudioPlayer) => {
    const buffer: Array<Promise<AudioResource<T> | null>> = [];

    player.on(AudioPlayerStatus.Idle, () => {
        const handler = async () => {
            const resourceRetrieval = buffer.shift();

            if (resourceRetrieval === undefined) {
                return;
            }

            const resource = await resourceRetrieval;

            if (resource !== null) {
                player.play(resource);
            }
        };
        handler().catch(() => {});
    });

    const bufferedPlay = async (
        resourceRetrieval: Promise<AudioResource<T> | null>,
    ) => {
        try {
            await entersState(player, AudioPlayerStatus.Playing, 200);
            buffer.push(resourceRetrieval);
        } catch (e) {
            try {
                const resource = await resourceRetrieval;

                if (resource !== null) {
                    player.play(resource);
                }
            } catch (e2) {
                console.error(e2);
            }
        }
    };

    return bufferedPlay;
};
