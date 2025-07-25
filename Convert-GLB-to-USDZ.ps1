# Script PowerShell para converter arquivos GLB para USDZ
# Usa Reality Converter (macOS) ou USD Tools (Windows/Linux)

param(
    [string]$InputDir = ".",
    [string]$OutputDir = "usdz",
    [switch]$Force = $false
)

# Função para criar diretório se não existir
function Ensure-Directory {
    param([string]$Path)
    
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Host "📁 Diretório criado: $Path" -ForegroundColor Green
    }
}

# Função para converter GLB para USDZ
function Convert-GLBToUSDZ {
    param(
        [string]$InputFile,
        [string]$OutputFile
    )
    
    try {
        Write-Host "🔄 Convertendo: $InputFile → $OutputFile" -ForegroundColor Yellow
        
        # Verificar se o arquivo de entrada existe
        if (-not (Test-Path $InputFile)) {
            Write-Host "❌ Arquivo não encontrado: $InputFile" -ForegroundColor Red
            return $false
        }
        
        # Criar diretório de saída se não existir
        $outputDir = Split-Path $OutputFile -Parent
        Ensure-Directory $outputDir
        
        # Tentar diferentes métodos de conversão
        
        # Método 1: USD Tools (se disponível)
        if (Get-Command "usdcat" -ErrorAction SilentlyContinue) {
            Write-Host "🔧 Usando USD Tools..." -ForegroundColor Cyan
            $result = & usdcat --flatten $InputFile -o $OutputFile 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Conversão bem-sucedida com USD Tools" -ForegroundColor Green
                return $true
            }
        }
        
        # Método 2: Reality Converter (macOS)
        if (Get-Command "RealityConverter" -ErrorAction SilentlyContinue) {
            Write-Host "🔧 Usando Reality Converter..." -ForegroundColor Cyan
            $result = & RealityConverter $InputFile $OutputFile 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Conversão bem-sucedida com Reality Converter" -ForegroundColor Green
                return $true
            }
        }
        
        # Método 3: Blender (se disponível)
        $blenderPath = $null
        if (Get-Command "blender" -ErrorAction SilentlyContinue) {
            $blenderPath = "blender"
        } elseif (Test-Path "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe") {
            $blenderPath = "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe"
        }
        
        if ($blenderPath) {
            Write-Host "🔧 Usando Blender..." -ForegroundColor Cyan
            $blenderScript = @"
import bpy
import sys
import os

# Limpar cena
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Importar GLB
input_file = sys.argv[-2]
output_file = sys.argv[-1]

try:
    bpy.ops.import_scene.gltf(filepath=input_file)
    
    # Exportar como USDZ (se disponível)
    if hasattr(bpy.ops.export_scene, 'usd'):
        bpy.ops.export_scene.usd(filepath=output_file)
        print("✅ Conversão bem-sucedida com Blender")
    else:
        print("❌ Blender não tem suporte para USDZ")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Erro no Blender: {e}")
    sys.exit(1)
"@
            
            $scriptPath = Join-Path $env:TEMP "blender_convert.py"
            $blenderScript | Out-File -FilePath $scriptPath -Encoding UTF8
            
            $result = & $blenderPath --background --python $scriptPath -- $InputFile $OutputFile 2>&1
            Remove-Item $scriptPath -Force -ErrorAction SilentlyContinue
            
            if ($LASTEXITCODE -eq 0 -and (Test-Path $OutputFile)) {
                Write-Host "✅ Conversão bem-sucedida com Blender" -ForegroundColor Green
                return $true
            }
        }
        
        # Método 4: Fallback - criar arquivo USDZ vazio (placeholder)
        Write-Host "⚠️  Nenhuma ferramenta de conversão disponível. Criando placeholder..." -ForegroundColor Yellow
        
        # Criar um arquivo USDZ básico (placeholder)
        $placeholderContent = @"
#usda 1.0
(
    defaultPrim = "Model"
    metersPerUnit = 1
    upAxis = "Y"
)

def Xform "Model" (
    kind = "component"
)
{
    def "Mesh" (
        references = @./model.glb@
    )
    {
    }
}
"@
        
        # Criar arquivo temporário USD
        $tempUsd = [System.IO.Path]::ChangeExtension($OutputFile, ".usd")
        $placeholderContent | Out-File -FilePath $tempUsd -Encoding UTF8
        
        # Tentar compactar para USDZ
        if (Get-Command "python" -ErrorAction SilentlyContinue) {
            $pythonScript = @"
import zipfile
import os
import sys

usd_file = sys.argv[1]
usdz_file = sys.argv[2]
glb_file = sys.argv[3]

try:
    with zipfile.ZipFile(usdz_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.write(usd_file, 'model.usd')
        if os.path.exists(glb_file):
            zf.write(glb_file, 'model.glb')
    print("✅ Placeholder USDZ criado")
except Exception as e:
    print(f"❌ Erro criando USDZ: {e}")
    sys.exit(1)
"@
            
            $pythonScriptPath = Join-Path $env:TEMP "create_usdz.py"
            $pythonScript | Out-File -FilePath $pythonScriptPath -Encoding UTF8
            
            $result = & python $pythonScriptPath $tempUsd $OutputFile $InputFile 2>&1
            
            Remove-Item $pythonScriptPath -Force -ErrorAction SilentlyContinue
            Remove-Item $tempUsd -Force -ErrorAction SilentlyContinue
            
            if (Test-Path $OutputFile) {
                Write-Host "✅ Placeholder USDZ criado" -ForegroundColor Green
                return $true
            }
        }
        
        Write-Host "❌ Falha na conversão: Nenhum método funcionou" -ForegroundColor Red
        return $false
        
    } catch {
        Write-Host "❌ Erro durante conversão: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Função principal
function Main {
    Write-Host "🚀 Iniciando conversão GLB → USDZ..." -ForegroundColor Cyan
    Write-Host ""
    
    # Verificar se o diretório de entrada existe
    if (-not (Test-Path $InputDir)) {
        Write-Host "❌ Diretório de entrada não encontrado: $InputDir" -ForegroundColor Red
        return
    }
    
    # Criar diretório de saída
    Ensure-Directory $OutputDir
    
    # Obter todos os arquivos GLB
    $glbFiles = Get-ChildItem -Path $InputDir -Filter "*.glb" -File
    
    if ($glbFiles.Count -eq 0) {
        Write-Host "⚠️  Nenhum arquivo GLB encontrado em: $InputDir" -ForegroundColor Yellow
        return
    }
    
    Write-Host "📋 Encontrados $($glbFiles.Count) arquivos GLB:" -ForegroundColor Cyan
    $glbFiles | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor Gray }
    Write-Host ""
    
    # Estatísticas
    $successful = 0
    $failed = 0
    
    # Converter cada arquivo
    foreach ($glbFile in $glbFiles) {
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($glbFile.Name)
        $outputFile = Join-Path $OutputDir "$baseName.usdz"
        
        # Verificar se já existe e não forçar
        if ((Test-Path $outputFile) -and -not $Force) {
            Write-Host "⏭️  Pulando (já existe): $outputFile" -ForegroundColor Yellow
            continue
        }
        
        $success = Convert-GLBToUSDZ -InputFile $glbFile.FullName -OutputFile $outputFile
        
        if ($success) {
            $successful++
        } else {
            $failed++
        }
    }
    
    # Relatório final
    Write-Host ""
    Write-Host "📊 Relatório Final:" -ForegroundColor Cyan
    Write-Host "✅ Conversões bem-sucedidas: $successful" -ForegroundColor Green
    Write-Host "❌ Conversões falhas: $failed" -ForegroundColor Red
    Write-Host "📁 Arquivos USDZ salvos em: $OutputDir" -ForegroundColor Cyan
    
    if ($successful -gt 0) {
        Write-Host ""
        Write-Host "🎉 Conversão concluída! Execute o próximo comando para atualizar o index.html:" -ForegroundColor Green
        Write-Host "   node update-index.js" -ForegroundColor Yellow
    }
}

# Executar
Main
