const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walk(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx')) {
        callback(dirPath);
      }
    }
  });
}

let filesChanged = 0;

walk('/Users/tuan-linh/Desktop/Workspaces/KS40/src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Replace shadow-[0_0_...rgba(59,130,246...)] with dark:shadow-[...]
  // Using a regex carefully
  // e.g. shadow-[0_0_10px_rgba(59,130,246,0.5)] -> shadow-sm dark:shadow-[0_0_10px_rgba(59,130,246,0.5)]
  newContent = newContent.replace(/\b(shadow|drop-shadow)-\[([^\]]+rgba\(59,130,246[^\]]+\))\]/g, (match, prefix, inner) => {
      // If it is already prefixed by dark:, skip
      if (content.substring(Math.max(0, content.indexOf(match) - 5)).includes('dark:' + match)) {
          return match;
      }
      return `${prefix}-sm dark:${match}`;
  });

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesChanged++;
    console.log(`Updated ${filePath}`);
  }
});

console.log(`Updated ${filesChanged} files with hardcoded blue shadows.`);
