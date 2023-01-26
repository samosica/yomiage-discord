import {
    ChatInputCommandInteraction,
    Message,
    SlashCommandBuilder,
} from "discord.js";
import {
    AudioResource,
    createAudioPlayer,
    entersState,
    getVoiceConnection,
    joinVoiceChannel,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import { textToSpeech } from "../text-to-speech/google";
import { attachBufferToPlay } from "../utilities";
import { askGPT3 } from "../gpt-3";

const buildNormalMessageHandler = (
    play: (resourceRetrieval: Promise<AudioResource | null>) => Promise<void>,
) => {
    const messageCount: Record<string, number> = {};
    const MAX_MESSAGE_COUNT = 3;
    const MAX_MESSAGE_LENGTH = 300;

    const handler = async (message: Message) => {
        const authorId = message.author.id;
        if ((messageCount[authorId] ?? 0) >= MAX_MESSAGE_COUNT) {
            await message.reply("読み上げ回数の上限に達しました :bow:");
            return;
        }
        messageCount[authorId] = (messageCount[authorId] ?? 0) + 1;

        if (message.content.length > MAX_MESSAGE_LENGTH) {
            await message.reply(
                `${MAX_MESSAGE_LENGTH}文字より長いメッセージは読み上げません :bow:`,
            );
            return;
        }

        const retrieval = textToSpeech(message.content).catch((e) => {
            console.error(e);
            return null;
        });
        await play(retrieval);
    };

    return handler;
};

const buildMentionMessageHandler = (
    play: (resourceRetrieval: Promise<AudioResource | null>) => Promise<void>,
) => {
    const messageCount: Record<string, number> = {};
    const MAX_MESSAGE_COUNT = 10;
    const MAX_PROMPT_LENGTH = 150;

    const handler = async (message: Message) => {
        const authorId = message.author.id;
        if ((messageCount[authorId] ?? 0) >= MAX_MESSAGE_COUNT) {
            await message.reply("質問回数の上限に達しました :bow:");
            return;
        }
        messageCount[authorId] = (messageCount[authorId] ?? 0) + 1;

        const chunks = message.content.split(/\s+/);
        if (chunks.length <= 1) {
            return;
        }
        const prompt = chunks[1];

        if (prompt.length > MAX_PROMPT_LENGTH) {
            await message.reply(
                `${MAX_PROMPT_LENGTH}文字より長い質問には答えられません :bow:`,
            );
            return;
        }

        const retrieval = async () => {
            try {
                const response = await askGPT3(prompt);
                await message.reply(response);

                const resource = await textToSpeech(response);
                return resource;
            } catch (e) {
                console.error(e);
                return null;
            }
        };
        await play(retrieval());
    };
    return handler;
};

const startYomiage = async (interaction: ChatInputCommandInteraction) => {
    const { channel, guild } = interaction;

    if (!guild || !channel || !channel.isVoiceBased()) {
        await interaction.reply({
            content:
                "`/yomiage start`コマンドはボイスチャンネルのチャット内で実行してください",
            ephemeral: true,
        });
        return;
    }

    if (!channel.joinable) {
        await interaction.reply({
            content: "ボイスチャンネルに参加できないようです",
            ephemeral: true,
        });
        return;
    }

    if (!channel.speakable) {
        await interaction.reply({
            content: "音が流せないようです",
            ephemeral: true,
        });
        return;
    }

    await interaction.reply({
        content: `${channel.name}に接続しています…`,
        ephemeral: true,
    });

    const connection = joinVoiceChannel({
        guildId: guild.id,
        channelId: channel.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    } catch (e) {
        await interaction.editReply("接続の確立に失敗しました");
        throw e;
    }

    await interaction.editReply("接続成功！");

    const player = createAudioPlayer();
    connection.subscribe(player);

    const messageCollector = channel.createMessageCollector({
        filter: (m) => !m.author.bot,
    });
    const bufferedPlay = attachBufferToPlay(player);
    const mentionMessageHandler = buildMentionMessageHandler(bufferedPlay);
    const normalMessageHandler = buildNormalMessageHandler(bufferedPlay);

    messageCollector.on("collect", async (message) => {
        if (
            message.mentions.users.some((u) =>
                u.equals(interaction.client.user),
            )
        ) {
            await mentionMessageHandler(message);
        } else {
            await normalMessageHandler(message);
        }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
        messageCollector.stop();
    });
};

const stopYomiage = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) {
        return;
    }

    const connection = getVoiceConnection(interaction.guild.id);
    if (!connection) {
        return;
    }
    connection.destroy();

    await interaction.reply({
        content: "読み上げるのをやめました",
        ephemeral: true,
    });
};

const onYomiage = async (interaction: ChatInputCommandInteraction) => {
    switch (interaction.options.getSubcommand()) {
        case "start": {
            await startYomiage(interaction);
            break;
        }
        case "stop": {
            await stopYomiage(interaction);
            break;
        }
        default: {
            break;
        }
    }
};

export const yomiage = {
    handler: onYomiage,
    spec: new SlashCommandBuilder()
        .setName("yomiage")
        .setDescription("Read comments in chat")
        .addSubcommand((subcommand) =>
            subcommand.setName("start").setDescription("Start reading"),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("stop").setDescription("Stop reading"),
        ),
};
