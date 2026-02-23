import path from "node:path";
import type { Rule } from "eslint";
import type { NoUnusedClassOptions } from "../types.ts";
import {
  getStyleImportNodeData,
  getStyleClasses,
  getPropertyName,
  getClassesMap,
  getFilePath,
  getAST,
  fileExists,
} from "../core/index.ts";

interface StyleImportInfo {
  classes: Record<string, boolean>;
  classesMap: Record<string, string>;
  node: Rule.Node;
  filePath: string;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Checks that all CSS/SCSS/Less classes are used",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          camelCase: {
            enum: [true, "dashes", "only", "dashes-only"],
          },
          markAsUsed: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = (context.options[0] ?? {}) as NoUnusedClassOptions;
    const { markAsUsed, camelCase: camelCaseOption } = options;

    const map = new Map<string, StyleImportInfo>();

    return {
      ImportDeclaration(node) {
        const styleImportNodeData = getStyleImportNodeData(node as Rule.Node);
        if (!styleImportNodeData) return;

        const { importName, styleFilePath, importNode } = styleImportNodeData;
        const styleFileAbsolutePath = getFilePath(context, styleFilePath);

        let classes: Record<string, boolean> = {};
        let classesMap: Record<string, string> = {};

        if (fileExists(styleFileAbsolutePath)) {
          const ast = getAST(styleFileAbsolutePath);
          const parsed = ast && getStyleClasses(ast);
          if (parsed) {
            classes = parsed;
            classesMap = getClassesMap(classes, camelCaseOption);
          }
        }

        map.set(importName, {
          classes,
          classesMap,
          node: importNode,
          filePath: styleFilePath,
        });
      },
      MemberExpression(node) {
        const objectName = (node as unknown as { object: { name?: string } }).object?.name;
        if (!objectName) return;

        const info = map.get(objectName);
        if (!info) return;

        const propertyName = getPropertyName(node as unknown as Rule.Node & { computed?: boolean; property?: Rule.Node & { value?: string; name?: string } });
        if (!propertyName) return;

        const className = info.classesMap[propertyName];
        if (className == null) return;

        info.classes[className] = true;
      },
      "Program:exit"() {
        for (const [, info] of map) {
          const { classes, node, filePath } = info;

          if (markAsUsed) {
            for (const usedClass of markAsUsed) {
              classes[usedClass] = true;
            }
          }

          const unusedClasses = Object.entries(classes)
            .filter(([, used]) => !used)
            .map(([className]) => className);

          if (unusedClasses.length > 0) {
            context.report({
              node: node as unknown as Rule.Node,
              message: `Unused classes found in ${path.basename(filePath)}: ${unusedClasses.join(", ")}`,
            });
          }
        }
      },
    };
  },
};

export default rule;
