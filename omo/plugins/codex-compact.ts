import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROMPT_FILE = "codex-compact-prompt.md";
const GLOBAL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const CodexCompactPlugin = async (_ctx: { directory: string }) => {
  return {
    async "experimental.session.compacting"(_input: { sessionID: string }, output: { context: string[]; prompt?: string }) {
      const promptPath = path.join(GLOBAL_DIR, PROMPT_FILE);
      const prompt = await fs.readFile(promptPath, "utf8");
      if (!prompt.trim()) {
        throw new Error(`Codex compact prompt is empty: ${promptPath}`);
      }

      output.prompt = [
        prompt.trim(),
        "",
        "---",
        "OpenCode + OhMyOpenAgent continuation requirements:",
        "- Preserve the current objective and the user's explicit constraints.",
        "- Preserve current progress, completed work, and remaining work.",
        "- Preserve key decisions, repository conventions, and relevant configuration details.",
        "- Preserve files modified or created during the session.",
        "- Preserve failed commands, test results, verification status, and known blockers.",
        "- End with concrete next actions for the next agent.",
      ].join("\n");
    },
  };
};
