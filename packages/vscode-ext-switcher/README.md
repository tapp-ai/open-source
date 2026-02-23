# File Extension Switcher for VS Code

**File Extension Switcher** is a powerful and configurable Visual Studio Code extension that helps you seamlessly switch between companion files such as `.tsx` and `.scss`, or any other user-defined pairing. It supports customizable presets, fallback strategies, and companion file creation, making it ideal for developers working with modular, component-based project structures.

[Download latest .vsix](https://github.com/tapp-ai/open-source/releases/download/vscode-ext-switcher-0.0.1-alpha.2/vscode-ext-switcher-0.0.1-alpha.2.vsix)

## Features

- **Switch between companion files** (e.g., JS/TS ↔ CSS/SCSS)
- **Customizable presets** for matching file extensions and naming patterns
- **Fallback rules** like `index.tsx` ↔ `Component.module.scss`
- **Prompt to create missing companion files** with sensible defaults
- **Option to open in another editor column** for split-view workflows
- **Cycles through multiple matches** when more than one companion exists

## How It Works

When activated, the extension uses the current file's name and extension to look for companion files in the same folder based on a matching "preset." Presets define:

- Source and target extensions
- Fallback naming rules (e.g., `index.tsx` → `${DirectoryName}.module.scss`)
- Default file extension for creating new companion files

If no match is found, it falls back to patterns like using the parent directory name, and optionally prompts to create the companion file.

## Example

Suppose your project looks like this:

```plaintext
src/
└── components/
    └── NavigationBar/
        ├── index.tsx
        └── NavigationBar.module.scss
    └── shared/
        ├── Button.jsx
        └── Button.css
```

With the default presets, the extension will switch:

- From `index.tsx` → `NavigationBar.module.scss`
- From `NavigationBar.module.scss` → `index.tsx`
- From `Button.jsx` → `Button.css`
- From `Button.css` → `Button.jsx`

If any of those companion files don’t exist, you’ll be prompted to create one.

## Configuration

All configuration is done via your VS Code `settings.json` under the `extensionSwitcher` key.

### `presets` (Array)

Defines how file types relate. Each preset includes:

- `sourceExtensions`: Extensions to switch from (e.g. `[".tsx", ".jsx", ".ts", ".js"]`)
- `targetExtensions`: Extensions to switch to (e.g. `[".module.scss", ".css", ".scss"]`)
- `sourceDefaultName`: Fallback source file name (e.g. `"index"`)
- `targetDefaultName`: Fallback target file name (e.g. `"${dir}"`)
- `createSourceExtension`: Extension used when creating a missing source file (e.g. `".tsx"`)
- `createTargetExtension`: Extension used when creating a missing companion file (e.g. `".module.scss"`)
- `enableBidirectionalSwitch`: Allow switching from target back to source (default `true`)

Use `${dir}` in `sourceDefaultName` or `targetDefaultName` to dynamically reference the parent directory name.

By default, the extension includes a single bidirectional preset for common JS/TS and CSS/SCSS patterns. It assumes the JavaScript file is named `index` and the companion stylesheet uses the directory name. You can customize or add more presets as needed.

Default preset:

```json
"extensionSwitcher.presets": [
  {
    "sourceExtensions": [".tsx", ".jsx", ".ts", ".js"],
    "targetExtensions": [".module.scss", ".css", ".scss", ".sass", ".less"],
    "sourceDefaultName": "index",
    "targetDefaultName": "${dir}",
    "createSourceExtension": ".tsx",
    "createTargetExtension": ".module.scss",
    "enableBidirectionalSwitch": true
  }
]
```

### `useOtherColumn` (Boolean)

If enabled (`true`), the companion file opens in another editor column. Default: `true`.

```json
"extensionSwitcher.useOtherColumn": true
```

### `allowFileCreation` (Boolean)

If enabled (`true`), prompts to create a new companion file when none is found. Default: `true`.

```json
"extensionSwitcher.allowFileCreation": true
```

## Keybinding Setup

To bind the command to a shortcut:

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Choose: Preferences: Open Keyboard Shortcuts (JSON)
3. Add this to keybindings.json:

```json
{
  "key": "cmd+shift+c",
  "command": "extensionSwitcher.switchFile",
  "when": "editorTextFocus"
}
```

Now pressing `Cmd+Shift+C` will switch between companion files.

## Installation

### Download the latest Release

1. Download the latest `.vsix` file from the [Latest Release](https://github.com/tapp-ai/open-source/releases/tag/vscode-ext-switcher-0.0.1-alpha.2).
2. In VS Code, open the Extensions panel.
3. Click the ... menu → Install from VSIX…
4. Choose the downloaded `.vsix` file and install.
5. Reload VS Code to activate the extension.

### Build and Package Yourself

1. Download or clone the repository.
2. Run the following command from the root of the project:

   ```bash
   bun install
   ```

3. Run the following command from the `/packages/vscode-ext-switcher` directory to build the extension:

   ```bash
   bun run build
   ```

4. In VS Code, open the Extensions panel.
5. Click the ... menu → Install from VSIX…
6. Choose the generated .vsix file and install.

## Acknowledgements

Inspired by [meshcloud/vscode-file-ext-switcher](https://github.com/meshcloud/vscode-file-ext-switcher).

⸻

© 2025 Levi Kline / Conversion • Licensed under MIT
