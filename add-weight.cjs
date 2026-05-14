const fs = require('fs');
const path = require('path');

function walkSync(dir, exts) {
  const r = [];
  for (const e of fs.readdirSync(dir)) {
    const full = path.join(dir, e);
    if (fs.statSync(full).isDirectory()) r.push(...walkSync(full, exts));
    else if (exts.some(x => full.endsWith(x))) r.push(full);
  }
  return r;
}

const solar = require('./node_modules/@solar-icons/react');
const solarNames = new Set(Object.keys(solar).filter(k => !['SSR','category','solar','IconBase'].includes(k)));

function addWeightToFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*["']@solar-icons\/react["']/);
  if (!importMatch) return false;

  const localNames = new Set();
  for (const part of importMatch[1].split(',')) {
    const t = part.trim();
    const asMatch = t.match(/^(\w+)\s+as\s+(\w+)$/);
    if (asMatch) { if (solarNames.has(asMatch[1])) localNames.add(asMatch[2]); }
    else if (/^\w+$/.test(t) && solarNames.has(t)) localNames.add(t);
  }

  for (const name of localNames) {
    // Match self-closing JSX tags: <Name ...props... />
    // Use a state machine approach via regex with callback
    const tagPattern = new RegExp(
      '<(' + name + ')((?:\\s[\\s\\S]*?)?)(\\/>)',
      'g'
    );

    content = content.replace(tagPattern, (match, tagName, propsBlock, close) => {
      if (propsBlock.includes('weight=')) return match; // already has weight
      // Insert weight="BoldDuotone" right after tag name
      // Preserve the whitespace pattern (inline vs multiline)
      if (propsBlock.startsWith('\n') || propsBlock.match(/^\s*\n/)) {
        // Multiline: <Name\n  ...  /> → <Name weight="BoldDuotone"\n  ...  />
        return '<' + tagName + ' weight="BoldDuotone"' + propsBlock + close;
      } else if (propsBlock.startsWith(' ') || propsBlock === '') {
        // Inline: <Name .../> → <Name weight="BoldDuotone" .../>
        return '<' + tagName + ' weight="BoldDuotone"' + (propsBlock || ' ') + close;
      }
      return '<' + tagName + ' weight="BoldDuotone"' + propsBlock + close;
    });
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const files = walkSync('src', ['.jsx', '.tsx']);
let changed = 0;
for (const f of files) {
  try {
    if (addWeightToFile(f)) {
      changed++;
      console.log('Fixed: ' + f.split(path.sep).join('/'));
    }
  } catch (e) {
    console.error('Error: ' + f + ' - ' + e.message);
  }
}
console.log('\nTotal: ' + changed + ' files updated');
