import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function getWorkspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders;
  assert.ok(folders && folders.length > 0, "No workspace folder found");
  return folders[0].uri.fsPath;
}

async function openFileInEditor(filePath: string): Promise<vscode.TextEditor> {
  const doc = await vscode.workspace.openTextDocument(filePath);
  return vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
}

function waitForEditorChange(timeout = 5000): Promise<vscode.TextEditor> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      disposable.dispose();
      reject(new Error("Timed out waiting for active editor change"));
    }, timeout);

    const disposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        clearTimeout(timer);
        disposable.dispose();
        resolve(editor);
      }
    });
  });
}

async function switchAndExpect(
  startFile: string,
  expectedBaseName: string | string[]
): Promise<void> {
  await openFileInEditor(startFile);

  const changePromise = waitForEditorChange();
  await vscode.commands.executeCommand("extensionSwitcher.switchFile");
  const newEditor = await changePromise;

  const actualName = path.basename(newEditor.document.fileName);
  const allowed = Array.isArray(expectedBaseName)
    ? expectedBaseName
    : [expectedBaseName];

  assert.ok(
    allowed.includes(actualName),
    `Expected ${allowed.join(" or ")} but got ${actualName}`
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Tests                                    */
/* -------------------------------------------------------------------------- */

suite("Extension Test Suite", () => {
  let root: string;

  suiteSetup(() => {
    root = getWorkspaceRoot();
  });

  teardown(async () => {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  });

  /* -------------------- index ↔ directory-name pattern -------------------- */

  suite("Default config: index ↔ directory-name pattern", () => {
    test("index.tsx → NavigationBar.module.scss", async () => {
      await switchAndExpect(
        path.join(root, "index-pattern", "NavigationBar", "index.tsx"),
        "NavigationBar.module.scss"
      );
    });

    test("NavigationBar.module.scss → index.tsx (reverse)", async () => {
      await switchAndExpect(
        path.join(
          root,
          "index-pattern",
          "NavigationBar",
          "NavigationBar.module.scss"
        ),
        "index.tsx"
      );
    });
  });

  /* -------------------------- same-name matching -------------------------- */

  suite("Same-name matching", () => {
    test("Button.jsx → Button.css", async () => {
      await switchAndExpect(
        path.join(root, "same-name", "Button.jsx"),
        "Button.css"
      );
    });

    test("Button.css → Button.jsx (reverse)", async () => {
      await switchAndExpect(
        path.join(root, "same-name", "Button.css"),
        "Button.jsx"
      );
    });

    test("Card.tsx → Card.module.scss", async () => {
      await switchAndExpect(
        path.join(root, "same-name", "Card.tsx"),
        "Card.module.scss"
      );
    });

    test("Card.module.scss → Card.tsx (reverse)", async () => {
      await switchAndExpect(
        path.join(root, "same-name", "Card.module.scss"),
        "Card.tsx"
      );
    });
  });

  /* ----------------------- bidirectional switching ------------------------ */

  suite("Bidirectional switching", () => {
    test("Form.scss → Form.tsx", async () => {
      await switchAndExpect(
        path.join(root, "bidirectional", "Form.scss"),
        "Form.tsx"
      );
    });

    test("Form.tsx → Form.scss", async () => {
      await switchAndExpect(
        path.join(root, "bidirectional", "Form.tsx"),
        "Form.scss"
      );
    });
  });

  /* ------------------------- compound extensions ------------------------- */

  suite("Compound extensions", () => {
    test("Layout.module.scss → Layout.tsx", async () => {
      await switchAndExpect(
        path.join(root, "compound-ext", "Layout.module.scss"),
        "Layout.tsx"
      );
    });

    test("Layout.tsx → Layout.module.scss or Layout.scss", async () => {
      await switchAndExpect(
        path.join(root, "compound-ext", "Layout.tsx"),
        ["Layout.module.scss", "Layout.scss"]
      );
    });
  });

  /* -------------------------- multiple matches --------------------------- */

  suite("Multiple matches", () => {
    test("Widget.tsx → Widget.css or Widget.module.scss", async () => {
      await switchAndExpect(
        path.join(root, "multi-match", "Widget.tsx"),
        ["Widget.css", "Widget.module.scss"]
      );
    });
  });
});
