const PROFILE_OC = String.raw`C:\Users\Pans0020\.config\opencode`;
const PROFILE_OMO = String.raw`C:\Users\Pans0020\.config\opencode-omo`;

const PROFILE_OC_POSIX = "C:/Users/Pans0020/.config/opencode";
const PROFILE_OMO_POSIX = "C:/Users/Pans0020/.config/opencode-omo";

const SYSTEM_RULE = [
  "OpenCode dual-profile guard:",
  "- This machine has two OpenCode profiles that must stay in sync for OpenCode extensions and configuration.",
  `- Primary profile: ${PROFILE_OC}`,
  `- OMO profile: ${PROFILE_OMO}`,
  "- When installing, updating, removing, or configuring OpenCode skills, hooks, plugins, MCP servers, commands, agents, prompts, scripts, package dependencies, or opencode.json settings, apply the change to both profiles.",
  "- Before claiming completion, verify both profiles were updated or explicitly explain why one profile does not need the change.",
].join("\n");

const CONFIG_KEYWORDS = [
  "skill",
  "skills",
  "hook",
  "hooks",
  "plugin",
  "plugins",
  "mcp",
  "command",
  "commands",
  "agent",
  "agents",
  "prompt",
  "prompts",
  "script",
  "scripts",
  "opencode.json",
  "oh-my-openagent.json",
  "package.json",
  "package-lock.json",
];

const WRITE_TOOLS = new Set([
  "apply_patch",
  "bash",
  "edit",
  "write",
  "delete",
  "patch",
  "update",
  "create",
]);

function stringifyArgs(args) {
  try {
    return JSON.stringify(args ?? "");
  } catch {
    return String(args ?? "");
  }
}

function normalizeText(value) {
  return String(value ?? "").replace(/\\\\/g, "\\").toLowerCase();
}

function mentionsOc(text) {
  return text.includes(PROFILE_OC.toLowerCase()) || text.includes(PROFILE_OC_POSIX.toLowerCase());
}

function mentionsOmo(text) {
  return text.includes(PROFILE_OMO.toLowerCase()) || text.includes(PROFILE_OMO_POSIX.toLowerCase());
}

function isRelevantConfigChange(text) {
  return CONFIG_KEYWORDS.some((keyword) => text.includes(keyword));
}

function shouldInspectTool(toolName) {
  const normalized = String(toolName ?? "").toLowerCase();
  return WRITE_TOOLS.has(normalized) || normalized.includes("write") || normalized.includes("edit") || normalized.includes("patch");
}

function buildError(mentionedOc, mentionedOmo) {
  const missing = mentionedOc ? PROFILE_OMO : PROFILE_OC;
  const present = mentionedOc ? PROFILE_OC : PROFILE_OMO;
  return [
    "Dual OpenCode profile guard blocked this operation.",
    "",
    `The tool call appears to modify OpenCode extension/configuration state in only one profile: ${present}`,
    `You must also update the paired profile: ${missing}`,
    "",
    "If this single-profile change is intentional, explicitly state why the other profile does not need the change and retry with both paths or a clear exception.",
  ].join("\n");
}

export const DualProfileGuardPlugin = async () => {
  return {
    "experimental.chat.system.transform": async (_input, output) => {
      if (!Array.isArray(output.system)) {
        output.system = [];
      }
      if (!output.system.some((item) => String(item).includes("OpenCode dual-profile guard:"))) {
        output.system.push(SYSTEM_RULE);
      }
    },

    "tool.execute.before": async (input, output) => {
      if (!shouldInspectTool(input.tool)) {
        return;
      }

      const text = normalizeText(stringifyArgs(output.args));
      if (!isRelevantConfigChange(text)) {
        return;
      }

      const mentionedOc = mentionsOc(text);
      const mentionedOmo = mentionsOmo(text);
      if (mentionedOc !== mentionedOmo) {
        throw new Error(buildError(mentionedOc, mentionedOmo));
      }
    },
  };
};
