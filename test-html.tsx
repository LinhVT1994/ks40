import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const md = `
# Test

\`\`\`javascript
const x = 1;
const y = 2;
\`\`\`
`;

const html = renderToString(
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw]}
    components={{
      code: ({ children, className }) => {
        const content = Array.isArray(children) ? children.join('') : String(children);
        console.log("className:", className, "content contains newline:", content.includes('\n'));
        console.log("content:", JSON.stringify(content));
        return <code>{content}</code>;
      }
    }}
  >
    {md}
  </ReactMarkdown>
);
