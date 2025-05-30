# Open Source by Conversion

A collection of open source projects built by the team at [Conversion](https://conversion.com).

## Projects

### [@conversion/vscode-ext-switcher](./packages/vscode-ext-switcher)

A Visual Studio Code extension that allows you to switch between companion files (e.g., `.ts` and `.css`) with a simple command.

### [@conversion/lexical-unicode-plugin](./packages/lexical-unicode-plugin)

A [Lexical](https://lexical.dev/) plugin that adds support for Unicode characters, including emojis, symbols, and special characters.

### [@conversion/vitepress-plugin-previews](./packages/vitepress-plugin-previews)

No-dependencies [VitePress](https://vitepress.dev/) plugin for displaying static previews of code groups built as Vite projects.

## Examples

### Basic Preview

Add the `preview` flag to any code group to display an interactive preview:

```md
::: code-group preview

```tsx [main.tsx]
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root") as HTMLElement).render(
  <button>Click me!</button>
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
```

### Preview with Template

Use the `template` attribute to base your preview on a predefined template:

```md
::: code-group preview template=react-typescript

```tsx [src/App.tsx]
import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

```css [src/App.css]
h1 {
  color: #333;
  font-family: Arial, sans-serif;
}

button {
  padding: 8px 16px;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

:::
```

### No-Code Preview

Use the `no-code` flag to hide the code and show only the preview result:

```md
::: code-group preview no-code

```tsx [App.tsx]
export default function App() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Welcome to our Component!</h2>
      <p>This preview shows the result without displaying the code.</p>
    </div>
  );
}
```

:::
```

### Template with No-Code

Combine template usage with the no-code flag:

```md
::: code-group preview template=vue-component no-code

```vue [src/HelloWorld.vue]
<template>
  <div class="hello">
    <h1>{{ message }}</h1>
    <button @click="updateMessage">Update Message</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: 'Hello Vue!'
    }
  },
  methods: {
    updateMessage() {
      this.message = 'Message Updated!'
    }
  }
}
</script>

<style scoped>
.hello {
  padding: 20px;
  text-align: center;
}
</style>
```

:::
```

### Multi-File Component Example

Show a complex component with multiple files:

```md
::: code-group preview template=react-app

```tsx [src/components/Counter.tsx]
import { useState } from "react";
import "./Counter.css";

interface CounterProps {
  initialValue?: number;
}

export default function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = useState(initialValue);

  return (
    <div className="counter">
      <h2>Interactive Counter</h2>
      <div className="counter-display">{count}</div>
      <div className="counter-buttons">
        <button onClick={() => setCount(count - 1)}>-</button>
        <button onClick={() => setCount(0)}>Reset</button>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    </div>
  );
}
```

```css [src/components/Counter.css]
.counter {
  max-width: 300px;
  margin: 0 auto;
  padding: 20px;
  border: 2px solid #e1e1e1;
  border-radius: 8px;
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.counter-display {
  font-size: 3rem;
  font-weight: bold;
  color: #333;
  margin: 20px 0;
}

.counter-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.counter-buttons button {
  padding: 10px 20px;
  font-size: 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.counter-buttons button:first-child {
  background-color: #ff6b6b;
  color: white;
}

.counter-buttons button:last-child {
  background-color: #51cf66;
  color: white;
}

.counter-buttons button:nth-child(2) {
  background-color: #868e96;
  color: white;
}

.counter-buttons button:hover {
  opacity: 0.8;
}
```

```tsx [src/App.tsx]
import Counter from "./components/Counter";

export default function App() {
  return (
    <div>
      <Counter initialValue={5} />
    </div>
  );
}
```

:::
```

### Vanilla JavaScript Example

Show how to create previews without frameworks:

```md
::: code-group preview

```html [index.html]
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Simple Todo List</h1>
        <div class="input-section">
            <input type="text" id="todoInput" placeholder="Enter a new task...">
            <button onclick="addTodo()">Add Task</button>
        </div>
        <ul id="todoList"></ul>
    </div>
    <script src="script.js"></script>
</body>
</html>
```

```css [style.css]
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f5f5f5;
    padding: 20px;
}

.container {
    max-width: 500px;
    margin: 0 auto;
    background: white;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
}

.input-section {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
}

input {
    flex: 1;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
}

button {
    padding: 12px 20px;
    background: #007acc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

button:hover {
    background: #005a9e;
}

ul {
    list-style: none;
}

li {
    background: #f8f9fa;
    margin: 10px 0;
    padding: 15px;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.delete-btn {
    background: #dc3545;
    padding: 5px 10px;
    font-size: 14px;
}

.delete-btn:hover {
    background: #c82333;
}
```

```js [script.js]
let todos = [];

function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (text === '') {
        alert('Please enter a task!');
        return;
    }
    
    const todo = {
        id: Date.now(),
        text: text
    };
    
    todos.push(todo);
    input.value = '';
    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    renderTodos();
}

function renderTodos() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';
    
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${todo.text}</span>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">Delete</button>
        `;
        todoList.appendChild(li);
    });
}

// Allow adding todos with Enter key
document.getElementById('todoInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTodo();
    }
});
```

:::