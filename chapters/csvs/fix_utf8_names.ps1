# Script para corrigir problemas de codificação UTF-8 nos nomes dos Kalyanamitras
# Fix UTF-8 encoding issues in Kalyanamitra names

$inputFile = "C:\Users\rouxy\TECHNOSUTRA1\technosutra\chapters\csvs\sudhana_pilgrimage_complete.csv"
$outputFile = "C:\Users\rouxy\TECHNOSUTRA1\technosutra\chapters\csvs\sudhana_pilgrimage_complete_fixed.csv"

# Mapeamento de correções UTF-8
$nameCorrections = @{
    "CenÃ¡rio (Jetavana)" = "Cenário (Jetavana)"
    "MaÃ±juÅ›rÄ«" = "Mañjuśrī"
    "MeghaÅ›rÄ«" = "Meghaśrī"
    "SÄgara Megha" = "Sāgara Megha"
    "Supratiá¹£á¹­hita" = "Supratiṣṭhita"
    "SÄgara Dhvaja" = "Sāgara Dhvaja"
    "Ä€Å›Ä" = "Āśā"
    "BhÄ«á¹£mottara Nirghoá¹£a" = "Bhīṣmottara Nirghoṣa"
    "Jayoá¹£mÄyatana" = "Jayoṣmāyatana"
    "Maitrayaá¹‡Ä«" = "Maitrayaṇī"
    "SudarÅ›ana" = "Sudarśana"
    "IndriyeÅ›vara" = "Indriyeśvara"
    "PrabhÅ«tÄ" = "Prabhūtā"
    "VidvÄn" = "Vidvān"
    "RatnacÅ«á¸a" = "Ratnacūḍa"
    "MahÄprabhÄ" = "Mahāprabhā"
    "Utpalabhå«ti" = "Utpalabhūti"
    "Siá¹hávijá¹mbhita" = "Siṃhavijṛmbhita"
    "Veá¹£á¹­hila" = "Veṣṭhila"
    "AvalokiteÅ›vara" = "Avalokiteśvara"
    "MahÄdeva" = "Mahādeva"
    "SthÄvara" = "Sthāvara"
    "VasantÄ«" = "Vasantī"
    "SamantagambhÄ«raÅ›rÄ«vimalaprabhÄ" = "Samantagambhīraśrīvimalaprabhā"
    "Pramuditanayanajagadvivocana" = "Pramuditanayanajagatvirocana"
    "SamantasattvatrÄá¹ojahÅ›rÄ«" = "Samantasattvatrāṇojahśrī"
    "PrasantarutasÄgaravatÄ«" = "Prasantarutasāgaravatī"
    "Sarvanagararaká¹£asambhavatejaá¸¥Å›rÄ«" = "Sarvanagararakṣasambhavatejaḥśrī"
    "Sarvavá¹ká¹£apraphulanasukhasamvÄsa" = "Sarvavṛkṣapraphulanasukhasamvāsa"
    "Sarvajagadraká¹£apranidhÄnavÄ«ryaprabhÄ" = "Sarvajagadrakṣapranidhānavīryaprabhā"
    "SÅ«tejomandalaratiÅ›rÄ«" = "Sūtejomandalaratiśrī"
    "GopÄ" = "Gopā"
    "MÄyÄdevÄ«" = "Māyādevī"
    "ViÅ›vÄmitra" = "Viśvāmitra"
    "Å ilpÄbhijÃ±a" = "Śilpābhijña"
    "MuktasÄra" = "Muktasāra"
    "Å ivarÄgra" = "Śivarāgra"
    "Å rÄ«sambhava e Å rÄ«matÄ«" = "Śrīsambhava e Śrīmatī"
    "MaÃ±juÅ›rÄ« (Retorno)" = "Mañjuśrī (Retorno)"
}

Write-Host "Corrigindo codificação UTF-8 dos nomes dos Kalyanamitras..."

# Ler o arquivo original
$content = Get-Content -Path $inputFile -Raw -Encoding UTF8

# Aplicar correções
foreach ($incorrect in $nameCorrections.Keys) {
    $correct = $nameCorrections[$incorrect]
    $content = $content -replace [regex]::Escape($incorrect), $correct
    Write-Host "Corrigido: $incorrect → $correct"
}

# Salvar o arquivo corrigido
$content | Out-File -FilePath $outputFile -Encoding UTF8 -NoNewline

Write-Host "`nArquivo corrigido salvo em: $outputFile"

# Verificar o resultado
Write-Host "`nPrimeiras 5 linhas do arquivo corrigido:"
Get-Content -Path $outputFile -Encoding UTF8 | Select-Object -First 5 | ForEach-Object { Write-Host $_ }

# Mostrar estatísticas
$totalLines = (Get-Content -Path $outputFile -Encoding UTF8).Count
Write-Host "`nTotal de linhas no arquivo corrigido: $totalLines"
