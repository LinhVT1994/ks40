import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { renderToString } from 'react-dom/server';

const markdown = `
# Title

\`\`\`javascript
const x = {
  a: 1,
  b: 2
};
console.log(x);
\`\`\`
`;

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  console.log("=> CodeBlock received children:", JSON.stringify(children, null, 2));
  console.log("isArray?", Array.isArray(children));
  
  const content = Array.isArray(children) ? children.join('') : String(children);
  console.log("content after join/String:", JSON.stringify(content));
  
  return <code className="INLINE">{content}</code>;
};

const html = renderToString(
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeRaw]}
    components={{
      code: CodeBlock as any,
      pre: ({ children }: any) => <div className="PRE-WRAPPER">{children}</div>,
      p: (props: any) => <div className="P-WRAPPER" {...props} />
    }}
  >
    {markdown}
  </ReactMarkdown>
);
