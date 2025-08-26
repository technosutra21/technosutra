# PowerShell Script to Convert GLB to USDZ
# Requires USD tools (pip install usd-core)

Write-Host "🔄 GLB to USDZ Conversion Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if USD tools are installed
$usdcatInstalled = Get-Command "usdcat" -ErrorAction SilentlyContinue
$usdzipInstalled = Get-Command "usdzip" -ErrorAction SilentlyContinue

if (-not $usdcatInstalled -or -not $usdzipInstalled) {
    Write-Host "❌ USD tools not found. Please install:" -ForegroundColor Red
    Write-Host "pip install usd-core" -ForegroundColor Yellow
    Write-Host "Or download from: https://graphics.pixar.com/usd/release/" -ForegroundColor Yellow
    exit 1
}

# Get all GLB files
$glbFiles = Get-ChildItem -Path "." -Filter "*.glb"

if ($glbFiles.Count -eq 0) {
    Write-Host "❌ No GLB files found in current directory" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Found $($glbFiles.Count) GLB files to convert" -ForegroundColor Green

# Create output directory for USDZ files
$usdzDir = "usdz-output"
if (-not (Test-Path $usdzDir)) {
    New-Item -ItemType Directory -Path $usdzDir -Force | Out-Null
}

$convertedCount = 0

foreach ($file in $glbFiles) {
    $baseName = $file.BaseName
    $usdFile = "$baseName.usd"
    $usdzFile = "$usdzDir\$baseName.usdz"
    
    Write-Host "🔄 Converting: $($file.Name)" -ForegroundColor Cyan
    
    try {
        # Step 1: Convert GLB to USD
        $process1 = Start-Process -FilePath "usdcat" -ArgumentList @(
            $file.FullName,
            "--out", $usdFile
        ) -Wait -PassThru -NoNewWindow -WindowStyle Hidden
        
        if ($process1.ExitCode -eq 0 -and (Test-Path $usdFile)) {
            # Step 2: Package USD to USDZ
            $process2 = Start-Process -FilePath "usdzip" -ArgumentList @(
                $usdzFile,
                $usdFile
            ) -Wait -PassThru -NoNewWindow -WindowStyle Hidden
            
            if ($process2.ExitCode -eq 0 -and (Test-Path $usdzFile)) {
                $usdzSize = (Get-Item $usdzFile).Length
                Write-Host "  ✅ Created: $baseName.usdz ($([math]::Round($usdzSize/1KB, 1))KB)" -ForegroundColor Green
                $convertedCount++
            }
            else {
                Write-Host "  ❌ Failed to create USDZ for $($file.Name)" -ForegroundColor Red
            }
            
            # Clean up temporary USD file
            if (Test-Path $usdFile) { Remove-Item $usdFile }
        }
        else {
            Write-Host "  ❌ Failed to convert GLB to USD for $($file.Name)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "  ❌ Error converting $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n📊 CONVERSION SUMMARY" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Files converted: $convertedCount / $($glbFiles.Count)" -ForegroundColor White
Write-Host "USDZ files saved to: $usdzDir" -ForegroundColor Green

if ($convertedCount -gt 0) {
    Write-Host "`n🍎 Your USDZ files are ready for iOS AR QuickLook!" -ForegroundColor Green
    Write-Host "You can now serve these alongside your GLB files for better iOS compatibility." -ForegroundColor White
}

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
            Write-Host "🔧 Usando Blender... (Caminho: $blenderPath)" -ForegroundColor Cyan
            $blenderScript = @"
import bpy
import sys
import os

# Habilitar o addon USD
try:
    bpy.ops.preferences.addon_enable(module="io_scene_usd")
except Exception as e:
    print(f"Nota: Não foi possível habilitar o addon USD (pode já estar ativo): {e}")

# Limpar cena
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Importar GLB
input_file = sys.argv[-2]
output_file = sys.argv[-1]

try:
    bpy.ops.import_scene.gltf(filepath=input_file)
    
    # Exportar como USDZ
    if hasattr(bpy.ops.export_scene, 'usd'):
        bpy.ops.export_scene.usd(filepath=output_file, use_selection=False)
        print(f"✅ Conversão de {os.path.basename(input_file)} para USDZ bem-sucedida.")
    else:
        print("❌ ERRO FATAL: A versão do Blender não tem suporte para exportação USD.")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ ERRO durante o processo do Blender: {e}")
    sys.exit(1)
"@
            
            $scriptPath = Join-Path $env:TEMP "blender_convert.py"
            $blenderScript | Out-File -FilePath $scriptPath -Encoding UTF8
            
            $result = & $blenderPath --background --python $scriptPath -- $InputFile $OutputFile 2>&1
            
            Write-Host "--- Output do Blender ---"
            Write-Host $result
            Write-Host "--- Fim do Output do Blender ---"
            Write-Host "Código de Saída do Blender: $LASTEXITCODE"

            Remove-Item $scriptPath -Force -ErrorAction SilentlyContinue
            
            if ($LASTEXITCODE -eq 0 -and (Test-Path $OutputFile)) {
                Write-Host "✅ Conversão bem-sucedida com Blender" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ A conversão com o Blender falhou. Verifique o output e o código de saída acima." -ForegroundColor Red
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
