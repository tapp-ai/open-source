# vitepress-plugin-preview

Display static previews built as Vite projects alongside code groups.

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

Then, wrap your VitePress configuration.

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

## Caveats

- Snippet imports are not supported
