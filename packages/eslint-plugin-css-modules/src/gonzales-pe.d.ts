declare module "gonzales-pe" {
  interface GonzalesNode {
    type: string;
    content: string | GonzalesNode[];
    syntax: string;
    is(type: string): boolean;
    traverseByType(
      type: string,
      callback: (node: GonzalesNode, index: number, parent: GonzalesNode) => void
    ): void;
    removeChild(index: number): void;
    toString(): string;
  }

  function parse(content: string, options?: { syntax?: string }): GonzalesNode;

  export default { parse };
}
