const fs = require('fs');
const path = require('path');

const EXTENSIONS_TO_CONVERT = ['.js', '.jsx'];
const IGNORE_DIRS = ['node_modules', '.next', 'out', 'build', 'scripts'];
const IGNORE_FILES = ['next.config.js', 'server.js'];

function shouldConvertFile(filePath) {
  const ext = path.extname(filePath);
  const basename = path.basename(filePath);
  return EXTENSIONS_TO_CONVERT.includes(ext) && !IGNORE_FILES.includes(basename);
}

function shouldProcessDir(dirPath) {
  const dirname = path.basename(dirPath);
  return !IGNORE_DIRS.includes(dirname);
}

function getNewExtension(filePath) {
  const hasJSX = fs.readFileSync(filePath, 'utf8').includes('jsx');
  return hasJSX ? '.tsx' : '.ts';
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory() && shouldProcessDir(fullPath)) {
      processDirectory(fullPath);
    } else if (entry.isFile() && shouldConvertFile(fullPath)) {
      const newExt = getNewExtension(fullPath);
      const newPath = fullPath.replace(/\.(js|jsx)$/, newExt);
      
      console.log(`Converting ${fullPath} to ${newPath}`);
      fs.renameSync(fullPath, newPath);
    }
  }
}

// Start the migration process
console.log('Starting migration to TypeScript...');
processDirectory(path.resolve(__dirname, '..'));
console.log('Migration complete! Please review the changes and add type annotations as needed.'); 