import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = [];

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Match className="..." or className='...' or className={`...`}
    // This is a bit tricky with nested expressions but let's try a broader regex
    // We can just globally replace text-white with text-on-accent and text-bg-page with text-on-accent
    // BUT only if they are close to bg-accent-teal or bg-[#3B82F6] or bg-status-success
    // Since this might be hard, let's just do a simpler search and replace for lines containing those bg colors
    let lines = content.split('\n');
    let modified = false;
    for (let i=0; i<lines.length; i++) {
      let line = lines[i];
      if (line.includes('bg-[#3B82F6]') || line.includes('bg-accent-teal') || line.includes('bg-status-success')) {
        let oldLine = line;
        line = line.replace(/\btext-white\b/g, 'text-on-accent')
                   .replace(/\btext-bg-page\b/g, 'text-on-accent');
        
        // Also fix icon color that might be hardcoded as text-white in the same line
        if (oldLine !== line) {
          lines[i] = line;
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      modifiedFiles.push(filePath);
    }
  }
});

console.log("Modified files with template literals:", modifiedFiles);
