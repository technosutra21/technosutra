# Script to convert Sanskrit diacritical marks to ASCII equivalents in filenames
# This script handles common Sanskrit diacritics like Ṇ→N, Ḍ→D, Ś→S, etc.

param(
    [string]$Path = ".",
    [switch]$WhatIf = $false
)

# Define the diacritical mark mappings
$diacriticalMap = @{
    # Retroflex consonants
    'Ṇ' = 'N'
    'ṇ' = 'n'
    'Ḍ' = 'D'
    'ḍ' = 'd'
    'Ṭ' = 'T'
    'ṭ' = 't'
    'Ṛ' = 'R'
    'ṛ' = 'r'
    'Ṝ' = 'R'
    'ṝ' = 'r'
    'Ḷ' = 'L'
    'ḷ' = 'l'
    'Ḹ' = 'L'
    'ḹ' = 'l'
    
    # Sibilants
    'Ś' = 'S'
    'ś' = 's'
    'Ṣ' = 'S'
    'ṣ' = 's'
    
    # Vowels with macrons
    'Ā' = 'A'
    'ā' = 'a'
    'Ī' = 'I'
    'ī' = 'i'
    'Ū' = 'U'
    'ū' = 'u'
    'Ē' = 'E'
    'ē' = 'e'
    'Ō' = 'O'
    'ō' = 'o'
    
    # Nasals and other marks
    'Ṃ' = 'M'
    'ṃ' = 'm'
    'Ṁ' = 'M'
    'ṁ' = 'm'
    'Ṅ' = 'N'
    'ṅ' = 'n'
    'Ñ' = 'N'
    'ñ' = 'n'
    'Ṉ' = 'N'
    'ṉ' = 'n'
    
    # Visarga and other diacritics
    'Ḥ' = 'H'
    'ḥ' = 'h'
    
    # Less common diacritics
    'Ḻ' = 'L'
    'ḻ' = 'l'
    'Ṟ' = 'R'
    'ṟ' = 'r'
    'Ḵ' = 'K'
    'ḵ' = 'k'
    'Ṯ' = 'T'
    'ṯ' = 't'
    'Ḏ' = 'D'
    'ḏ' = 'd'
    'Ḇ' = 'B'
    'ḇ' = 'b'
    'Ḡ' = 'G'
    'ḡ' = 'g'
    'Ṗ' = 'P'
    'ṗ' = 'p'
    'Ṿ' = 'V'
    'ṿ' = 'v'
    'Ẇ' = 'W'
    'ẇ' = 'w'
    'Ẋ' = 'X'
    'ẋ' = 'x'
    'Ẏ' = 'Y'
    'ẏ' = 'y'
    'Ż' = 'Z'
    'ż' = 'z'
}

function Convert-DiacriticalMarks {
    param([string]$text)
    
    $result = $text
    foreach ($key in $diacriticalMap.Keys) {
        $result = $result.Replace($key, $diacriticalMap[$key])
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
        Write-Host "  .\convert-diacritics.ps1" -ForegroundColor White
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
