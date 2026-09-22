import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Parse lines for blocks (headings, lists, code, paragraphs)
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  const renderInline = (text: string): React.ReactNode[] => {
    // Matches bold **text**, inline code `code`, and links [label](url)
    const tokens: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(https?:\/\/[^\s)]+\))/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        tokens.push(text.substring(lastIdx, match.index));
      }
      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        tokens.push(
          <strong key={`b_${match.index}`} className="font-semibold text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        tokens.push(
          <code
            key={`c_${match.index}`}
            className="px-1.5 py-0.5 rounded bg-white/10 text-purple-200 font-mono text-xs"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
        const labelEnd = token.indexOf("](");
        const label = token.slice(1, labelEnd);
        const url = token.slice(labelEnd + 2, -1);
        tokens.push(
          <a
            key={`a_${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline underline-offset-2 break-all"
          >
            {label}
          </a>
        );
      }
      lastIdx = regex.lastIndex;
    }

    if (lastIdx < text.length) {
      tokens.push(text.substring(lastIdx));
    }

    return tokens;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        // Close code block
        elements.push(
          <pre
            key={`code_${i}`}
            className="p-3 my-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (!trimmed) {
      elements.push(<div key={`sp_${i}`} className="h-2" />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h3_${i}`} className="text-sm font-bold text-white mt-3 mb-1">
          {renderInline(trimmed.substring(4))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h2_${i}`} className="text-base font-bold text-purple-300 mt-4 mb-1">
          {renderInline(trimmed.substring(3))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={`h1_${i}`} className="text-lg font-extrabold text-white mt-4 mb-2">
          {renderInline(trimmed.substring(2))}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={`li_${i}`} className="flex items-start gap-2 ml-2 my-1">
          <span className="text-purple-400 text-xs mt-0.5">•</span>
          <span className="flex-1 text-xs sm:text-sm text-gray-200 leading-relaxed">
            {renderInline(trimmed.substring(2))}
          </span>
        </div>
      );
      return;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`oli_${i}`} className="flex items-start gap-2 ml-2 my-1">
          <span className="text-purple-400 font-mono text-xs font-bold mt-0.5">{numMatch[1]}.</span>
          <span className="flex-1 text-xs sm:text-sm text-gray-200 leading-relaxed">
            {renderInline(numMatch[2])}
          </span>
        </div>
      );
      return;
    }

    elements.push(
      <p key={`p_${i}`} className="text-xs sm:text-sm text-gray-200 leading-relaxed">
        {renderInline(line)}
      </p>
    );
  });

  return <div className="space-y-1">{elements}</div>;
};
