const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const issues = [];

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const fileName = path.relative(srcDir, filePath);

    // 1. Find all imports
    const importRegex = /^import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"]/gm;
    const defaultImportRegex = /^import\s+(\w+)\s+from\s+['"][^'"]+['"]/gm;
    
    let match;
    const allImports = [];
    
    while ((match = importRegex.exec(content)) !== null) {
        const names = match[1].split(',').map(n => n.trim().split(' as ')[0].trim()).filter(Boolean);
        allImports.push(...names);
    }
    while ((match = defaultImportRegex.exec(content)) !== null) {
        allImports.push(match[1].trim());
    }

    // 2. Check which are unused
    for (const imp of allImports) {
        if (!imp || imp.length < 2) continue;
        // Count usages beyond the import line itself
        const regex = new RegExp(`\\b${imp}\\b`, 'g');
        const usages = (content.match(regex) || []).length;
        // If only 1 usage (the import itself) → unused
        if (usages <= 1) {
            issues.push({ file: fileName, type: 'UNUSED_IMPORT', name: imp });
        }
    }

    // 3. Detect console.log (noise)
    lines.forEach((line, i) => {
        if (line.includes('console.log(') && !line.trim().startsWith('//')) {
            issues.push({ file: fileName, type: 'CONSOLE_LOG', line: i + 1, content: line.trim().substring(0, 80) });
        }
    });

    // 4. Detect TODO/FIXME
    lines.forEach((line, i) => {
        if (/TODO|FIXME|HACK|XXX/.test(line)) {
            issues.push({ file: fileName, type: 'TODO', line: i + 1, content: line.trim() });
        }
    });
}

function walk(dir) {
    for (const file of fs.readdirSync(dir)) {
        const p = path.join(dir, file);
        const stat = fs.statSync(p);
        if (stat.isDirectory() && !file.includes('node_modules')) walk(p);
        else if (p.endsWith('.jsx') || p.endsWith('.js')) scanFile(p);
    }
}

walk(srcDir);

// Group by file
const byFile = {};
for (const issue of issues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
}

const unusedImports = issues.filter(i => i.type === 'UNUSED_IMPORT');
const consoleLogs = issues.filter(i => i.type === 'CONSOLE_LOG');

console.log('=== UNUSED IMPORTS ===');
unusedImports.forEach(i => console.log(`  ${i.file}: ${i.name}`));
console.log('\n=== CONSOLE.LOG ===');
consoleLogs.forEach(i => console.log(`  ${i.file}:${i.line}`));
console.log(`\nTotal unused imports: ${unusedImports.length}`);
console.log(`Total console.logs: ${consoleLogs.length}`);
