const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walk(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

const replacements = {
  'border-zinc-50': 'border-zinc-200',
  'border-zinc-100': 'border-zinc-200',
  'border-zinc-200/50': 'border-zinc-200',
  'border-zinc-200': 'border-zinc-300',
  'border-slate-50': 'border-zinc-200',
  'border-slate-100': 'border-zinc-200',
  'border-slate-200/50': 'border-zinc-200',
  'border-slate-200': 'border-zinc-300',
  'divide-zinc-50': 'divide-zinc-200',
  'divide-zinc-100': 'divide-zinc-200',
  'divide-slate-50': 'divide-zinc-200',
  'divide-slate-100': 'divide-zinc-200',
  'ring-zinc-100': 'ring-zinc-200',
  'ring-zinc-200': 'ring-zinc-300',
};

let filesChanged = 0;

walk('/Users/tuan-linh/Desktop/Workspaces/KS40/src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // We want to replace these strings exactly, but we must make sure we don't double replace.
  // For example, changing zinc-100 to zinc-200, then zinc-200 to zinc-300 would make everything zinc-300.
  // So we run a single pass using regex with words boundary.
  
  // Create a regex that matches any of the keys
  const keys = Object.keys(replacements).map(k => k.replace('/', '\\/'));
  const regex = new RegExp(`(?<!dark:)\\b(${keys.join('|')})\\b`, 'g');

  newContent = newContent.replace(regex, (match) => {
    return replacements[match] || match;
  });

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesChanged++;
  }
});

console.log(`Updated borders in ${filesChanged} files to be sharper.`);
