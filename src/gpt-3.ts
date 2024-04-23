import OpenAI from "openai";
import { config } from "./config";

export const askGPT3 = async (prompt: string) => {
    const openAI = new OpenAI({
        apiKey: config.openAI.apiKey,
    });
    const response = await openAI.chat.completions.create({
        model: "text-davinci-003",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 120,
    });
    const { choices } = response;

    if (choices?.[0]?.message?.content == null) {
        throw new Error("unexpected error");
    }

    return choices[0].message.content;
};
