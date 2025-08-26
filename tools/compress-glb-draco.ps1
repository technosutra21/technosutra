# PowerShell Script to Compress GLB Files with Draco
# This script compresses GLB files for better PWA storage efficiency
# Usage: .\compress-glb-draco.ps1 [-Directory <path>] (default: current directory)

param(
    [string]$Directory = "."
)

Write-Host "🚀 GLB Draco Compression Script for Techno Sutra AR" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Check Node.js installation first
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found or not working properly" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if gltf-pipeline is installed
$gltfPipelineInstalled = Get-Command "gltf-pipeline" -ErrorAction SilentlyContinue

if (-not $gltfPipelineInstalled) {
    Write-Host "❌ gltf-pipeline not found." -ForegroundColor Red
    $installConfirm = Read-Host "Would you like to install it now? (y/n)"
    if ($installConfirm -eq 'y') {
        Write-Host "📦 Installing gltf-pipeline globally via npm..." -ForegroundColor Yellow
        npm install -g gltf-pipeline
        # Re-check after install
        $gltfPipelineInstalled = Get-Command "gltf-pipeline" -ErrorAction SilentlyContinue
        if (-not $gltfPipelineInstalled) {
            Write-Host "❌ Installation failed. Please run 'npm install -g gltf-pipeline' manually and try again." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "📦 Please run: npm install -g gltf-pipeline" -ForegroundColor Yellow
        Write-Host "Then run this script again." -ForegroundColor Yellow
        exit 1
    }
}

# Verify gltf-pipeline works by checking version
try {
    $gltfVersion = cmd /c "gltf-pipeline --version 2>&1"
    Write-Host "✅ gltf-pipeline verified: $gltfVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ gltf-pipeline installed but fails to run. Try restarting your shell or reinstalling." -ForegroundColor Red
    exit 1
}

# Get all GLB files in specified directory
$glbFiles = Get-ChildItem -Path $Directory -Filter "*.glb"

if ($glbFiles.Count -eq 0) {
    Write-Host "❌ No GLB files found in directory: $Directory" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Found $($glbFiles.Count) GLB files to compress" -ForegroundColor Green

# Create backup directory in the target directory
$backupDir = Join-Path $Directory "glb-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "💾 Created backup directory: $backupDir" -ForegroundColor Yellow

$totalOriginalSize = 0
$totalCompressedSize = 0
$processedCount = 0

$i = 0
foreach ($file in $glbFiles) {
    $i++
    Write-Progress -Activity "Compressing GLB Files" -Status "Processing $($file.Name) ($i of $($glbFiles.Count))" -PercentComplete (($i / $glbFiles.Count) * 100)

    $originalSize = $file.Length
    $totalOriginalSize += $originalSize
    
    Write-Host "🔄 Processing: $($file.Name)" -ForegroundColor Cyan
    
    # Backup original file
    Copy-Item $file.FullName -Destination $backupDir
    
    # Compress with Draco
    $tempFile = Join-Path $Directory "$($file.BaseName)_compressed.glb"
    
    try {
        # Build the command string with proper quoting
        $inputPath = "`"$($file.FullName)`""
        $outputPath = "`"$tempFile`""
        $command = "gltf-pipeline -i $inputPath -o $outputPath -d --draco.compressionLevel 7 --draco.quantizePositionBits 11 --draco.quantizeNormalBits 8 --draco.quantizeTexcoordBits 10"
        
        # Execute using cmd to avoid PowerShell execution issues
        $result = cmd /c "$command 2>&1"
        
        if (Test-Path $tempFile) {
            $compressedSize = (Get-Item $tempFile).Length
            $compressionRatio = [math]::Round((($originalSize - $compressedSize) / $originalSize) * 100, 1)
            
            # Replace original with compressed version
            Move-Item $tempFile $file.FullName -Force
            
            $totalCompressedSize += $compressedSize
            $processedCount++
            
            Write-Host "  ✅ Compressed: $([math]::Round($originalSize/1KB, 1))KB → $([math]::Round($compressedSize/1KB, 1))KB ($compressionRatio% reduction)" -ForegroundColor Green
        }
        else {
            Write-Host "  ❌ Compression failed for $($file.Name)" -ForegroundColor Red
            if ($result) {
                Write-Host "  Output: $result" -ForegroundColor Yellow
            }
        }
    }
    catch {
        Write-Host "  ❌ Error executing gltf-pipeline for $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
    finally {
        # Clean up temp file if it still exists
        if (Test-Path $tempFile) { 
            Remove-Item $tempFile -ErrorAction SilentlyContinue 
        }
    }
}

Write-Progress -Activity "Compressing GLB Files" -Completed

# Summary
Write-Host "`n📊 COMPRESSION SUMMARY" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host "Files processed: $processedCount / $($glbFiles.Count)" -ForegroundColor White
Write-Host "Original total size: $([math]::Round($totalOriginalSize/1MB, 2)) MB" -ForegroundColor White
Write-Host "Compressed total size: $([math]::Round($totalCompressedSize/1MB, 2)) MB" -ForegroundColor White

if ($totalOriginalSize -gt 0) {
    $totalSavings = [math]::Round((($totalOriginalSize - $totalCompressedSize) / $totalOriginalSize) * 100, 1)
    $spaceSaved = [math]::Round(($totalOriginalSize - $totalCompressedSize)/1MB, 2)
    Write-Host "Space saved: $spaceSaved MB ($totalSavings%)" -ForegroundColor Green
}

Write-Host "`n💾 Original files backed up to: $backupDir" -ForegroundColor Yellow
Write-Host "🎯 Your GLB files are now optimized for PWA caching!" -ForegroundColor Green

Write-Host "`n📱 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update your service worker cache version" -ForegroundColor White
Write-Host "2. Test the compressed models in your gallery" -ForegroundColor White
Write-Host "3. If models look good, you can delete the backup folder" -ForegroundColor White
Write-Host "4. If errors persist, validate your GLB files at https://github.khronos.org/glTF-Validator/" -ForegroundColor White