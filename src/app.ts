import { Client, Events, GatewayIntentBits } from "discord.js";
import { commands } from "./commands";
import {
    onSelectVoice,
    VoiceChangeMessageComponents,
} from "./commands/yomiage";
import { config } from "./config";

// References:
// - https://discord.com/developers/docs/change-log#message-content-is-a-privileged-intent (MessageContent)
// - https://discordjs.guide/voice/voice-connections.html#playing-audio (GuildVoiceStates)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (!interaction.isChatInputCommand()) {
            return;
        }
        const command = commands.find(
            (c) => c.spec.name === interaction.commandName,
        );
        if (command === undefined) {
            return;
        }
        await command.handler(interaction);
    } catch (e) {
        console.error(e);
    }
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (!interaction.isStringSelectMenu()) {
            return;
        }
        if (
            interaction.customId !==
            VoiceChangeMessageComponents.VoiceSelectMenu
        ) {
            return;
        }

        await onSelectVoice(interaction);
    } catch (e) {
        console.error(e);
    }
});

(async () => {
    try {
        await client.login(config.discord.token);
    } catch (e) {
        console.error(e);
    }
})();
