const fs = require('fs');
const path = require('path');

// Final cleanup script for remaining console statements
console.log('🔧 Final cleanup of remaining console statements...\n');

const filesToProcess = [
    'galeria-optimized.html',
    'galeria_imagens_wix_iframe.txt',
    'integration_guide.md',
    'summaries/txt/iframe_fullscreen_aggressive.html',
    'summaries/txt/iframe_wrapper_fixed.html'
];

let totalCleaned = 0;

filesToProcess.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${fileName}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Count active console statements
    const beforeCount = (content.match(/^(\s*)(console\.(log|error|warn|info|debug))/gm) || []).length;
    
    if (beforeCount === 0) {
        console.log(`✅ ${fileName}: Already clean`);
        return;
    }
    
    // Replace active console statements with dev comments
    content = content.replace(
        /^(\s*)(console\.(log|error|warn|info|debug))/gm,
        '$1// Dev: $2'
    );
    
    const afterCount = (content.match(/^(\s*)(console\.(log|error|warn|info|debug))/gm) || []).length;
    const cleanedCount = beforeCount - afterCount;
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${fileName}: ${cleanedCount} console statements cleaned`);
        totalCleaned += cleanedCount;
    }
});

console.log(`\n📊 Final cleanup complete: ${totalCleaned} statements cleaned`);
console.log(`🔒 Production build ready for deployment`);
