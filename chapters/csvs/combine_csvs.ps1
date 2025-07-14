# Script para combinar todos os CSVs da peregrinação de Sudhana em um arquivo único
# Combine CSVs Script for Sudhana's Pilgrimage

# Definir caminhos
$csvPath = "C:\Users\rouxy\TECHNOSUTRA1\technosutra\chapters\csvs"
$outputFile = "$csvPath\sudhana_pilgrimage_complete.csv"

# Criar cabeçalho do arquivo final
$header = "Capitulo,Kalyanamitra,Busca,Encontro,Ensinamento,Despedida"
$header | Out-File -FilePath $outputFile -Encoding UTF8

# Função para extrair nome do Kalyanamitra do CSV
function Get-KalyanamitrapName {
    param($chapterNumber, $content)
    
    # Mapear nomes baseado no número do capítulo
    $names = @{
        1 = "Cenário (Jetavana)"
        2 = "Samantabhadra"
        3 = "Mañjuśrī"
        4 = "Meghaśrī"
        5 = "Sāgara Megha"
        6 = "Supratiṣṭhita"
        7 = "Megha (Dravidiano)"
        8 = "Muktaka"
        9 = "Sāgara Dhvaja"
        10 = "Āśā"
        11 = "Bhīṣmottara Nirghoṣa"
        12 = "Jayoṣmāyatana"
        13 = "Maitrayaṇī"
        14 = "Sudarśana"
        15 = "Indriyeśvara"
        16 = "Prabhūtā"
        17 = "Vidvān"
        18 = "Ratnacūḍa"
        19 = "Samantanetra"
        20 = "Anala"
        21 = "Mahāprabhā"
        22 = "Acala"
        23 = "Sarvagamin"
        24 = "Utpalabhūti"
        25 = "Vaira"
        26 = "Jayottama"
        27 = "Siṃhavijṛmbhita"
        28 = "Vasumitra"
        29 = "Veṣṭhila"
        30 = "Avalokiteśvara"
        31 = "Ananyagamin"
        32 = "Mahādeva"
        33 = "Sthāvara"
        34 = "Vasantī"
        35 = "Samantagambhīraśrīvimalaprabhā"
        36 = "Pramuditanayanajagatvirocana"
        37 = "Samantasattvatrāṇojahśrī"
        38 = "Prasantarutasāgaravatī"
        39 = "Sarvanagararakṣasambhavatejaḥśrī"
        40 = "Sarvavṛkṣapraphulanasukhasamvāsa"
        41 = "Sarvajagadrakṣapranidhānavīryaprabhā"
        42 = "Sūtejomandalaratiśrī"
        43 = "Gopā"
        44 = "Māyādevī"
        45 = "Surendrabha"
        46 = "Viśvāmitra"
        47 = "Śilpābhijña"
        48 = "Bhadrottama"
        49 = "Muktasāra"
        50 = "Sucandra"
        51 = "Ajitasena"
        52 = "Śivarāgra"
        53 = "Śrīsambhava e Śrīmatī"
        54 = "Maitreya"
        55 = "Mañjuśrī (Retorno)"
        56 = "Samantabhadra"
    }
    
    return $names[$chapterNumber]
}

# Processar cada arquivo CSV numericamente
for ($i = 1; $i -le 56; $i++) {
    $fileName = "{0:D2}.csv" -f $i
    $filePath = Join-Path $csvPath $fileName
    
    if (Test-Path $filePath) {
        Write-Host "Processando capítulo $i - $fileName"
        
        # Ler o conteúdo do CSV
        $content = Get-Content -Path $filePath -Encoding UTF8
        
        # Pular o cabeçalho (primeira linha)
        if ($content.Length -gt 1) {
            $dataLine = $content[1]
            
            # Extrair nome do Kalyanamitra
            $kalyanamitra = Get-KalyanamitrapName -chapterNumber $i
            
            # Criar linha com número do capítulo e nome do Kalyanamitra
            $newLine = "$i,`"$kalyanamitra`",$dataLine"
            
            # Adicionar ao arquivo final
            $newLine | Out-File -FilePath $outputFile -Append -Encoding UTF8
        }
    } else {
        Write-Warning "Arquivo não encontrado: $fileName"
    }
}

Write-Host "`nCombinação concluída!"
Write-Host "Arquivo de saída: $outputFile"

# Mostrar estatísticas
$totalLines = (Get-Content $outputFile).Count - 1  # Subtrair o cabeçalho
Write-Host "Total de capítulos processados: $totalLines"

# Mostrar as primeiras linhas do arquivo final
Write-Host "`nPrimeiras linhas do arquivo combinado:"
Get-Content $outputFile | Select-Object -First 10 | ForEach-Object { Write-Host $_ }
