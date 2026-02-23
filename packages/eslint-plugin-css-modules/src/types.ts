import type { Rule } from "eslint";

export type CamelCaseOption = true | "dashes" | "only" | "dashes-only";

export interface NoUnusedClassOptions {
  camelCase?: CamelCaseOption;
  markAsUsed?: string[];
}

export interface NoUndefClassOptions {
  camelCase?: CamelCaseOption;
}

export interface StyleImportData {
  importName: string;
  styleFilePath: string;
  importNode: Rule.Node;
}

/**
 * gonzales-pe AST node
 */
export interface GonzalesNode {
  type: string;
  content: string | GonzalesNode[];
  syntax: "css" | "scss" | "less";
  is(type: string): boolean;
  traverseByType(type: string, callback: (node: GonzalesNode, index: number, parent: GonzalesNode) => void): void;
  removeChild(index: number): void;
  toString(): string;
}
