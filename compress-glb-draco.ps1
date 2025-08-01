# PowerShell Script to Compress GLB Files with Draco
# This script compresses GLB files for better PWA storage efficiency

Write-Host "🚀 GLB Draco Compression Script for Techno Sutra AR" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Check if gltf-pipeline is installed
$gltfPipelineInstalled = Get-Command "gltf-pipeline" -ErrorAction SilentlyContinue

if (-not $gltfPipelineInstalled) {
    Write-Host "❌ gltf-pipeline not found. Installing..." -ForegroundColor Red
    Write-Host "📦 Run: npm install -g gltf-pipeline" -ForegroundColor Yellow
    Write-Host "Then run this script again." -ForegroundColor Yellow
    exit 1
}

# Get all GLB files in current directory
$glbFiles = Get-ChildItem -Path "." -Filter "*.glb"

if ($glbFiles.Count -eq 0) {
    Write-Host "❌ No GLB files found in current directory" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Found $($glbFiles.Count) GLB files to compress" -ForegroundColor Green

# Create backup directory
$backupDir = "glb-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Write-Host "💾 Created backup directory: $backupDir" -ForegroundColor Yellow

$totalOriginalSize = 0
$totalCompressedSize = 0
$processedCount = 0

foreach ($file in $glbFiles) {
    $originalSize = $file.Length
    $totalOriginalSize += $originalSize
    
    Write-Host "🔄 Processing: $($file.Name)" -ForegroundColor Cyan
    
    # Backup original file
    Copy-Item $file.FullName -Destination $backupDir
    
    # Compress with Draco
    $tempFile = "$($file.BaseName)_compressed.glb"
    
    try {
        # Run gltf-pipeline with Draco compression
        $process = Start-Process -FilePath "gltf-pipeline" -ArgumentList @(
            "-i", $file.FullName,
            "-o", $tempFile,
            "--draco.compressMeshes",
            "--draco.compressionLevel", "7",
            "--draco.quantizePositionBits", "11",
            "--draco.quantizeNormalBits", "8",
            "--draco.quantizeTexcoordBits", "10"
        ) -Wait -PassThru -WindowStyle Hidden
        
        if ($process.ExitCode -eq 0 -and (Test-Path $tempFile)) {
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
            if (Test-Path $tempFile) { Remove-Item $tempFile }
        }
    }
    catch {
        Write-Host "  ❌ Error compressing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
        if (Test-Path $tempFile) { Remove-Item $tempFile }
    }
}

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
