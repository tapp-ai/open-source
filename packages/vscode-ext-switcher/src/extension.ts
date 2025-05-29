"use strict";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

const DirectoryNamePlaceholder = "${dir}";

/* -------------------------------------------------------------------------- */
/*                            Types and Interfaces                            */
/* -------------------------------------------------------------------------- */

interface FileSwitchPreset {
  sourceExtensions: string[];
  targetExtensions: string[];
  createTargetExtension: string; // for new file creation
  defaults: {
    sourceName: string | "${dir}";
    targetName: string | "${dir}";
  }[];
  allowCreate?: boolean; // whether to prompt creation when no match found, default true
}

interface ExtensionConfig {
  presets: FileSwitchPreset[];
  useOtherColumn: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                Configuration                               */
/* -------------------------------------------------------------------------- */

function getExtensionConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration("extensionSwitcher");
  const useOtherColumn: boolean = config.get("useOtherColumn", true);
  const userPresets = config.get<FileSwitchPreset[]>("presets");

  const defaultPresets: FileSwitchPreset[] = [
    {
      sourceExtensions: [".js", ".jsx", ".ts", ".tsx"],
      targetExtensions: [".module.scss", ".css", ".scss", ".sass", ".less"],
      createTargetExtension: ".module.scss",
      defaults: [{ sourceName: "index", targetName: DirectoryNamePlaceholder }],
      allowCreate: true,
    },
    {
      sourceExtensions: [".module.scss", ".css", ".scss", ".sass", ".less"],
      targetExtensions: [".js", ".jsx", ".ts", ".tsx"],
      createTargetExtension: ".tsx",
      defaults: [{ sourceName: DirectoryNamePlaceholder, targetName: "index" }],
      allowCreate: true,
    },
  ];

  const presets =
    Array.isArray(userPresets) && userPresets.length > 0
      ? userPresets
      : defaultPresets;

  return { presets, useOtherColumn };
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

  // Find matching preset
  const preset = config.presets.find((p) =>
    p.sourceExtensions.some((ext) => currentFile.endsWith(ext))
  );

  if (!preset) {
    vscode.window.showErrorMessage("extensionSwitcher: Unsupported file type.");
    return;
  }

  const currentExt = preset.sourceExtensions.find((ext) =>
    currentFile.endsWith(ext)
  );
  if (!currentExt) {
    // Should not happen due to preset check above
    vscode.window.showErrorMessage(
      "extensionSwitcher: An unexpected error occurred."
    );
    return;
  }

  const baseName = path.basename(currentFile, currentExt);
  const parentDir = path.basename(path.dirname(currentPath));

  // Try direct name+extension match in this folder
  let candidates = findMatchingFiles(
    files,
    baseName,
    preset.targetExtensions,
    currentFile
  );

  // Try "defaults" fallback if configured
  if (candidates.length === 0) {
    for (const { sourceName, targetName } of preset.defaults || []) {
      if (sourceNameMatch(sourceName, baseName, parentDir)) {
        // Replace placeholder
        const resolvedTargetName = targetName.replace(
          DirectoryNamePlaceholder,
          parentDir
        );
        for (const ext of preset.targetExtensions) {
          const candidateFile = resolvedTargetName + ext;
          if (files.includes(candidateFile)) {
            candidates.push(
              path.join(path.dirname(currentPath), candidateFile)
            );
          }
        }
      }
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
  } else if (preset.allowCreate !== false) {
    // Decide default target name for creation
    let defaultCandidateName: string | undefined;
    for (const { sourceName, targetName } of preset.defaults) {
      if (sourceNameMatch(sourceName, baseName, parentDir)) {
        defaultCandidateName = targetName.replace(
          DirectoryNamePlaceholder,
          parentDir
        );
        break;
      }
    }
    if (!defaultCandidateName) {
      defaultCandidateName = baseName;
    }

    const newFileName = defaultCandidateName + preset.createTargetExtension;
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
  return files
    .filter((f) => {
      const fExt = path.extname(f);
      const fBase = path.basename(f, fExt);
      return fBase === baseName && exts.includes(fExt) && f !== excludeFile;
    })
    .map((f) => f);
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
