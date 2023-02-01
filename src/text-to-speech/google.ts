import {
    AudioResource,
    createAudioResource,
    StreamType,
} from "@discordjs/voice";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { Readable } from "node:stream";

export const textToSpeech = async (text: string): Promise<AudioResource> => {
    const client = new TextToSpeechClient();

    const [response] = await client.synthesizeSpeech({
        input: { text },
        voice: { languageCode: "ja-JP", name: "ja-JP-Standard-C" },
        audioConfig: { audioEncoding: "OGG_OPUS", volumeGainDb: -1.41 /* 85% */ },
    });

    if (response.audioContent == null) {
        throw new Error("failed to call Cloud Text-to-Speech");
    }

    const stream = Readable.from(response.audioContent);
    return createAudioResource(stream, { inputType: StreamType.OggOpus });
};
