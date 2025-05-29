import { useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  TextNode,
} from "lexical";

export type UnicodeReplacement = {
  pattern: RegExp;
  symbol: string;
};

const defaultUnicodeReplacements: UnicodeReplacement[] = [
  {
    pattern: /->/g,
    symbol: "→",
  },
  {
    pattern: /<-/g,
    symbol: "←",
  },
  {
    pattern: /<->/g,
    symbol: "↔",
  },
  {
    pattern: /!=/g,
    symbol: "≠",
  },
  {
    pattern: /==/g,
    symbol: "≡",
  },
  {
    pattern: /=>/g,
    symbol: "⇒",
  },
  {
    pattern: /~=/g,
    symbol: "≈",
  },
  {
    pattern: /<=/g,
    symbol: "≤",
  },
  {
    pattern: />=/g,
    symbol: "≥",
  },
  {
    pattern: /\+-/g,
    symbol: "±",
  },
  {
    pattern: /--/g,
    symbol: "—",
  },
];

interface UnicodePluginProps {
  replacements?: UnicodeReplacement[];
}

export const UnicodePlugin = ({
  replacements = defaultUnicodeReplacements,
}: UnicodePluginProps) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor) return;

    return editor.registerNodeTransform(TextNode, (node: TextNode) => {
      const nodeText = node.getTextContent();
      let modifiedNodeText = nodeText;

      for (const { pattern, symbol } of replacements) {
        if (nodeText.match(pattern)) {
          modifiedNodeText = modifiedNodeText.replace(pattern, symbol);
        }
      }

      if (nodeText !== modifiedNodeText) {
        node.setTextContent(modifiedNodeText);

        const selection = $getSelection()?.clone();
        if (selection && $isRangeSelection(selection)) {
          const delta = modifiedNodeText.length - nodeText.length;
          selection.anchor.offset = Math.max(
            0,
            selection.anchor.offset + delta
          );
          selection.focus.offset = Math.max(0, selection.focus.offset + delta);
          $setSelection(selection);
        }
      }
    });
  }, [editor]);

  return null;
};
