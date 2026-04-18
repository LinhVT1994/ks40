import React from 'react';
import { renderToString } from 'react-dom/server';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const code = `// comment
function test() {}`;

const html = renderToString(
  <SyntaxHighlighter
    language="javascript"
    PreTag="div"
    wrapLongLines={false}
    style={vscDarkPlus}
    customStyle={{ whiteSpace: 'pre' }}
  >
    {code}
  </SyntaxHighlighter>
);
console.log(html);
