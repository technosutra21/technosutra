# Enhanced Script to convert Sanskrit diacritical marks to ASCII equivalents in filenames
# This script handles common Sanskrit diacritics and Unicode normalization
# Specifically designed for Avatamsaka Sutra character files

param(
    [string]$Path = ".",
    [switch]$WhatIf = $false,
    [switch]$Backup = $true,
    [switch]$Verbose = $false
)

function Convert-DiacriticalMarks {
    param([string]$text)
    
    # First, normalize Unicode to ensure consistent character representation
    $normalizedText = $text.Normalize([System.Text.NormalizationForm]::FormD)
    
    # Define comprehensive replacements in order of application
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
        
        # Additional Sanskrit diacritics found in character files
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
        
        # Additional Unicode characters specific to your files
        @{ from = "Ṭ"; to = "T" }
        @{ from = "ṭ"; to = "t" }
        @{ from = "Ḍ"; to = "D" }
        @{ from = "ḍ"; to = "d" }
        @{ from = "Ṇ"; to = "N" }
        @{ from = "ṇ"; to = "n" }
        @{ from = "Ś"; to = "S" }
        @{ from = "ś"; to = "s" }
        @{ from = "Ṣ"; to = "S" }
        @{ from = "ṣ"; to = "s" }
        
        # Handle combining diacritical marks (Unicode combining characters)
        @{ from = [char]0x0300; to = "" }  # Combining grave accent
        @{ from = [char]0x0301; to = "" }  # Combining acute accent
        @{ from = [char]0x0302; to = "" }  # Combining circumflex accent
        @{ from = [char]0x0303; to = "" }  # Combining tilde
        @{ from = [char]0x0304; to = "" }  # Combining macron
        @{ from = [char]0x0305; to = "" }  # Combining overline
        @{ from = [char]0x0306; to = "" }  # Combining breve
        @{ from = [char]0x0307; to = "" }  # Combining dot above
        @{ from = [char]0x0308; to = "" }  # Combining diaeresis
        @{ from = [char]0x0309; to = "" }  # Combining hook above
        @{ from = [char]0x030A; to = "" }  # Combining ring above
        @{ from = [char]0x030B; to = "" }  # Combining double acute accent
        @{ from = [char]0x030C; to = "" }  # Combining caron
        @{ from = [char]0x030D; to = "" }  # Combining vertical line above
        @{ from = [char]0x030E; to = "" }  # Combining double vertical line above
        @{ from = [char]0x030F; to = "" }  # Combining double grave accent
        @{ from = [char]0x0310; to = "" }  # Combining candrabindu
        @{ from = [char]0x0311; to = "" }  # Combining inverted breve
        @{ from = [char]0x0312; to = "" }  # Combining turned comma above
        @{ from = [char]0x0313; to = "" }  # Combining comma above
        @{ from = [char]0x0314; to = "" }  # Combining reversed comma above
        @{ from = [char]0x0315; to = "" }  # Combining comma above right
        @{ from = [char]0x0316; to = "" }  # Combining grave accent below
        @{ from = [char]0x0317; to = "" }  # Combining acute accent below
        @{ from = [char]0x0318; to = "" }  # Combining left tack below
        @{ from = [char]0x0319; to = "" }  # Combining right tack below
        @{ from = [char]0x031A; to = "" }  # Combining left angle above
        @{ from = [char]0x031B; to = "" }  # Combining horn
        @{ from = [char]0x031C; to = "" }  # Combining left half ring below
        @{ from = [char]0x031D; to = "" }  # Combining up tack below
        @{ from = [char]0x031E; to = "" }  # Combining down tack below
        @{ from = [char]0x031F; to = "" }  # Combining plus sign below
        @{ from = [char]0x0320; to = "" }  # Combining minus sign below
        @{ from = [char]0x0321; to = "" }  # Combining palatalized hook below
        @{ from = [char]0x0322; to = "" }  # Combining retroflex hook below
        @{ from = [char]0x0323; to = "" }  # Combining dot below
        @{ from = [char]0x0324; to = "" }  # Combining diaeresis below
        @{ from = [char]0x0325; to = "" }  # Combining ring below
        @{ from = [char]0x0326; to = "" }  # Combining comma below
        @{ from = [char]0x0327; to = "" }  # Combining cedilla
        @{ from = [char]0x0328; to = "" }  # Combining ogonek
        @{ from = [char]0x0329; to = "" }  # Combining vertical line below
        @{ from = [char]0x032A; to = "" }  # Combining bridge below
        @{ from = [char]0x032B; to = "" }  # Combining inverted double arch below
        @{ from = [char]0x032C; to = "" }  # Combining caron below
        @{ from = [char]0x032D; to = "" }  # Combining circumflex accent below
        @{ from = [char]0x032E; to = "" }  # Combining breve below
        @{ from = [char]0x032F; to = "" }  # Combining inverted breve below
        @{ from = [char]0x0330; to = "" }  # Combining tilde below
        @{ from = [char]0x0331; to = "" }  # Combining macron below
        @{ from = [char]0x0332; to = "" }  # Combining low line
        @{ from = [char]0x0333; to = "" }  # Combining double low line
        @{ from = [char]0x0334; to = "" }  # Combining tilde overlay
        @{ from = [char]0x0335; to = "" }  # Combining short stroke overlay
        @{ from = [char]0x0336; to = "" }  # Combining long stroke overlay
        @{ from = [char]0x0337; to = "" }  # Combining short solidus overlay
        @{ from = [char]0x0338; to = "" }  # Combining long solidus overlay
        @{ from = [char]0x0339; to = "" }  # Combining right half ring below
        @{ from = [char]0x033A; to = "" }  # Combining inverted bridge below
        @{ from = [char]0x033B; to = "" }  # Combining square below
        @{ from = [char]0x033C; to = "" }  # Combining seagull below
        @{ from = [char]0x033D; to = "" }  # Combining x above
        @{ from = [char]0x033E; to = "" }  # Combining vertical tilde
        @{ from = [char]0x033F; to = "" }  # Combining double overline
    )
    
    $result = $normalizedText
    foreach ($replacement in $replacements) {
        # Convert to string to ensure we use String.Replace(string, string) overload
        $fromStr = $replacement.from.ToString()
        $toStr = $replacement.to.ToString()
        $result = $result.Replace($fromStr, $toStr)
    }
    
    # Final cleanup - remove any remaining non-ASCII characters that might be problematic for filenames
    $result = $result -replace '[^\x00-\x7F]', ''
    
    # Clean up multiple underscores or spaces that might result from replacements
    $result = $result -replace '_{2,}', '_'
    $result = $result -replace '\s{2,}', ' '
    
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
