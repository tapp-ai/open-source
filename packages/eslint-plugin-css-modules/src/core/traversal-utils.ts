import type { GonzalesNode } from "../types.ts";

type ClassMap = Record<string, boolean>;

function isNode(value: unknown): value is GonzalesNode {
  return typeof value === "object" && value !== null && "type" in value;
}

function getContentArray(node: GonzalesNode): GonzalesNode[] {
  return Array.isArray(node.content)
    ? (node.content.filter(isNode) as GonzalesNode[])
    : [];
}

function findByType(nodes: GonzalesNode[], type: string): GonzalesNode[] {
  return nodes.filter((n) => n.type === type);
}

function flatMapContent(nodes: GonzalesNode[]): GonzalesNode[] {
  return nodes.flatMap(getContentArray);
}

export function getICSSExportPropsMap(ast: GonzalesNode): Record<string, string> {
  const ruleSets: GonzalesNode[] = [];
  ast.traverseByType("ruleset", (node) => ruleSets.push(node));

  const result: Record<string, string> = {};

  // Find rulesets that have :export pseudo-selector
  for (const ruleSet of ruleSets) {
    const content = getContentArray(ruleSet);
    const selectors = findByType(content, "selector");

    let isExport = false;
    for (const selector of selectors) {
      const selectorContent = getContentArray(selector);
      for (const child of selectorContent) {
        if (child.type === "pseudoClass") {
          const pseudoContent = getContentArray(child);
          for (const ident of pseudoContent) {
            if (ident.type === "ident" && ident.content === "export") {
              isExport = true;
            }
          }
        }
      }
    }

    if (!isExport) continue;

    const blocks = findByType(content, "block");
    const declarations = findByType(flatMapContent(blocks), "declaration");

    for (const declaration of declarations) {
      const declContent = getContentArray(declaration);
      const properties = findByType(declContent, "property");

      for (const property of properties) {
        const propContent = getContentArray(property);
        const idents = findByType(propContent, "ident");
        if (idents.length > 0 && typeof idents[0]!.content === "string") {
          const prop = idents[0]!.content;
          result[prop] = prop;
        }
      }
    }
  }

  return result;
}

export function getRegularClassesMap(ast: GonzalesNode): ClassMap {
  const ruleSets: GonzalesNode[] = [];
  ast.traverseByType("ruleset", (node) => ruleSets.push(node));

  const result: ClassMap = {};
  const content = flatMapContent(ruleSets);
  const selectors = findByType(content, "selector");
  const selectorContent = flatMapContent(selectors);
  const classes = findByType(selectorContent, "class");
  const classContent = flatMapContent(classes);
  const idents = findByType(classContent, "ident");

  for (const ident of idents) {
    if (typeof ident.content === "string") {
      result[ident.content] = false;
    }
  }

  return result;
}

export function getComposesClassesMap(ast: GonzalesNode): ClassMap {
  const declarations: GonzalesNode[] = [];
  ast.traverseByType("declaration", (node) => declarations.push(node));

  const result: ClassMap = {};

  const composesDeclarations = declarations.filter((decl) => {
    const content = getContentArray(decl);
    const properties = findByType(content, "property");
    return properties.some((prop) => {
      const propContent = getContentArray(prop);
      return propContent.some(
        (n) => n.type === "ident" && n.content === "composes"
      );
    });
  });

  // Reject classes composing from other files
  const localComposes = composesDeclarations.filter((decl) => {
    const content = getContentArray(decl);
    const values = findByType(content, "value");
    return !values.some((value) => {
      const valueContent = getContentArray(value);
      return valueContent.some(
        (n) => n.type === "ident" && n.content === "from"
      );
    });
  });

  for (const decl of localComposes) {
    const content = getContentArray(decl);
    const values = findByType(content, "value");
    for (const value of values) {
      const valueContent = getContentArray(value);
      const idents = findByType(valueContent, "ident");
      for (const ident of idents) {
        if (typeof ident.content === "string") {
          result[ident.content] = true;
        }
      }
    }
  }

  return result;
}

export function getExtendClassesMap(ast: GonzalesNode): ClassMap {
  const extendNodes: GonzalesNode[] = [];
  ast.traverseByType("extend", (node) => extendNodes.push(node));

  const result: ClassMap = {};

  for (const extNode of extendNodes) {
    const content = getContentArray(extNode);
    const selectors = findByType(content, "selector");
    for (const selector of selectors) {
      const selectorContent = getContentArray(selector);
      const classes = findByType(selectorContent, "class");
      for (const cls of classes) {
        const classContent = getContentArray(cls);
        const idents = findByType(classContent, "ident");
        for (const ident of idents) {
          if (typeof ident.content === "string") {
            result[ident.content] = true;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Resolves parent selectors to their full class names.
 * E.g. `.foo { &_bar { color: blue } }` resolves to `.foo_bar`.
 */
export function getParentSelectorClassesMap(ast: GonzalesNode): ClassMap {
  const classesMap: ClassMap = {};

  const getExtensions = (nodeContent: GonzalesNode[]): string[] => {
    const blockContent = flatMapContent(findByType(nodeContent, "block"));

    // Get rulesets from direct children and from include blocks (mixins)
    const directRulesets = findByType(blockContent, "ruleset");
    const includeBlocks = findByType(blockContent, "include");
    const includeBlockContent = flatMapContent(includeBlocks);
    const includeInnerBlocks = findByType(includeBlockContent, "block");
    const includeInnerContent = flatMapContent(includeInnerBlocks);
    const includeRulesets = findByType(includeInnerContent, "ruleset");

    const allRulesets = [...directRulesets, ...includeRulesets];
    const rulesetsContent = flatMapContent(allRulesets);

    const selectors = findByType(rulesetsContent, "selector");
    const selectorContent = flatMapContent(selectors);
    const parentSelectorExtensions = findByType(
      selectorContent,
      "parentSelectorExtension"
    );
    const extContent = flatMapContent(parentSelectorExtensions);
    const idents = findByType(extContent, "ident");

    const extensions = idents
      .map((n) => n.content)
      .filter((c): c is string => typeof c === "string");

    if (extensions.length === 0) return [];

    const nestedExtensions = getExtensions(rulesetsContent);
    const result = [...extensions];
    if (nestedExtensions.length > 0) {
      for (const nestedExt of nestedExtensions) {
        for (const ext of extensions) {
          result.push(ext + nestedExt);
        }
      }
    }

    return result;
  };

  ast.traverseByType("ruleset", (node) => {
    const content = getContentArray(node);
    const selectors = findByType(content, "selector");
    const selectorContent = flatMapContent(selectors);
    const classes = findByType(selectorContent, "class");
    const classContent = flatMapContent(classes);
    const idents = findByType(classContent, "ident");

    const classNames = idents
      .map((n) => n.content)
      .filter((c): c is string => typeof c === "string");

    if (classNames.length === 0) return;

    const extensions = getExtensions(content);
    if (extensions.length === 0) return;

    for (const className of classNames) {
      for (const ext of extensions) {
        classesMap[className + ext] = false;
      }

      // Ignore the base class if it only exists for nesting parent selectors
      const blocks = findByType(content, "block");
      const blockInner = flatMapContent(blocks);
      const hasDeclarations = findByType(blockInner, "declaration").length > 0;
      if (!hasDeclarations) classesMap[className] = true;
    }
  });

  return classesMap;
}

/**
 * Mutates the AST by removing `:global` instances.
 */
export function eliminateGlobals(ast: GonzalesNode): void {
  // Remove all :global/:global(...) in selectors
  ast.traverseByType("selector", (selectorNode) => {
    const selectorContent = selectorNode.content;
    if (!Array.isArray(selectorContent)) return;

    let hasGlobalWithNoArgs = false;
    let i = 0;
    let currNode = selectorContent[i] as GonzalesNode | undefined;

    while (currNode) {
      if (currNode.is("pseudoClass")) {
        const identifierNode = getContentArray(currNode)[0];
        if (
          identifierNode &&
          identifierNode.content === "global"
        ) {
          if (getContentArray(currNode).length <= 1) {
            hasGlobalWithNoArgs = true;
          }
          selectorNode.removeChild(i);
          const next = selectorContent[i] as GonzalesNode | undefined;
          if (next && next.is("space")) {
            selectorNode.removeChild(i);
          }
        } else {
          i++;
        }
      } else if (currNode.is("class") && hasGlobalWithNoArgs) {
        selectorNode.removeChild(i);
        const next = selectorContent[i] as GonzalesNode | undefined;
        if (next && next.is("space")) {
          selectorNode.removeChild(i);
        }
      } else {
        i++;
      }

      currNode = selectorContent[i] as GonzalesNode | undefined;
    }
  });

  // Remove all rulesets with no selectors
  ast.traverseByType("ruleset", (node, index, parent) => {
    const rulesetContent = node.content;
    if (!Array.isArray(rulesetContent)) return;

    // Remove empty selectors and trailing delimiter and space
    let i = 0;
    let currNode = rulesetContent[i] as GonzalesNode | undefined;

    while (currNode) {
      if (currNode.is("selector") && getContentArray(currNode).length === 0) {
        node.removeChild(i);
        const afterRemove = rulesetContent[i] as GonzalesNode | undefined;
        if (afterRemove?.is("delimiter")) node.removeChild(i);
        const afterDelim = rulesetContent[i] as GonzalesNode | undefined;
        if (afterDelim?.is("space")) node.removeChild(i);
      } else {
        i++;
      }
      currNode = rulesetContent[i] as GonzalesNode | undefined;
    }

    // Remove the ruleset if no selectors remain
    const hasSelectors = (rulesetContent as GonzalesNode[]).some(
      (n) => isNode(n) && n.is("selector")
    );
    if (!hasSelectors) {
      parent.removeChild(index);
    }
  });
}
