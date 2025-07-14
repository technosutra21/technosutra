# Script para corrigir codificação UTF-8 dos nomes dos Kalyanamitras

$inputFile = "C:\Users\rouxy\TECHNOSUTRA1\technosutra\chapters\csvs\sudhana_pilgrimage_complete.csv"
$outputFile = "C:\Users\rouxy\TECHNOSUTRA1\technosutra\chapters\csvs\sudhana_pilgrimage_complete_fixed.csv"

Write-Host "Lendo arquivo original..."

# Ler o arquivo como bytes para evitar problemas de codificação
$bytes = [System.IO.File]::ReadAllBytes($inputFile)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

Write-Host "Aplicando correções..."

# Criar novo conteúdo com cabeçalho correto
$newContent = "Capitulo,Kalyanamitra,Busca,Encontro,Ensinamento,Despedida`n"

# Ler linha por linha e processar
$lines = $content -split "`n"
for ($i = 1; $i -lt $lines.Length; $i++) {
    $line = $lines[$i].Trim()
    if ($line -ne "") {
        # Extrair partes da linha
        $parts = $line -split ",", 6
        if ($parts.Length -ge 6) {
            $chapter = $parts[0]
            $kalyanamitra = $parts[1]
            $busca = $parts[2]
            $encontro = $parts[3]
            $ensinamento = $parts[4]
            $despedida = $parts[5]
            
            # Corrigir nome do Kalyanamitra
            $kalyanamitra = $kalyanamitra -replace '"', ''
            
            # Mapeamento manual dos nomes corretos
            $correctNames = @{
                "1" = "Cenário (Jetavana)"
                "2" = "Samantabhadra"
                "3" = "Mañjuśrī"
                "4" = "Meghaśrī"
                "5" = "Sāgara Megha"
                "6" = "Supratiṣṭhita"
                "7" = "Megha (Dravidiano)"
                "8" = "Muktaka"
                "9" = "Sāgara Dhvaja"
                "10" = "Āśā"
                "11" = "Bhīṣmottara Nirghoṣa"
                "12" = "Jayoṣmāyatana"
                "13" = "Maitrayaṇī"
                "14" = "Sudarśana"
                "15" = "Indriyeśvara"
                "16" = "Prabhūtā"
                "17" = "Vidvān"
                "18" = "Ratnacūḍa"
                "19" = "Samantanetra"
                "20" = "Anala"
                "21" = "Mahāprabhā"
                "22" = "Acala"
                "23" = "Sarvagamin"
                "24" = "Utpalabhūti"
                "25" = "Vaira"
                "26" = "Jayottama"
                "27" = "Siṃhavijṛmbhita"
                "28" = "Vasumitra"
                "29" = "Veṣṭhila"
                "30" = "Avalokiteśvara"
                "31" = "Ananyagamin"
                "32" = "Mahādeva"
                "33" = "Sthāvara"
                "34" = "Vasantī"
                "35" = "Samantagambhīraśrīvimalaprabhā"
                "36" = "Pramuditanayanajagatvirocana"
                "37" = "Samantasattvatrāṇojahśrī"
                "38" = "Prasantarutasāgaravatī"
                "39" = "Sarvanagararakṣasambhavatejaḥśrī"
                "40" = "Sarvavṛkṣapraphulanasukhasamvāsa"
                "41" = "Sarvajagadrakṣapranidhānavīryaprabhā"
                "42" = "Sūtejomandalaratiśrī"
                "43" = "Gopā"
                "44" = "Māyādevī"
                "45" = "Surendrabha"
                "46" = "Viśvāmitra"
                "47" = "Śilpābhijña"
                "48" = "Bhadrottama"
                "49" = "Muktasāra"
                "50" = "Sucandra"
                "51" = "Ajitasena"
                "52" = "Śivarāgra"
                "53" = "Śrīsambhava e Śrīmatī"
                "54" = "Maitreya"
                "55" = "Mañjuśrī (Retorno)"
                "56" = "Samantabhadra"
            }
            
            # Usar nome correto se existir
            if ($correctNames.ContainsKey($chapter)) {
                $kalyanamitra = $correctNames[$chapter]
            }
            
            # Reconstruir linha
            $newLine = "$chapter,`"$kalyanamitra`",$busca,$encontro,$ensinamento,$despedida"
            $newContent += $newLine + "`n"
        }
    }
}

# Salvar arquivo corrigido
[System.IO.File]::WriteAllText($outputFile, $newContent, [System.Text.Encoding]::UTF8)

Write-Host "Arquivo corrigido salvo em: $outputFile"

# Verificar resultado
Write-Host "`nPrimeiras 10 linhas do arquivo corrigido:"
Get-Content -Path $outputFile -Encoding UTF8 | Select-Object -First 10 | ForEach-Object { Write-Host $_ }

# Estatísticas
$totalLines = (Get-Content -Path $outputFile -Encoding UTF8).Count
Write-Host "`nTotal de linhas no arquivo corrigido: $totalLines"
