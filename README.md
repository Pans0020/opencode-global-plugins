# OpenCode Global Plugins

This repository contains exported OpenCode global plugin files from two local profiles:

- Primary profile: `C:\Users\Pans0020\.config\opencode`
- OMO profile: `C:\Users\Pans0020\.config\opencode-omo`

## Files

```text
primary/plugins/codex-compact.ts
primary/plugins/dual-profile-guard.js
primary/plugins/pans-image-tool.js
omo/plugins/codex-compact.ts
omo/plugins/dual-profile-guard.js
omo/plugins/pans-image-tool.js
```

## Usage

Copy the plugin file you want into your OpenCode global `plugins` directory, then reference it from `opencode.json` with a `file://` URL, for example:

```json
{
  "plugin": [
    "file:///C:/Users/<you>/.config/opencode/plugins/codex-compact.ts",
    "file:///C:/Users/<you>/.config/opencode/plugins/pans-image-tool.js"
  ]
}
```

For the OMO profile, point the `file://` path at that profile's plugin directory.

## Current local plugin entries

Primary profile:

```json
{
  "plugin": [
    "file:///C:/Users/Pans0020/.config/opencode/plugins/codex-compact.ts",
    "file:///C:/Users/Pans0020/.config/opencode/plugins/pans-image-tool.js"
  ]
}
```

OMO profile:

```json
{
  "plugin": [
    "oh-my-openagent",
    "file:///C:/Users/Pans0020/.config/opencode-omo/plugins/codex-compact.ts",
    "file:///C:/Users/Pans0020/.config/opencode-omo/plugins/pans-image-tool.js"
  ]
}
```

## Notes

- `codex-compact.ts` reads `codex-compact-prompt.md` from the parent global config directory.
- `dual-profile-guard.js` injects and enforces a reminder that both OpenCode profiles should stay in sync for extension/configuration changes.
- `pans-image-tool.js` expects `scripts/generate_pans_image.py` under the primary OpenCode profile and requires `@opencode-ai/plugin` at runtime.

Sensitive OpenCode configuration such as `opencode.json`, provider keys, MCP tokens, and local package dependencies are intentionally not included.
