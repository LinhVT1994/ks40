const fs = require('fs');
const content = fs.readFileSync('/Users/rin/Desktop/MyPC/ks40/src/app/(member)/profile/[id]/ProfileClient.tsx', 'utf8');

const openingDivs = content.match(/<div(?![^>]*\/>)/g) || [];
const closingDivs = content.match(/<\/div>/g) || [];

console.log('Opening <div tags (excluding self-closing):', openingDivs.length);
console.log('Closing </div> tags:', closingDivs.length);

// Simple line-by-line trace
const lines = content.split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(?![^>]*\/>)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  depth += opens;
  depth -= closes;
  if (depth < 0) {
    console.log(`Negative depth at line ${i + 1}: ${depth}`);
    depth = 0; // reset for tracing
  }
}
console.log('Final depth:', depth);
