# Script to convert Sanskrit diacritical marks to ASCII equivalents in filenames
# This script handles common Sanskrit diacritics like Ṇ→N, Ḍ→D, Ś→S, etc.

param(
    [string]$Path = ".",
    [switch]$WhatIf = $false
)

function Convert-DiacriticalMarks {
    param([string]$text)
    
    # Define replacements in order of application
    $replacements = @(
        # Retroflex consonants  
        @{ from = "Ṇ"; to = "N" }
        @{ from = "ṇ"; to = "n" }
        @{ from = "Ḍ"; to = "D" }
        @{ from = "ḍ"; to = "d" }
        @{ from = "Ṭ"; to = "T" }
        @{ from = "ṭ"; to = "t" }
        @{ from = "Ṛ"; to = "R" }
        @{ from = "ṛ"; to = "r" }
        @{ from = "Ṝ"; to = "R" }
        @{ from = "ṝ"; to = "r" }
        @{ from = "Ḷ"; to = "L" }
        @{ from = "ḷ"; to = "l" }
        @{ from = "Ḹ"; to = "L" }
        @{ from = "ḹ"; to = "l" }
        
        # Sibilants
        @{ from = "Ś"; to = "S" }
        @{ from = "ś"; to = "s" }
        @{ from = "Ṣ"; to = "S" }
        @{ from = "ṣ"; to = "s" }
        
        # Vowels with macrons
        @{ from = "Ā"; to = "A" }
        @{ from = "ā"; to = "a" }
        @{ from = "Ī"; to = "I" }
        @{ from = "ī"; to = "i" }
        @{ from = "Ū"; to = "U" }
        @{ from = "ū"; to = "u" }
        @{ from = "Ē"; to = "E" }
        @{ from = "ē"; to = "e" }
        @{ from = "Ō"; to = "O" }
        @{ from = "ō"; to = "o" }
        
        # Nasals and other marks
        @{ from = "Ṃ"; to = "M" }
        @{ from = "ṃ"; to = "m" }
        @{ from = "Ṁ"; to = "M" }
        @{ from = "ṁ"; to = "m" }
        @{ from = "Ṅ"; to = "N" }
        @{ from = "ṅ"; to = "n" }
        @{ from = "Ñ"; to = "N" }
        @{ from = "ñ"; to = "n" }
        @{ from = "Ṉ"; to = "N" }
        @{ from = "ṉ"; to = "n" }
        
        # Visarga and other diacritics
        @{ from = "Ḥ"; to = "H" }
        @{ from = "ḥ"; to = "h" }
        
        # Less common diacritics  
        @{ from = "Ḻ"; to = "L" }
        @{ from = "ḻ"; to = "l" }
        @{ from = "Ṟ"; to = "R" }
        @{ from = "ṟ"; to = "r" }
        @{ from = "Ḵ"; to = "K" }
        @{ from = "ḵ"; to = "k" }
        @{ from = "Ṯ"; to = "T" }
        @{ from = "ṯ"; to = "t" }
        @{ from = "Ḏ"; to = "D" }
        @{ from = "ḏ"; to = "d" }
        @{ from = "Ḇ"; to = "B" }
        @{ from = "ḇ"; to = "b" }
        @{ from = "Ḡ"; to = "G" }
        @{ from = "ḡ"; to = "g" }
        @{ from = "Ṗ"; to = "P" }
        @{ from = "ṗ"; to = "p" }
        @{ from = "Ṿ"; to = "V" }
        @{ from = "ṿ"; to = "v" }
        @{ from = "Ẇ"; to = "W" }
        @{ from = "ẇ"; to = "w" }
        @{ from = "Ẋ"; to = "X" }
        @{ from = "ẋ"; to = "x" }
        @{ from = "Ẏ"; to = "Y" }
        @{ from = "ẏ"; to = "y" }
        @{ from = "Ż"; to = "Z" }
        @{ from = "ż"; to = "z" }
    )
    
    $result = $text
    foreach ($replacement in $replacements) {
        $result = $result.Replace($replacement.from, $replacement.to)
    }
    
    return $result
}

function Rename-FilesWithDiacritics {
    param(
        [string]$DirectoryPath,
        [switch]$WhatIf
    )
    
    # Get all files in the directory
    $files = Get-ChildItem -Path $DirectoryPath -File
    
    $renamedCount = 0
    $totalFiles = $files.Count
    
    Write-Host "Processing $totalFiles files in: $DirectoryPath" -ForegroundColor Green
    Write-Host "$(if ($WhatIf) { '[PREVIEW MODE - No actual changes will be made]' } else { '[LIVE MODE - Files will be renamed]' })" -ForegroundColor $(if ($WhatIf) { 'Yellow' } else { 'Red' })
    Write-Host ""
    
    foreach ($file in $files) {
        $originalName = $file.Name
        $newName = Convert-DiacriticalMarks -text $originalName
        
        if ($originalName -ne $newName) {
            $renamedCount++
            
            if ($WhatIf) {
                Write-Host "[$renamedCount] WOULD RENAME:" -ForegroundColor Yellow
                Write-Host "  FROM: $originalName" -ForegroundColor White
                Write-Host "  TO:   $newName" -ForegroundColor Green
                Write-Host ""
            } else {
                Write-Host "[$renamedCount] RENAMING:" -ForegroundColor Cyan
                Write-Host "  FROM: $originalName" -ForegroundColor White
                Write-Host "  TO:   $newName" -ForegroundColor Green
                
                try {
                    $newPath = Join-Path -Path $file.DirectoryName -ChildPath $newName
                    
                    # Check if target file already exists
                    if (Test-Path $newPath) {
                        Write-Host "  ERROR: Target file already exists!" -ForegroundColor Red
                        Write-Host ""
                        continue
                    }
                    
                    Rename-Item -Path $file.FullName -NewName $newName -ErrorAction Stop
                    Write-Host "  SUCCESS!" -ForegroundColor Green
                } catch {
                    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
                }
                Write-Host ""
            }
        }
    }
    
    Write-Host "Summary:" -ForegroundColor Green
    Write-Host "  Total files: $totalFiles"
    Write-Host "  Files $(if ($WhatIf) { 'that would be' } else { '' }) renamed: $renamedCount"
    Write-Host "  Files unchanged: $($totalFiles - $renamedCount)"
    
    if ($WhatIf -and $renamedCount -gt 0) {
        Write-Host ""
        Write-Host "To actually rename the files, run the script again without the -WhatIf parameter:" -ForegroundColor Yellow
        Write-Host "  .\convert-diacritics-simple.ps1" -ForegroundColor White
    }
}

# Main execution
if (-not (Test-Path $Path)) {
    Write-Host "Error: Path '$Path' does not exist!" -ForegroundColor Red
    exit 1
}

# Convert relative path to absolute path
$absolutePath = Resolve-Path $Path

Write-Host "Sanskrit Diacritical Marks to ASCII Converter" -ForegroundColor Magenta
Write-Host "=============================================" -ForegroundColor Magenta
Write-Host ""

# Show some example conversions
Write-Host "Example conversions:" -ForegroundColor Cyan
Write-Host "  MAÑJUŚRĪ → MANJUSRI" -ForegroundColor White
Write-Host "  SĀGARAMEGHA → SAGARAMEGHA" -ForegroundColor White
Write-Host "  SUPRATIṢṬHITA → SUPRATISTHITA" -ForegroundColor White
Write-Host "  BHĪSMOTTARANIRGHOṢA → BHISMOTTARANIRGHOṢA" -ForegroundColor White
Write-Host ""

Rename-FilesWithDiacritics -DirectoryPath $absolutePath -WhatIf:$WhatIf
