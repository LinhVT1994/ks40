const fs = require('fs');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = require('path').join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walk(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

const slateToZinc = {
  'slate-50': 'zinc-50',
  'slate-100': 'zinc-100',
  'slate-200': 'zinc-200',
  'slate-300': 'zinc-300',
  'slate-400': 'zinc-500',
  'slate-500': 'zinc-500',
  'slate-600': 'zinc-600',
  'slate-700': 'zinc-700',
  'slate-800': 'zinc-800',
  'slate-900': 'zinc-800',
  'slate-950': 'zinc-900',
};

let filesChanged = 0;

walk('/Users/tuan-linh/Desktop/Workspaces/KS40/src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // We simply want to replace text like 'bg-slate-50' with 'bg-zinc-50'.
  // We want to avoid replacing if it is preceded by 'dark:' anywhere in the word.
  // We can match any word that ends with `slate-xxx`.
  newContent = newContent.replace(/([a-zA-Z0-9\-:]*slate-\d+)/g, (match) => {
      // e.g. match = 'bg-slate-50' or 'hover:bg-slate-100' or 'dark:bg-slate-900'
      if (match.includes('dark:')) return match;
      
      let res = match;
      for (const [s, z] of Object.entries(slateToZinc)) {
          if (res.includes(s)) {
              res = res.replace(s, z);
              break;
          }
      }
      return res;
  });

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesChanged++;
  }
});

console.log(`Updated ${filesChanged} files from slate to zinc.`);
