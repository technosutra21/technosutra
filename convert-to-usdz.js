const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configurações
const INPUT_DIR = './';
const OUTPUT_DIR = './usdz';
const PYTHON_SCRIPT = 'glb_to_usdz.py';

// Função para executar comando
function executeCommand(command, args, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, { cwd, stdio: 'inherit' });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Processo falhou com código: ${code}`));
            }
        });
        
        child.on('error', (error) => {
            reject(error);
        });
    });
}

// Função para criar diretório se não existir
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Diretório criado: ${dirPath}`);
    }
}

// Função para obter todos os arquivos GLB
function getGLBFiles() {
    const files = fs.readdirSync(INPUT_DIR);
    return files.filter(file => file.toLowerCase().endsWith('.glb'));
}

// Função para converter GLB para USDZ usando Python
async function convertGLBToUSDZ(inputFile, outputFile) {
    try {
        console.log(`🔄 Convertendo: ${inputFile} → ${outputFile}`);
        
        // Usar o script Python para conversão
        await executeCommand('python', [PYTHON_SCRIPT, inputFile, outputFile]);
        
        console.log(`✅ Sucesso: ${outputFile}`);
        return true;
    } catch (error) {
        console.error(`❌ Erro convertendo ${inputFile}:`, error.message);
        return false;
    }
}

// Função principal
async function main() {
    console.log('🚀 Iniciando conversão GLB → USDZ...\n');
    
    // Verificar se o script Python existe
    if (!fs.existsSync(PYTHON_SCRIPT)) {
        console.error(`❌ Script Python não encontrado: ${PYTHON_SCRIPT}`);
        console.log('📋 Criando script Python...');
        
        // Criar o script Python
        const pythonScript = `#!/usr/bin/env python3
import sys
import os
import subprocess

def convert_glb_to_usdz(input_file, output_file):
    """
    Converte GLB para USDZ usando USD Tools
    """
    try:
        # Verificar se o arquivo de entrada existe
        if not os.path.exists(input_file):
            print(f"❌ Arquivo não encontrado: {input_file}")
            return False
        
        # Criar diretório de saída se não existir
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        # Comando para conversão usando USD Tools
        cmd = [
            "usdcat",
            "--flatten",
            input_file,
            "-o",
            output_file
        ]
        
        print(f"🔄 Executando: {' '.join(cmd)}")
        
        # Executar comando
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Conversão bem-sucedida: {output_file}")
            return True
        else:
            print(f"❌ Erro na conversão: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Erro: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python glb_to_usdz.py <input.glb> <output.usdz>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    success = convert_glb_to_usdz(input_file, output_file)
    sys.exit(0 if success else 1)
`;
        
        fs.writeFileSync(PYTHON_SCRIPT, pythonScript);
        console.log(`✅ Script Python criado: ${PYTHON_SCRIPT}\n`);
    }
    
    // Criar diretório de saída
    ensureDirectoryExists(OUTPUT_DIR);
    
    // Obter todos os arquivos GLB
    const glbFiles = getGLBFiles();
    
    if (glbFiles.length === 0) {
        console.log('⚠️  Nenhum arquivo GLB encontrado');
        return;
    }
    
    console.log(`📋 Encontrados ${glbFiles.length} arquivos GLB:`);
    glbFiles.forEach(file => console.log(`   - ${file}`));
    console.log('');
    
    // Estatísticas
    let successful = 0;
    let failed = 0;
    
    // Converter cada arquivo
    for (const glbFile of glbFiles) {
        const baseName = path.basename(glbFile, '.glb');
        const outputFile = path.join(OUTPUT_DIR, `${baseName}.usdz`);
        
        const success = await convertGLBToUSDZ(glbFile, outputFile);
        
        if (success) {
            successful++;
        } else {
            failed++;
        }
    }
    
    // Relatório final
    console.log('\n📊 Relatório Final:');
    console.log(`✅ Conversões bem-sucedidas: ${successful}`);
    console.log(`❌ Conversões falhas: ${failed}`);
    console.log(`📁 Arquivos USDZ salvos em: ${OUTPUT_DIR}`);
    
    if (successful > 0) {
        console.log('\n🎉 Conversão concluída! Agora atualize o index.html para usar a pasta usdz/');
    }
}

// Executar se for chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}
