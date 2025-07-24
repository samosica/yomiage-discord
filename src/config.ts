import { either } from "fp-ts";
import * as t from "io-ts";
import { readFileSync } from "node:fs";

const ConfigCodec = t.type({
    discord: t.type({
        token: t.string,
        clientId: t.string,
        guildId: t.string,
    }),
    openAI: t.type({
        apiKey: t.string,
    }),
});

export type Config = t.TypeOf<typeof ConfigCodec>;

const loadConfigFromFile = (path: string): Config => {
    const v = ConfigCodec.decode(
        JSON.parse(readFileSync(path, { encoding: "utf-8" })),
    );

    if (either.isLeft(v)) {
        throw new Error(`invalid format: ${path}`);
    }

    return v.right;
};

const loadConfigFromEnvVars = (): Config => {
    const REQUIRED_ENVVARS = [
        "DISCORD_TOKEN",
        "DISCORD_CLIENT_ID",
        "DISCORD_GUILD_ID",
        "OPENAI_API_KEY",
    ];
    const missingEnvVars = REQUIRED_ENVVARS.filter(
        (name) => process.env[name] === undefined,
    );

    if (missingEnvVars.length > 0) {
        throw new Error(
            `Missing environment variables: ${missingEnvVars.join(", ")}`,
        );
    }

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    return {
        discord: {
            token: process.env.DISCORD_TOKEN!,
            clientId: process.env.DISCORD_CLIENT_ID!,
            guildId: process.env.DISCORD_GUILD_ID!,
        },
        openAI: {
            apiKey: process.env.OPENAI_API_KEY!,
        },
    };
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
};

export const config = (() => {
    if (process.env.NODE_ENV === "development") {
        console.log("load config from environment variables");
        return loadConfigFromEnvVars();
    }

    const configFile = process.env.YOMIAGE_DISCORD_CONFIG ?? "config.json";
    console.log(`load config from ${configFile}`);
    return loadConfigFromFile(configFile);
})();
