# Скрипт для подготовки данных переводов для импорта
$translations = Get-Content translations_full.json | ConvertFrom-Json

Write-Host "Processing $($translations.Count) translations..."

$translations | ForEach-Object {
    $translation = $_
    $videoTitle = if ($translation.video) { $translation.video.title } else { "" }
    $channelName = if ($translation.channel) { $translation.channel.name } else { "" }
    $translatedUrl = if ($translation.translatedUrl) { $translation.translatedUrl } else { "" }
    $voiceOverName = if ($translation.voiceOverName) { $translation.voiceOverName } else { "" }
    $scheduledDate = if ($translation.scheduledDate) { $translation.scheduledDate } else { $null }
    $publishedDate = if ($translation.publishedDate) { $translation.publishedDate } else { $null }
    
    $obj = [PSCustomObject]@{
        id = $translation.id
        videoTitle = $videoTitle
        language = $translation.language
        status = $translation.status
        translatedUrl = $translatedUrl
        channelName = $channelName
        voiceOverName = $voiceOverName
        scheduledDate = $scheduledDate
        publishedDate = $publishedDate
        createdAt = $translation.createdAt
    }
    
    $obj
} | ConvertTo-Json -Depth 3 | Out-File -FilePath "translations_to_import.json" -Encoding utf8

Write-Host "Data prepared in translations_to_import.json"

