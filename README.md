# vitepress-plugin-previews

No-dependencies [VitePress](https://vitepress.dev/) plugin for displaying static previews of code groups built as Vite projects.

Alternative to [vitepress-plugin-sandpack](https://vitepress-sandbox.js-bridge.com/) but static and hosted alongside VitePress.

Perfect for previews referencing private packages or for component libraries building examples into their documentation like [Radix Themes](https://www.radix-ui.com/themes/docs/overview/getting-started).

## Installation

> [!IMPORTANT]  
> Add `.vitepress/.previews/cache` to your `.gitignore` to prevent comitting and pushing previews.

```bash
bun add vitepress-plugin-previews
```

```bash
npm install vitepress-plugin-previews
```

```bash
yarn add vitepress-plugin-previews
```

Then, wrap your VitePress configuration. Read more about the [caveats](#caveats) below.

```ts [.vitepress/config.ts]
import { defineConfig } from "vitepress";
import { withPreviews } from "vitepress-plugin-previews";
import react from "@vitejs/plugin-react";

export default withPreviews(
  defineConfig({
    previews: {
      // Configure Vite for all previews
      vite: {
        plugins: [react()],
      },
    },

    // Your existing VitePress configuration
    ...
  })
);
```

## Usage

Add the `preview` flag to any code group.

````md
::: code-group preview

```tsx [main.tsx]
import { createRoot } from "react-dom/client";

import App from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <button>Click me</button>
);
```

```html [index.html]
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

:::
````

## Templates

By default, previews only consist of files defined within code groups. However, you may want to base previews off of a template and only overwrite relevant files.

Templates are directories within `.vitepress/.previews/templates`, and they can be referenced in two places.

### Default template

A default template can be specified in the VitePress configuration.

```ts [.vitepress/config.ts]
import { defineConfig } from "vitepress";
import { withPreviews } from "vitepress-plugin-previews";

export default withPreviews(
  defineConfig({
    previews: {
      defaultTemplate: "example-template",
    },
  })
);
```

### Code group templates

Templates can be specified per code group and will overwrite the default template.

````md
::: code-group preview(example-template)

```tsx [src/App.tsx]
export default function App() {
  return <button>Click me</button>;
}
```

:::
````

## Caveats

- Snippet imports are not supported
