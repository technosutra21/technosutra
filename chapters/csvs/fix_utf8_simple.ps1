# Script simplificado para corrigir codificação UTF-8 dos nomes dos Kalyanamitras

$inputFile = "C:\Users\rouxy\TECHNOSUTRA1\technosutra\chapters\csvs\sudhana_pilgrimage_complete.csv"
$outputFile = "C:\Users\rouxy\TECHNOSUTRA1\technosutra\chapters\csvs\sudhana_pilgrimage_complete_fixed.csv"

Write-Host "Corrigindo codificação UTF-8 dos nomes dos Kalyanamitras..."

# Ler o arquivo original
$content = Get-Content -Path $inputFile -Raw -Encoding UTF8

# Aplicar correções específicas
$content = $content -replace "CenÃ¡rio \(Jetavana\)", "Cenário (Jetavana)"
$content = $content -replace "MaÃ±juÅ›rÄ«", "Mañjuśrī"
$content = $content -replace "MeghaÅ›rÄ«", "Meghaśrī"
$content = $content -replace "SÄgara Megha", "Sāgara Megha"
$content = $content -replace "Supratiá¹£á¹­hita", "Supratiṣṭhita"
$content = $content -replace "SÄgara Dhvaja", "Sāgara Dhvaja"
$content = $content -replace "Ä€Å›Ä", "Āśā"
$content = $content -replace "BhÄ«á¹£mottara Nirghoá¹£a", "Bhīṣmottara Nirghoṣa"
$content = $content -replace "Jayoá¹£mÄyatana", "Jayoṣmāyatana"
$content = $content -replace "Maitrayaá¹‡Ä«", "Maitrayaṇī"
$content = $content -replace "SudarÅ›ana", "Sudarśana"
$content = $content -replace "IndriyeÅ›vara", "Indriyeśvara"
$content = $content -replace "PrabhÅ«tÄ", "Prabhūtā"
$content = $content -replace "VidvÄn", "Vidvān"
$content = $content -replace "RatnacÅ«á¸a", "Ratnacūḍa"
$content = $content -replace "MahÄprabhÄ", "Mahāprabhā"
$content = $content -replace "Utpalabhå«ti", "Utpalabhūti"
$content = $content -replace "Siá¹hávijá¹mbhita", "Siṃhavijṛmbhita"
$content = $content -replace "Veá¹£á¹­hila", "Veṣṭhila"
$content = $content -replace "AvalokiteÅ›vara", "Avalokiteśvara"
$content = $content -replace "MahÄdeva", "Mahādeva"
$content = $content -replace "SthÄvara", "Sthāvara"
$content = $content -replace "VasantÄ«", "Vasantī"
$content = $content -replace "SamantagambhÄ«raÅ›rÄ«vimalaprabhÄ", "Samantagambhīraśrīvimalaprabhā"
$content = $content -replace "Pramuditanayanajagadvivocana", "Pramuditanayanajagatvirocana"
$content = $content -replace "SamantasattvatrÄá¹ojahÅ›rÄ«", "Samantasattvatrāṇojahśrī"
$content = $content -replace "PrasantarutasÄgaravatÄ«", "Prasantarutasāgaravatī"
$content = $content -replace "Sarvanagararaká¹£asambhavatejaá¸¥Å›rÄ«", "Sarvanagararakṣasambhavatejaḥśrī"
$content = $content -replace "Sarvavá¹ká¹£apraphulanasukhasamvÄsa", "Sarvavṛkṣapraphulanasukhasamvāsa"
$content = $content -replace "Sarvajagadraká¹£apranidhÄnavÄ«ryaprabhÄ", "Sarvajagadrakṣapranidhānavīryaprabhā"
$content = $content -replace "SÅ«tejomandalaratiÅ›rÄ«", "Sūtejomandalaratiśrī"
$content = $content -replace "GopÄ", "Gopā"
$content = $content -replace "MÄyÄdevÄ«", "Māyādevī"
$content = $content -replace "ViÅ›vÄmitra", "Viśvāmitra"
$content = $content -replace "Å ilpÄbhijÃ±a", "Śilpābhijña"
$content = $content -replace "MuktasÄra", "Muktasāra"
$content = $content -replace "Å ivarÄgra", "Śivarāgra"
$content = $content -replace "Å rÄ«sambhava e Å rÄ«matÄ«", "Śrīsambhava e Śrīmatī"
$content = $content -replace "MaÃ±juÅ›rÄ« \(Retorno\)", "Mañjuśrī (Retorno)"

# Salvar o arquivo corrigido
$content | Out-File -FilePath $outputFile -Encoding UTF8 -NoNewline

Write-Host "Arquivo corrigido salvo em: $outputFile"

# Verificar o resultado
Write-Host "`nPrimeiras 10 linhas do arquivo corrigido:"
Get-Content -Path $outputFile -Encoding UTF8 | Select-Object -First 10 | ForEach-Object { Write-Host $_ }

# Mostrar estatísticas
$totalLines = (Get-Content -Path $outputFile -Encoding UTF8).Count
Write-Host "`nTotal de linhas no arquivo corrigido: $totalLines"
