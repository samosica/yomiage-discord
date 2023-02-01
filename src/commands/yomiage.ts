import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    Message,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
} from "discord.js";
import {
    AudioResource,
    createAudioPlayer,
    entersState,
    getVoiceConnection,
    joinVoiceChannel,
    VoiceConnectionStatus,
} from "@discordjs/voice";
import { attachBufferToPlay } from "../utilities";
import { askGPT3 } from "../gpt-3";
import { changeVoice, getAvailableVoiceDescriptions, getVoice } from "../voice";

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

        const voice = getVoice();
        const retrieval = voice.speak(message.content).catch((e) => {
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

                const voice = getVoice();
                const resource = await voice.speak(response);
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

export const VoiceChangeMessageComponents = {
    VoiceSelectMenu: "voice-select-menu",
} as const;

const showVoiceChangeMessage = async (
    interaction: ChatInputCommandInteraction,
) => {
    const options = getAvailableVoiceDescriptions().map(({ id, name }) => ({
        label: name,
        value: id,
    }));
    const selectMenuRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(VoiceChangeMessageComponents.VoiceSelectMenu)
                .setPlaceholder("声の候補")
                .addOptions(options)
                .setMinValues(1)
                .setMaxValues(1),
        );

    await interaction.reply({
        ephemeral: true,
        content: "どの声で読み上げましょうか？",
        components: [selectMenuRow],
    });
};

export const onSelectVoice = async (
    interaction: StringSelectMenuInteraction,
) => {
    await interaction.update({
        content: "読み上げのスタイルを変えています…",
        components: [],
    });

    const [voiceId] = interaction.values;
    changeVoice(voiceId);

    await interaction.editReply({
        content: "読み上げのスタイルが変わりました",
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
        case "voicechange": {
            await showVoiceChangeMessage(interaction);
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
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("voicechange")
                .setDescription("Change the voice"),
        ),
};
