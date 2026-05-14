const fs = require('fs');
const path = require('path');

function walkSync(dir, exts) {
  const results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) results.push(...walkSync(full, exts));
    else if (exts.some(e => full.endsWith(e))) results.push(full);
  }
  return results;
}

const solar = require('./node_modules/@solar-icons/react');
const solarNames = new Set(Object.keys(solar).filter(k => !['SSR','category','solar','IconBase'].includes(k)));

const files = walkSync('src', ['.jsx', '.tsx']);
const issues = [];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');

  // Collect all imported names from all sources
  const importedNames = new Set();

  // Collect from @solar-icons/react
  const solarImport = content.match(/import\s*\{([^}]+)\}\s*from\s*["']@solar-icons\/react["']/);
  if (solarImport) {
    for (const part of solarImport[1].split(',')) {
      const trimmed = part.trim();
      const asMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
      if (asMatch) importedNames.add(asMatch[2]);
      else if (/^\w+$/.test(trimmed)) importedNames.add(trimmed);
    }
  }

  // Collect from other libraries (heroui, react-router, etc.)
  const allImports = [...content.matchAll(/import\s+(?:(?:\{[^}]+\}|\w+|\*\s+as\s+\w+)\s*,?\s*)*from\s*["'][^"']+["']/g)];
  for (const match of allImports) {
    const block = match[0];
    if (block.includes('@solar-icons')) continue;
    const braceContent = block.match(/\{([^}]+)\}/);
    if (braceContent) {
      for (const part of braceContent[1].split(',')) {
        const trimmed = part.trim();
        const asMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
        if (asMatch) importedNames.add(asMatch[2]);
        else if (/^\w+$/.test(trimmed)) importedNames.add(trimmed);
      }
    }
    // Default import
    const defaultMatch = block.match(/import\s+(\w+)\s+from/);
    if (defaultMatch) importedNames.add(defaultMatch[1]);
    // Namespace import
    const nsMatch = block.match(/\*\s+as\s+(\w+)/);
    if (nsMatch) importedNames.add(nsMatch[1]);
  }

  // Also collect variable declarations (const, let, function, class) at top level
  const varDecls = [...content.matchAll(/(?:const|let|var|function|class)\s+([A-Z]\w*)/g)];
  for (const match of varDecls) importedNames.add(match[1]);

  // Find all JSX component usages: <ComponentName (uppercase)
  const jsxUsages = [...content.matchAll(/<([A-Z][A-Za-z0-9]+)[\s/>]/g)].map(m => m[1]);

  for (const name of new Set(jsxUsages)) {
    if (!importedNames.has(name)) {
      issues.push({ file: f.replace(/\\/g, '/'), name });
    }
  }
}

if (issues.length === 0) {
  console.log('No issues found!');
} else {
  const grouped = {};
  for (const { file, name } of issues) {
    if (!grouped[file]) grouped[file] = [];
    grouped[file].push(name);
  }
  for (const [file, names] of Object.entries(grouped)) {
    console.log(file + ': ' + names.join(', '));
  }
}
