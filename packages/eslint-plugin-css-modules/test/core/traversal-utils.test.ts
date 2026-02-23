import { expect, test } from "bun:test";
import gonzales from "gonzales-pe";
import { eliminateGlobals } from "../../src/core/traversal-utils.ts";

test("eliminateGlobals: removes :global operator and the global class", () => {
  const content = `:global .global {}`;
  const ast = gonzales.parse(content, { syntax: "scss" });
  eliminateGlobals(ast);
  expect(ast.toString().trim()).toBe("");
});

test("eliminateGlobals: removes :global operator and the global classes", () => {
  const content = `:global .global1 .global2 .global3.global4 {}`;
  const ast = gonzales.parse(content, { syntax: "scss" });
  eliminateGlobals(ast);
  expect(ast.toString().trim()).toBe("");
});

test("eliminateGlobals: only removes :global operator and the global classes", () => {
  const content = `.local1 :global .global1 :local(.local2) .global2 :local(.local3), .local4 {}`;
  const ast = gonzales.parse(content, { syntax: "scss" });
  eliminateGlobals(ast);
  expect(ast.toString().trim()).toBe(
    ".local1 :local(.local2) :local(.local3), .local4 {}"
  );
});

test("eliminateGlobals: removes :global() pseudo class and its argument class", () => {
  const content = `:global(.global1) {}`;
  const ast = gonzales.parse(content, { syntax: "scss" });
  eliminateGlobals(ast);
  expect(ast.toString().trim()).toBe("");
});

test("eliminateGlobals: removes :global() pseudo class and its argument classes", () => {
  const content = `:global(.global1) :global(.global2, .global3), :global(.global4.global5) {}`;
  const ast = gonzales.parse(content, { syntax: "scss" });
  eliminateGlobals(ast);
  expect(ast.toString().trim()).toBe("");
});

test("eliminateGlobals: only removes :global() pseudo class and its argument classes", () => {
  const content = `.local1 :global(.global1) .local2, .local3 :global(.global2, .global3) :local(.local4) {}`;
  const ast = gonzales.parse(content, { syntax: "scss" });
  eliminateGlobals(ast);
  expect(ast.toString().trim()).toBe(
    ".local1 .local2, .local3 :local(.local4) {}"
  );
});
