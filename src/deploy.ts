import { REST, Routes } from "discord.js";
import { config } from "./config";
import { commands } from "./commands";

export const deployCommands = async () => {
    const rest = new REST({ version: "10" }).setToken(config.discord.token);

    const result = await rest.put(
        Routes.applicationGuildCommands(
            config.discord.clientId,
            config.discord.guildId,
        ),
        { body: commands.map((c) => c.spec) },
    );

    if (!Array.isArray(result)) {
        throw Error("unexpected error");
    }

    console.log(
        `Register ${result.length} commands: ${result
            // eslint-disable-next-line max-len
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
            .map((c) => c.name)
            .join(", ")}`,
    );
};

(async () => {
    try {
        await deployCommands();
    } catch (e) {
        console.error(e);
    }
})();
