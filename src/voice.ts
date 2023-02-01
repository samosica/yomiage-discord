import { AudioResource } from "@discordjs/voice";
import * as googleTTS from "./text-to-speech/google";

export type Voice = Readonly<{
    id: string;
    name: string;
    speak(text: string): Promise<AudioResource>;
}>;

export type VoiceDescription = Readonly<{
    id: string;
    name: string;
}>;

const googleTextToSpeechVoice: Voice = {
    id: "google-text-to-speech",
    name: "Google Text-to-Speech",
    speak: googleTTS.textToSpeech,
};

const availableVoices: ReadonlyArray<Voice> = [googleTextToSpeechVoice];

export const getAvailableVoiceDescriptions =
    (): ReadonlyArray<VoiceDescription> =>
        availableVoices.map(({ id, name }) => ({ id, name }));

let currentVoice: Voice = googleTextToSpeechVoice;

export const getVoice = () => currentVoice;

export const changeVoice = (id: string) => {
    const voice = availableVoices.find((v) => v.id === id);
    if (voice === undefined) {
        throw new Error(`invalid voice id: ${id}`);
    }
    currentVoice = voice;
};
