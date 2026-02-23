import type { Rule } from "eslint";
import type { NoUndefClassOptions } from "../types.ts";
import {
  getStyleImportNodeData,
  getAST,
  fileExists,
  getStyleClasses,
  getPropertyName,
  getClassesMap,
  getExportPropsMap,
  getFilePath,
} from "../core/index.ts";

interface StyleImportInfo {
  classesMap: Record<string, string>;
  exportPropsMap: Record<string, string>;
  node: Rule.Node;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Checks that you are using existing CSS/SCSS/Less classes",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          camelCase: {
            enum: [true, "dashes", "only", "dashes-only"],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = (context.options[0] ?? {}) as NoUndefClassOptions;
    const { camelCase: camelCaseOption } = options;

    const map = new Map<string, StyleImportInfo>();

    return {
      ImportDeclaration(node) {
        const styleImportNodeData = getStyleImportNodeData(node as Rule.Node);
        if (!styleImportNodeData) return;

        const { importName, styleFilePath, importNode } = styleImportNodeData;
        const styleFileAbsolutePath = getFilePath(context, styleFilePath);

        let classesMap: Record<string, string> = {};
        let exportPropsMap: Record<string, string> = {};

        if (fileExists(styleFileAbsolutePath)) {
          const ast = getAST(styleFileAbsolutePath);

          if (!ast) return; // unparsable file — skip

          const classes = getStyleClasses(ast);

          if (classes) {
            classesMap = getClassesMap(classes, camelCaseOption);
          }
          exportPropsMap = getExportPropsMap(ast) ?? {};
        }

        map.set(importName, {
          classesMap,
          exportPropsMap,
          node: importNode,
        });
      },
      MemberExpression(node) {
        const objectName = (node as unknown as { object: { name?: string } }).object?.name;
        if (!objectName) return;

        const info = map.get(objectName);
        if (!info) return;

        const propertyName = getPropertyName(node as unknown as Rule.Node & { computed?: boolean; property?: Rule.Node & { value?: string; name?: string } });
        if (!propertyName) return;

        const { classesMap, exportPropsMap } = info;

        if (
          classesMap[propertyName] == null &&
          exportPropsMap[propertyName] == null
        ) {
          const propertyNode = (node as unknown as { property: Rule.Node }).property;
          context.report({
            node: propertyNode,
            message: `Class or exported property '${propertyName}' not found`,
          });
        }
      },
    };
  },
};

export default rule;
