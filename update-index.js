const fs = require('fs');
const path = require('path');

// Configurações
const INDEX_FILE = 'index.html';
const USDZ_DIR = 'usdz';

function updateIndexHTML() {
    console.log('🔄 Atualizando index.html para usar pasta usdz...\n');
    
    // Verificar se o arquivo index.html existe
    if (!fs.existsSync(INDEX_FILE)) {
        console.error(`❌ Arquivo não encontrado: ${INDEX_FILE}`);
        return false;
    }
    
    // Ler o conteúdo do arquivo
    let content = fs.readFileSync(INDEX_FILE, 'utf8');
    
    // Backup do arquivo original
    const backupFile = `${INDEX_FILE}.backup`;
    if (!fs.existsSync(backupFile)) {
        fs.writeFileSync(backupFile, content);
        console.log(`💾 Backup criado: ${backupFile}`);
    }
    
    // Atualizar a função loadModel para usar a pasta usdz
    const oldLoadModelFunction = content.match(/\/\/ Carregar modelo[\s\S]*?(?=\s*\/\/ Detectar dispositivos)/);
    
    if (oldLoadModelFunction) {
        const newLoadModelFunction = `        // Carregar modelo
        async function loadModel() {
            const modelSrc = \`modelo\${modelId}.glb\`;
            const usdzSrc = \`${USDZ_DIR}/modelo\${modelId}.usdz\`;
            logStatus(\`Carregando modelo: \${modelSrc}\`);

            try {
                const exists = await checkModelExists(modelSrc);
                if (!exists) {
                    // Modelo não encontrado - mostrar erro 404
                    show404Error();
                    throw new Error(\`Modelo \${modelId} não encontrado\`);
                }

                if (!modelViewer) {
                    throw new Error('Model viewer não inicializado');
                }

                modelViewer.src = modelSrc;
                
                // Verificar se existe arquivo USDZ específico para iOS na pasta usdz
                const usdzExists = await checkModelExists(usdzSrc);
                if (usdzExists) {
                    modelViewer.setAttribute('ios-src', usdzSrc);
                    logStatus(\`Arquivo USDZ encontrado para iOS: \${usdzSrc}\`);
                } else {
                    logStatus('Usando conversão automática GLB → USDZ para iOS (nenhum arquivo USDZ encontrado na pasta usdz)');
                }
                
                // Definir escala AR para 160%
                modelViewer.style.setProperty('--ar-scale', '1.6');
                logStatus('Modelo GLB configurado para todas as plataformas com escala AR 160%');

                return true;

            } catch (error) {
                logStatus(\`Erro ao carregar modelo: \${error.message}\`);
                if (!is404Error) {
                    showStatus('Erro ao carregar modelo 3D', 'error');
                }
                modelLoaded = false;
                updateARButtonState();
                return false;
            }
        }
        `;
        
        // Substituir a função antiga pela nova
        content = content.replace(oldLoadModelFunction[0], newLoadModelFunction);
        
        console.log('✅ Função loadModel atualizada para usar pasta usdz');
    } else {
        console.log('⚠️  Função loadModel não encontrada - tentando outro método...');
        
        // Método alternativo: buscar pela linha específica
        const usdzLineRegex = /const usdzSrc = `modelo\${modelId}\.usdz`;/;
        if (content.match(usdzLineRegex)) {
            content = content.replace(usdzLineRegex, `const usdzSrc = \`${USDZ_DIR}/modelo\${modelId}.usdz\`;`);
            console.log('✅ Linha usdzSrc atualizada para usar pasta usdz');
        } else {
            console.log('⚠️  Não foi possível encontrar a linha usdzSrc para atualizar');
        }
    }
    
    // Verificar se a pasta usdz existe
    if (!fs.existsSync(USDZ_DIR)) {
        console.log(`📁 Criando pasta ${USDZ_DIR}...`);
        fs.mkdirSync(USDZ_DIR, { recursive: true });
    }
    
    // Contar arquivos USDZ na pasta
    const usdzFiles = fs.readdirSync(USDZ_DIR).filter(file => file.endsWith('.usdz'));
    
    // Escrever o arquivo atualizado
    fs.writeFileSync(INDEX_FILE, content);
    
    // Relatório
    console.log('\n📊 Relatório de Atualização:');
    console.log(`✅ Arquivo atualizado: ${INDEX_FILE}`);
    console.log(`📁 Pasta USDZ: ${USDZ_DIR}`);
    console.log(`📄 Arquivos USDZ encontrados: ${usdzFiles.length}`);
    
    if (usdzFiles.length > 0) {
        console.log('\n📋 Arquivos USDZ disponíveis:');
        usdzFiles.forEach(file => console.log(`   - ${file}`));
    } else {
        console.log('\n⚠️  Nenhum arquivo USDZ encontrado na pasta. Execute a conversão primeiro:');
        console.log('   .\\Convert-GLB-to-USDZ.ps1');
    }
    
    console.log('\n🎉 Atualização concluída!');
    console.log('🚀 Agora o index.html procurará arquivos USDZ na pasta usdz/');
    
    return true;
}

// Função para verificar diferenças
function showDifferences() {
    const backupFile = `${INDEX_FILE}.backup`;
    
    if (!fs.existsSync(backupFile)) {
        console.log('⚠️  Arquivo de backup não encontrado');
        return;
    }
    
    const originalContent = fs.readFileSync(backupFile, 'utf8');
    const newContent = fs.readFileSync(INDEX_FILE, 'utf8');
    
    if (originalContent === newContent) {
        console.log('ℹ️  Nenhuma alteração detectada');
        return;
    }
    
    console.log('\n🔍 Principais alterações:');
    console.log('   - Caminho USDZ atualizado de "modelo{ID}.usdz" para "usdz/modelo{ID}.usdz"');
    console.log('   - Função loadModel modificada para usar subpasta usdz');
}

// Função para restaurar backup
function restoreBackup() {
    const backupFile = `${INDEX_FILE}.backup`;
    
    if (!fs.existsSync(backupFile)) {
        console.log('❌ Arquivo de backup não encontrado');
        return false;
    }
    
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    fs.writeFileSync(INDEX_FILE, backupContent);
    
    console.log('✅ Backup restaurado com sucesso');
    return true;
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

if (args.includes('--restore')) {
    restoreBackup();
} else if (args.includes('--diff')) {
    showDifferences();
} else {
    updateIndexHTML();
    if (args.includes('--show-diff')) {
        showDifferences();
    }
}
