import OpenAI from "openai";

const c = new OpenAI();
const l = await c.models.list();
console.log(
  l.data
    .map((m) => m.id)
    .filter((i) => /gpt|^o\d|luna|sol/.test(i))
    .sort()
    .join("\n"),
);
