import { OpenAIApi, Configuration } from "openai";
import { config } from "./config";

export const askGPT3 = async (prompt: string) => {
    const openAIAPI = new OpenAIApi(
        new Configuration({
            apiKey: config.openAI.apiKey,
        }),
    );
    const response = await openAIAPI.createCompletion({
        model: "text-davinci-003",
        prompt,
        temperature: 0,
        max_tokens: 120,
    });
    const { choices } = response.data;

    if (choices?.[0]?.text === undefined) {
        throw new Error("unexpected error");
    }

    return choices[0].text;
};
