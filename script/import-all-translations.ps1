# Скрипт для автоматического импорта всех переводов через API
# Получает данные и создает команды для импорта

$translations = Get-Content translations_full.json | ConvertFrom-Json
$imported = @('96ab4687-4f31-463c-8d8e-4eb96917a2d8', '8b604446-12b0-4764-94f4-1e65f9fd6475', '13a29e30-d2f9-42f1-8c65-e8d913828f19', '84b6cd00-3a98-4b78-b49c-9a6176c4bf87', '71c55c7e-843d-4b4d-82b7-702f5bd9a3fc', '22e89920-5cf0-4da6-a9b8-83630bac9588', '81cbfa1f-3b8c-40fd-bd6c-f2daec321aaa', '6a7039cd-7600-432d-88f3-133d64e46829', '326d7133-c580-4610-bfe4-18294e96839d', 'ac6c5f8f-0e17-4c64-ba68-c239b7d47b63', '16533eb6-bb0b-4040-8052-9975a3c88d64', 'a13ddc29-8984-4190-a4f6-81fd8cac591b', '7e47d9dc-0f14-44e4-a4d4-77836cb7bc42', '5c24b2bb-2ec0-4a43-b67f-32752d980f57', '9cf12c50-9f29-43da-b92b-4c31a48b8dc1', 'db35e054-0e36-4d81-ba63-472eaebdb662', 'fd45561e-2a4b-4c73-8cda-80d34f73e7fe', 'f6c20c86-3782-4cbf-a7f8-da956c135553', '905f1e29-4c0c-47cc-8496-80a2259993e2')

$remaining = $translations | Where-Object { $imported -notcontains $_.id }

Write-Host "Remaining translations: $($remaining.Count)"
Write-Host "Preparing data for import..."

$remaining | ForEach-Object {
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
} | ConvertTo-Json -Depth 3 | Out-File -FilePath "translations_remaining.json" -Encoding utf8

Write-Host "Data prepared in translations_remaining.json"
Write-Host "Total remaining: $($remaining.Count)"

