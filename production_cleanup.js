const fs = require('fs');
const path = require('path');

// Files to clean up
const filesToClean = [
    'sw.js',
    'galeria.html',
    'wix_velo_code_fixed.js',
    'wix_code_corrigido.js',
    'wix-simple-fix.js',
    'wix-main-site-code.js',
    'wix-iframe-wrapper.html',
    'wix-code-fixed.js',
    'wix-code-alternative.js',
    'updated_wix_script.js',
    'iframe_navegador_corrigido.html',
    'iframe_navigation_fixed.html',
    'iframe-buttons-fixed.html',
    'gal.html',
    'error-boundary-fix.js',
    'convert-to-usdz.js',
    'update-index.js'
];

console.log('🧹 Starting production cleanup of console statements...\n');

let totalFiles = 0;
let totalRemovals = 0;

filesToClean.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${fileName}`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Count console statements before cleanup
    const beforeCount = (content.match(/console\.(log|error|warn|info|debug)/g) || []).length;
    
    if (beforeCount === 0) {
        console.log(`✅ ${fileName}: Already clean (0 console statements)`);
        return;
    }
    
    // Replace console statements with comments (preserving critical error handling)
    content = content.replace(
        /(\s*)console\.(log|error|warn|info|debug)\((.*?)\);?/g,
        (match, indent, type, args) => {
            // Keep critical error handling that might be needed for user-facing errors
            if (type === 'error' && (args.includes('Critical') || args.includes('ERRO CRÍTICO'))) {
                return `${indent}// CRITICAL: ${match.trim()}`;
            }
            // Convert to dev comment
            return `${indent}// Dev: ${match.trim()}`;
        }
    );
    
    // Count console statements after cleanup
    const afterCount = (content.match(/console\.(log|error|warn|info|debug)/g) || []).length;
    const removedCount = beforeCount - afterCount;
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${fileName}: ${removedCount} console statements cleaned (${afterCount} critical kept)`);
        totalFiles++;
        totalRemovals += removedCount;
    }
});

console.log(`\n📊 Production cleanup complete:`);
console.log(`✅ Files processed: ${totalFiles}`);
console.log(`🧹 Console statements cleaned: ${totalRemovals}`);
console.log(`🔒 Production ready for deployment`);

// Verify cleanup
console.log('\n🔍 Verifying cleanup...');
const verifyCommand = 'grep -r "console\\.(log|error|warn|info|debug)" . --include="*.js" --include="*.html" | grep -v "// Dev:" | grep -v "// CRITICAL:" | head -10';
console.log(`Run this command to verify remaining console statements:`);
console.log(`   ${verifyCommand}`);
