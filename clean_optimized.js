const fs = require('fs');

// Clean up optimized service worker
console.log('🧹 Cleaning optimized service worker...');

const swPath = './sw-optimized.js';
if (fs.existsSync(swPath)) {
    let content = fs.readFileSync(swPath, 'utf8');
    
    // Replace all console statements with dev comments
    content = content.replace(
        /^(\s*)(console\.(log|error|warn|info|debug))/gm,
        '$1// Dev: $2'
    );
    
    fs.writeFileSync(swPath, content, 'utf8');
    console.log('✅ sw-optimized.js cleaned');
} else {
    console.log('⚠️  sw-optimized.js not found');
}

console.log('🔒 Optimized files production ready');
