import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { tool } from "@opencode-ai/plugin";


const SCRIPT_PATH = path.join(
  os.homedir(),
  ".config",
  "opencode",
  "scripts",
  "generate_pans_image.py",
);
const DEFAULT_SIZE = "1024x1024";
const DEFAULT_QUALITY = "medium";
const DEFAULT_BACKGROUND = "opaque";


function buildPythonCandidates() {
  const home = os.homedir();
  const candidates = [];
  const bundledWindows = path.join(
    home,
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "python",
    "python.exe",
  );
  const bundledUnix = path.join(
    home,
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "python",
    "bin",
    "python3",
  );

  if (process.env.CODEX_PYTHON) {
    candidates.push({ command: process.env.CODEX_PYTHON, args: [] });
  }
  if (fs.existsSync(bundledWindows)) {
    candidates.push({ command: bundledWindows, args: [] });
  }
  if (fs.existsSync(bundledUnix)) {
    candidates.push({ command: bundledUnix, args: [] });
  }

  candidates.push({ command: "python", args: [] });
  if (process.platform === "win32") {
    candidates.push({ command: "py", args: ["-3"] });
  } else {
    candidates.push({ command: "python3", args: [] });
  }
  return candidates;
}


function normalizeFailure(result) {
  const pieces = [result.stderr, result.stdout]
    .map((item) => (item || "").trim())
    .filter(Boolean);
  return pieces.join("\n") || `Image generator exited with code ${result.status}.`;
}


function runGenerator({ prompt, size, quality, background, outputDir, directory }) {
  if (!fs.existsSync(SCRIPT_PATH)) {
    throw new Error(`Image script not found: ${SCRIPT_PATH}`);
  }

  let lastFailure = null;
  for (const candidate of buildPythonCandidates()) {
    const result = spawnSync(
      candidate.command,
      [
        ...candidate.args,
        SCRIPT_PATH,
        prompt,
        "--size",
        size,
        "--quality",
        quality,
        "--background",
        background,
        "--output-dir",
        outputDir,
      ],
      {
        cwd: directory,
        encoding: "utf-8",
        windowsHide: true,
      },
    );

    if (result.error) {
      if (result.error.code === "ENOENT") {
        lastFailure = result.error;
        continue;
      }
      throw new Error(result.error.message);
    }

    if (result.status === 0) {
      const lines = (result.stdout || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const savedPath = lines.at(-1);
      if (!savedPath) {
        throw new Error("Image script succeeded but did not return a saved file path.");
      }
      return savedPath;
    }

    lastFailure = new Error(normalizeFailure(result));
  }

  if (lastFailure?.code === "ENOENT") {
    throw new Error(
      "No usable Python interpreter was found. Set CODEX_PYTHON or install a Python runtime that OpenCode can execute.",
    );
  }
  throw lastFailure || new Error("Image generation failed before the script could start.");
}


export const PansImageToolPlugin = async () => {
  return {
    tool: {
      generate_image: tool({
        description: "Generate an image with the configured Pans provider and save it into the current project images directory.",
        args: {
          prompt: tool.schema.string().min(1).describe("Prompt to send to the image model."),
          size: tool.schema
            .enum(["1024x1024", "1536x1024", "1024x1536", "auto"])
            .optional()
            .describe("Optional image size."),
          quality: tool.schema
            .enum(["low", "medium", "high", "auto"])
            .optional()
            .describe("Optional image quality."),
          background: tool.schema
            .enum(["opaque", "transparent", "auto"])
            .optional()
            .describe("Optional image background mode."),
        },
        async execute(args, context) {
          const outputDir = path.join(context.directory, "images");
          const savedPath = runGenerator({
            prompt: args.prompt,
            size: args.size ?? DEFAULT_SIZE,
            quality: args.quality ?? DEFAULT_QUALITY,
            background: args.background ?? DEFAULT_BACKGROUND,
            outputDir,
            directory: context.directory,
          });

          context.metadata({
            title: "Image generated",
            metadata: {
              path: savedPath,
              outputDir,
            },
          });
          return savedPath;
        },
      }),
    },
  };
};
