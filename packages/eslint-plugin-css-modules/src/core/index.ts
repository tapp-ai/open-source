import fs from "node:fs";
import path from "node:path";
import gonzales from "gonzales-pe";
import type { Rule } from "eslint";
import type { GonzalesNode, CamelCaseOption, StyleImportData } from "../types.ts";
import {
  getRegularClassesMap,
  getComposesClassesMap,
  getExtendClassesMap,
  getParentSelectorClassesMap,
  getICSSExportPropsMap,
  eliminateGlobals,
} from "./traversal-utils.ts";

const styleExtensionRegex = /\.(s?css|less)$/;

function dashesCamelCase(str: string): string {
  return str.replace(/-+(\w)/g, (_match, firstLetter: string) =>
    firstLetter.toUpperCase()
  );
}

function camelCase(str: string): string {
  return str
    .replace(/[-_]+(\w)/g, (_match, letter: string) => letter.toUpperCase())
    .replace(/^[A-Z]/, (letter) => letter.toLowerCase());
}

export function getFilePath(context: Rule.RuleContext, styleFilePath: string): string {
  const settings = context.settings["css-modules"] as
    | { basePath?: string }
    | undefined;
  const dirName = path.dirname(context.filename);
  const basePath = settings?.basePath ?? "";

  return styleFilePath.startsWith(".")
    ? path.resolve(dirName, styleFilePath)
    : path.resolve(basePath, styleFilePath);
}

export function getPropertyName(
  node: Rule.Node & { computed?: boolean; property?: Rule.Node & { value?: string; name?: string } }
): string | null {
  const propertyName = node.computed
    ? node.property?.value
    : node.property?.name;

  if (!propertyName || propertyName.startsWith("_")) {
    return null;
  }

  return propertyName;
}

export function getClassesMap(
  classes: Record<string, boolean>,
  camelCaseOption?: CamelCaseOption
): Record<string, string> {
  const classesMap: Record<string, string> = {};

  switch (camelCaseOption) {
    case true:
      for (const className of Object.keys(classes)) {
        classesMap[className] = className;
        classesMap[camelCase(className)] = className;
      }
      break;
    case "dashes":
      for (const className of Object.keys(classes)) {
        classesMap[className] = className;
        classesMap[dashesCamelCase(className)] = className;
      }
      break;
    case "only":
      for (const className of Object.keys(classes)) {
        classesMap[camelCase(className)] = className;
      }
      break;
    case "dashes-only":
      for (const className of Object.keys(classes)) {
        classesMap[dashesCamelCase(className)] = className;
      }
      break;
    default:
      for (const className of Object.keys(classes)) {
        classesMap[className] = className;
      }
  }

  return classesMap;
}

export function getStyleImportNodeData(
  node: Rule.Node
): StyleImportData | null {
  const importNode = node as Rule.Node & {
    source?: { value?: string };
    specifiers?: Array<Rule.Node & { type: string; local?: { name?: string } }>;
  };

  const styleFilePath = importNode.source?.value;
  if (!styleFilePath || !styleExtensionRegex.test(styleFilePath)) {
    return null;
  }

  const defaultSpecifier = importNode.specifiers?.find(
    (s) => s.type === "ImportDefaultSpecifier"
  );
  const importName = defaultSpecifier?.local?.name;

  if (!importName) {
    return null;
  }

  return {
    importName,
    styleFilePath,
    importNode: defaultSpecifier as Rule.Node,
  };
}

export function fileExists(filePath: string): boolean {
  try {
    fs.statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getAST(filePath: string): GonzalesNode | null {
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const syntax = path.extname(filePath).slice(1); // remove leading .

  try {
    return gonzales.parse(fileContent, { syntax }) as GonzalesNode;
  } catch {
    return null;
  }
}

export function getStyleClasses(
  ast: GonzalesNode
): Record<string, boolean> | null {
  eliminateGlobals(ast);

  const classesMap = getRegularClassesMap(ast);
  const composedClassesMap = getComposesClassesMap(ast);
  const extendClassesMap = getExtendClassesMap(ast);
  const parentSelectorClassesMap = getParentSelectorClassesMap(ast);

  return {
    ...classesMap,
    ...composedClassesMap,
    ...extendClassesMap,
    ...parentSelectorClassesMap,
  };
}

export function getExportPropsMap(
  ast: GonzalesNode
): Record<string, string> | null {
  return { ...getICSSExportPropsMap(ast) };
}
