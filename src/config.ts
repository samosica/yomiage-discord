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

export const config = (() => {
    const configFile = process.env.YOMIAGE_DISCORD_CONFIG ?? "config.json";
    const v = ConfigCodec.decode(
        JSON.parse(readFileSync(configFile, { encoding: "utf-8" })),
    );

    if (either.isLeft(v)) {
        throw new Error(`invalid format: ${configFile}`);
    }

    return v.right;
})();
