# lexical-unicode-plugin

A small, configurable plugin for the [Lexical](https://lexical.dev) editor that automatically replaces common ASCII sequences (like `->`, `!=`, `<=`) with their Unicode equivalents (`→`, `≠`, `≤`) in real-time.

## Features

- Replaces ASCII sequences with Unicode symbols as you type
- Customizable replacement patterns
- Lightweight and easy to integrate with Lexical

## Installation

```bash
npm install lexical-unicode-plugin
```

## Usage

```tsx
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { UnicodePlugin } from "lexical-unicode-plugin";

const editorConfig = {
  // your Lexical configuration
};

export default function Editor() {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      {/_ Your other plugins _/}
      <UnicodePlugin />
    </LexicalComposer>
  );
}
```

### Custom Replacements

You can customize the replacements by passing your own list of patterns:

```tsx
<UnicodePlugin
  replacements={[
    { pattern: /<3/g, symbol: "❤️" },
    { pattern: /->/g, symbol: "→" },
  ]}
/>
```

### Default Replacements

By default, the plugin replaces the following sequences:

```plaintext
ASCII Unicode
-> →
<- ←
<-> ↔
!= ≠
== ≡
=> ⇒
~= ≈
<= ≤
= ≥
+- ±
-- —
```

## TypeScript

The plugin is written in TypeScript and includes full type definitions.

```ts
export type UnicodeReplacement = {
  pattern: RegExp;
  symbol: string;
};
```

## Internals

- Uses TextNode transforms to perform replacements
- Preserves selection position after text substitution
- Efficient and declarative – only updates nodes that match a pattern

## License

MIT
