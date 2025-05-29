# vscode-style-ext-switcher

## Introduction

`vscode-style-ext-switcher` is a Visual Studio Code extension designed to
streamline switching between companion JavaScript (or TypeScript) and CSS (or
SCSS) files. This extension is particularly useful for developers working with
React or other frameworks where related files frequently share the same base
name but have different extensions.

## Features

- **Switch between JS/TS and CSS/SCSS files**: Quickly switch between
  JavaScript/TypeScript and CSS/SCSS files with matching base names.
- **Directory name fallback**: When editing a file, if no matching files are
  found using the current file name, the extension will search using the parent
  directory name as the base name. See below for more details.
- **Create companion files**: When editing a Javascript/TypeScript file, if no
  companion CSS file exists, you will be prompted to create one.

## Example Directory Structure

Consider a project structure where you have a `NavigationBar` component folder
containing `index.tsx` and `NavigationBar.module.scss`. This is a typical
scenario where `vscode-style-ext-switcher` proves useful.

```plaintext
my-project/
├── src/
│   ├── components/
│   │   ├── NavigationBar/
│   │   │   ├── index.tsx
│   │   │   ├── NavigationBar.module.scss
```

With the appropriate keybinding set up, you can quickly switch between
`index.tsx` and `NavigationBar.module.scss`:

1. **Open `index.tsx`**: Start by opening `index.tsx` in the editor.
2. **Invoke Keybinding**: Use your configured keybinding (e.g., `cmd+shift+c`)
   to switch to the corresponding `NavigationBar.module.scss` file.

If `NavigationBar.module.scss` does not exist, you will be prompted to create
it, ensuring a smooth workflow.

## Directory Name Fallback

### JavaScript/TypeScript Files

When editing a JavaScript file, the extension will search for a corresponding
CSS file with the same base name. If no matching files are found and the current
working file is in the form `index.xxx`, the extension will use the parent
directory name as the base name for searching. If no companion file is found,
the extension will prompt you to create a new CSS file.

### CSS/SCSS Files

When editing a CSS file, the extension will search for a corresponding JS file
with the same base name. If no matching files are found, the extension will then
search for a corresponding `index.xxx` JavaScript file in the parent directory.

## Keybinding Setup

To use `vscode-style-ext-switcher`, you need to set up custom keybindings. This
allows you to quickly switch between related files with a single keystroke.

### Available Arguments

- `cssExtension`: Specifies the default extension for the CSS/SCSS companion
  file when creating a new CSS file. Default: `.css`
- `useDirectoryName`: A boolean flag indicating whether to use the directory
  name as the base name if no matching files are found. Default: `true`
- `useOtherColumn`: A boolean flag indicating whether to open the companion file
  in another editor column. Default: `false`

Note: the `cssExtension` argument is only for creating new files. The extension
will still search for existing files using all supported extensions.

### Example Keybindings

These shortcuts open a companion file, with options to open it in another editor
column:

To set up keybindings, open the Command Palette (`Cmd+Shift+P` or
`Ctrl+Shift+P`) and search for "Preferences: Open Keyboard Shortcuts (JSON)".
Add the following JSON configuration to your `keybindings.json` file:

```json
{
  "key": "cmd+shift+c",
  "command": "styleswitch",
  "args": {
    "cssExtension": ".module.scss",
    "useDirectoryName": true,
    "useOtherColumn": true
  },
  "when": "editorTextFocus"
},
{
  "key": "cmd+shift+d",
  "command": "styleswitch",
  "args": {
    "cssExtension": ".scss",
    "useDirectoryName": true,
    "useOtherColumn": true
  },
  "when": "editorTextFocus"
}
```

## Supported File Extensions

The `vscode-style-ext-switcher` extension supports the following file
extensions:

- JavaScript: `.js`, `.jsx`, `.ts`, `.tsx`
- CSS: `.module.scss`, `.css`, `.scss`, `.sass`, `.less`

## Usage

Once the extension is installed and keybindings are set up, use your configured
keybinding to switch between companion files.

### Finding Companion Files

When invoked, the command will look for files in the same directory as the
current file, matching the specified extensions. If no matching files are found,
it will fall back to using the parent directory name as the base name.

### Cycle Through Companion Files

This command cycles through matching companion files within the same directory:

### Creating Companion Files

If no companion file exists, you will be prompted to create one. Enter the
desired name for the new file, and it will be created and opened in a new editor
column.

## Installation

1. Open the Extensions panel in Visual Studio Code.
2. Click on the three dots in the top right corner and select "Install from
   VSIX..."
3. Select the `vscode-style-ext-switcher-1.0.0.vsix` file from your file system
   and click "Install".

## Contributing

Please report issues and submit pull requests to the [vscode-style-ext-switcher
GitHub repository](https://github.com/levikline/vscode-file-ext-switcher).

In order to compile the extension locally during development, you will need to
run `npm install` and `npm run package` to generate a `.vsix` file.

## Acknowledgements

This extension was inspired by the original
[meshcloud/vscode-file-ext-switcher](https://github.com/meshcloud/vscode-file-ext-switcher)
but has been reimagined and rewritten to support specific use cases involving
JavaScript/TypeScript and CSS/SCSS file switching.
