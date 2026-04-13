const fs = require('fs');
const path = require('path');

let borderCounts = {};

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

walk('/Users/tuan-linh/Desktop/Workspaces/KS40/src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let matches = content.match(/\bborder-zinc-\d+(?:\/\d+)?/g);
  if (matches) {
    matches.forEach(m => {
      borderCounts[m] = (borderCounts[m] || 0) + 1;
    });
  }
});

console.log("Border classes used:");
Object.entries(borderCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cls, count]) => console.log(`${cls}: ${count}`));
