// /oracle in chat: the Oracle's card (portrait, greeting, system menu) and the buttons under each reading.
import { available, systemByKey } from "./systems.js";
import { greeting, askLine } from "./voice.js";

export const ORACLE_COLOR = 0x2E1E68;
export const command = {
  name: "oracle",
  description: "Visit the Science is Magic Oracle: choose a system, give your details, receive your reading",
};

export const portraitUrl = (env) => (env.PUBLIC_URL || "https://science-is-magic-oracle.science-is-magic.workers.dev") + "/oracle.png";
export const author = (env) => ({ name: "The Oracle", icon_url: portraitUrl(env) });

/** Buttons shown under a reading (and on the menu card). */
export function readingButtons() {
  return [{ type: 1, components: [
    { type: 2, style: 1, custom_id: "oracle:menu", label: "Another reading", emoji: { name: "🔮" } },
    { type: 2, style: 2, custom_id: "oracle:chamber", label: "Enter the Chamber", emoji: { name: "✨" } },
  ] }];
}

/** The Oracle's menu card (ephemeral: only the visitor sees the menu; readings post to the channel). */
export function menuMessage(env, name, rand) {
  const systems = available();
  return {
    type: 4, data: {
      flags: 64,
      embeds: [{
        author: author(env), color: ORACLE_COLOR, thumbnail: { url: portraitUrl(env) },
        description: `*${greeting(name, rand)}*`,
        fields: [{ name: "Readings by question", value: systems.filter((s) => s.kind === "cast").map((s) => `${s.emoji} ${s.label}`).join(" · ") || "Coming soon" },
                 { name: "Readings by birth", value: systems.filter((s) => s.kind === "birth").map((s) => `${s.emoji} ${s.label}`).join(" · ") || "Coming soon" }],
        footer: { text: "Science is Magic · for reflection, not prediction" },
      }],
      components: [
        { type: 1, components: [{ type: 3, custom_id: "oracle:pick", placeholder: "Choose your oracle…",
          options: systems.map((s) => ({ label: s.label, value: s.key, description: s.hint, emoji: { name: s.emoji } })) }] },
        { type: 1, components: [readingButtons()[0].components[1]] },
      ],
    },
  };
}

/** Modal asking the question for a cast system. */
export function askModal(sys, name, rand) {
  return {
    type: 9, data: {
      custom_id: "ask:" + sys.key, title: `${sys.label} · Ask the Oracle`.slice(0, 45),
      components: [{ type: 1, components: [{ type: 4, custom_id: "question", style: 2, label: "Your question (optional)",
        placeholder: askLine(sys, name, rand).slice(0, 100), required: false, max_length: 200 }] }],
    },
  };
}

export { systemByKey };
