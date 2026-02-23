"use strict";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

const DirectoryNamePlaceholder = "${dir}";

/* -------------------------------------------------------------------------- */
/*                            Types and Interfaces                            */
/* -------------------------------------------------------------------------- */

interface FileSwitchPreset {
  sourceExtensions: string[]; // E.g. [".tsx", ".jsx", ".ts", ".js"]
  targetExtensions: string[]; // E.g. [".module.scss", ".css", ".scss", ".sass", ".less"]
  sourceDefaultName: string; // E.g. "index" for index.tsx
  targetDefaultName: string; // E.g. "${dir}" for directory name
  createSourceExtension: string; // E.g. ".tsx"
  createTargetExtension: string; // E.g. ".module.scss"
  enableBidirectionalSwitch?: boolean; // Default: true
}

interface ExtensionConfig {
  presets: FileSwitchPreset[];
  useOtherColumn: boolean; // Default: true
  allowFileCreation: boolean; // Default: true
}

/* -------------------------------------------------------------------------- */
/*                                Configuration                               */
/* -------------------------------------------------------------------------- */

function getExtensionConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration("extensionSwitcher");
  const useOtherColumn: boolean = config.get("useOtherColumn", true);
  const allowFileCreation: boolean = config.get("allowFileCreation", true);
  const userPresets = config.get<FileSwitchPreset[]>("presets");

  const defaultPresets: FileSwitchPreset[] = [
    {
      sourceExtensions: [".tsx", ".jsx", ".ts", ".js"],
      targetExtensions: [".module.scss", ".css", ".scss", ".sass", ".less"],
      createSourceExtension: ".tsx",
      createTargetExtension: ".module.scss",
      sourceDefaultName: "index",
      targetDefaultName: DirectoryNamePlaceholder,
      enableBidirectionalSwitch: true,
    },
  ];

  const presets =
    Array.isArray(userPresets) && userPresets.length > 0
      ? userPresets
      : defaultPresets;

  return { presets, useOtherColumn, allowFileCreation };
}

/* -------------------------------------------------------------------------- */
/*                               File Switching                               */
/* -------------------------------------------------------------------------- */

function switchToFile() {
  const currentEditor = vscode.window.activeTextEditor;
  if (!currentEditor) {
    return;
  }
  const currentPath = currentEditor.document.fileName;
  const config = getExtensionConfig();

  const dir = path.dirname(currentPath);
  fs.readdir(dir, (err, files) => {
    if (err) {
      vscode.window.showErrorMessage("extensionSwitcher: " + err.message);
      return;
    }
    processFileSwitch(currentPath, files, config);
  });
}

function processFileSwitch(
  currentPath: string,
  files: string[],
  config: ExtensionConfig
) {
  const currentFile = path.basename(currentPath);

  // Find matching preset and determine direction
  let preset: FileSwitchPreset | undefined = undefined;
  let isReverse = false;

  // Prefer sourceExtensions that match current file extension
  preset = config.presets.find((p) =>
    p.sourceExtensions.some((ext) => currentFile.endsWith(ext))
  );

  // If not found, try bidirectional targetExtensions that match current file extension
  if (!preset) {
    preset = config.presets.find(
      (p) =>
        p.enableBidirectionalSwitch !== false &&
        p.targetExtensions.some((ext) => currentFile.endsWith(ext))
    );
    if (preset) {
      isReverse = true;
    }
  }

  if (!preset) {
    vscode.window.showErrorMessage("extensionSwitcher: Unsupported file type.");
    return;
  }

  // In reverse mode, swap source/target roles
  const fromExtensions = isReverse
    ? preset.targetExtensions
    : preset.sourceExtensions;
  const toExtensions = isReverse
    ? preset.sourceExtensions
    : preset.targetExtensions;
  const fromDefaultName = isReverse
    ? preset.targetDefaultName
    : preset.sourceDefaultName;
  const toDefaultName = isReverse
    ? preset.sourceDefaultName
    : preset.targetDefaultName;
  const createExtension = isReverse
    ? preset.createSourceExtension
    : preset.createTargetExtension;

  const currentExt = fromExtensions.find((ext) => currentFile.endsWith(ext));
  if (!currentExt) {
    vscode.window.showErrorMessage(
      "extensionSwitcher: An unexpected error occurred."
    );
    return;
  }

  const baseName = currentFile.slice(0, -currentExt.length);
  const parentDir = path.basename(path.dirname(currentPath));

  // Try direct name+extension match in this folder
  let candidates = findMatchingFiles(files, baseName, toExtensions, currentFile);

  // Try default name fallback
  if (candidates.length === 0) {
    if (sourceNameMatch(fromDefaultName, baseName, parentDir)) {
      const resolvedName = toDefaultName.replace(
        DirectoryNamePlaceholder,
        parentDir
      );
      candidates = findMatchingFiles(files, resolvedName, toExtensions, currentFile);
    }
  }

  if (candidates.length > 0) {
    // Pick "next" in list if cycling
    openMatchingFileCycling(
      files,
      currentFile,
      candidates,
      config.useOtherColumn
    );
  } else if (config.allowFileCreation) {
    // Decide default target name for creation
    let defaultCandidateName: string;
    if (sourceNameMatch(fromDefaultName, baseName, parentDir)) {
      defaultCandidateName = toDefaultName.replace(
        DirectoryNamePlaceholder,
        parentDir
      );
    } else {
      defaultCandidateName = baseName;
    }

    const newFileName = defaultCandidateName + createExtension;
    promptToCreateCompanionFile(
      path.dirname(currentPath),
      newFileName,
      config.useOtherColumn
    );
  } else {
    vscode.window.showErrorMessage(
      "extensionSwitcher: No matching file found for " + currentFile
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                               Helper Methods                               */
/* -------------------------------------------------------------------------- */

function findMatchingFiles(
  files: string[],
  baseName: string,
  exts: string[],
  excludeFile: string
): string[] {
  return files.filter(
    (f) => f !== excludeFile && exts.some((ext) => f === baseName + ext)
  );
}

function sourceNameMatch(
  presetSourceName: string,
  currentBase: string,
  parentDir: string
) {
  if (presetSourceName === DirectoryNamePlaceholder) {
    return currentBase === parentDir;
  }
  return presetSourceName === currentBase;
}

function openMatchingFileCycling(
  files: string[],
  currentFile: string,
  candidateRelativePaths: string[],
  useOtherColumn: boolean
) {
  // If candidateRelativePaths are just filenames, resolve them to full path
  const dir = path.dirname(
    vscode.window.activeTextEditor?.document.fileName || ""
  );
  const candidates = candidateRelativePaths.map((f) =>
    path.isAbsolute(f) ? f : path.join(dir, f)
  );
  // Cycle: pick the first candidate after currentFile in file list, else first
  const currentIdx = files.indexOf(currentFile);
  let next =
    candidates.find((c) => {
      const fname = path.basename(c);
      return files.indexOf(fname) > currentIdx;
    }) || candidates[0];

  openFile(next, determineColumn(useOtherColumn));
}

function promptToCreateCompanionFile(
  dir: string,
  defaultName: string,
  useOtherColumn: boolean
) {
  vscode.window
    .showInputBox({
      prompt: "Enter the name for the new companion file",
      value: defaultName,
    })
    .then((input) => {
      if (!input) {
        return;
      }
      const filePath = path.join(dir, input);
      fs.writeFile(filePath, "", (err) => {
        if (err) {
          vscode.window.showErrorMessage(
            "extensionSwitcher: Could not create file: " + err.message
          );
        } else {
          openFile(filePath, determineColumn(useOtherColumn));
        }
      });
    });
}

function determineColumn(useOtherColumn: boolean): vscode.ViewColumn {
  const active = vscode.window.activeTextEditor?.viewColumn;
  if (!useOtherColumn || !active) {
    return vscode.ViewColumn.One;
  }
  return active === vscode.ViewColumn.One
    ? vscode.ViewColumn.Two
    : vscode.ViewColumn.One;
}

function openFile(filePath: string, column: vscode.ViewColumn) {
  vscode.workspace
    .openTextDocument(filePath)
    .then((doc) => vscode.window.showTextDocument(doc, column));
}

/* -------------------------------------------------------------------------- */
/*                                   Exports                                  */
/* -------------------------------------------------------------------------- */

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("extensionSwitcher.switchFile", () =>
      switchToFile()
    )
  );
}

export function deactivate() {}
