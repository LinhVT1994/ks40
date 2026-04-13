const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts') || dirPath.endsWith('.js') || dirPath.endsWith('.jsx')) {
        callback(path.join(dir, f));
      }
    }
  });
}

const slateToZinc = {
  'slate-50': 'zinc-50',
  'slate-100': 'zinc-100',
  'slate-200': 'zinc-200',
  'slate-300': 'zinc-300',
  'slate-400': 'zinc-500', // darkened slightly for better contrast
  'slate-500': 'zinc-500',
  'slate-600': 'zinc-600',
  'slate-700': 'zinc-700',
  'slate-800': 'zinc-800',
  'slate-900': 'zinc-800', // soft dark
  'slate-950': 'zinc-900',
};

let filesChanged = 0;

walk('./src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // We are looking for tailwind classes.
  // Instead of complex tokenization, we can just replace slate with zinc
  // ONLY if it's not prefixed with dark: or something similar.
  // Actually, standard regex: match any word that contains `slate-`
  // We can use a replacer function.
  newContent = newContent.replace(/(?:([a-z\-:]+):)?([a-z\-]+)-slate-(\d+)/g, (match, prefix, utility, weight) => {
      // prefix could be 'dark', 'hover', 'dark:hover', undefined
      // utility could be 'bg', 'text', 'border'
      // weight could be '50', '900'
      const isDark = match.includes('dark:');
      
      if (isDark) {
          // Do not touch dark mode classes
          return match;
      }
      
      const slateClass = `slate-${weight}`;
      const zincClass = slateToZinc[slateClass] || `zinc-${weight}`;
      
      if (prefix) {
          return `${prefix}:${utility}-${zincClass}`;
      } else {
          return `${utility}-${zincClass}`;
      }
  });

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesChanged++;
  }
});
console.log(`Updated ${filesChanged} files from slate to zinc.`);
