# Скрипт для подготовки данных видео для импорта
$videos = Get-Content videos_full.json | ConvertFrom-Json

Write-Host "Processing $($videos.Count) videos..."

$videos[4..22] | ForEach-Object {
    $video = $_
    $subcatName = if ($video.subcategory) { $video.subcategory.name } else { "" }
    $catName = if ($video.subcategory -and $video.subcategory.category) { $video.subcategory.category.name } else { "" }
    $duration = if ($video.duration) { $video.duration } else { 0 }
    $archivedAt = if ($video.archivedAt) { $video.archivedAt } else { $null }
    $archivedReason = if ($video.archivedReason) { $video.archivedReason } else { "" }
    $thumbnailUrl = if ($video.thumbnailUrl) { $video.thumbnailUrl } else { "" }
    
    $obj = [PSCustomObject]@{
        id = $video.id
        title = $video.title
        url = $video.url
        thumbnailUrl = $thumbnailUrl
        duration = $duration
        subcategoryName = $subcatName
        categoryName = $catName
        isArchived = $video.isArchived
        archivedAt = $archivedAt
        archivedReason = $archivedReason
        createdAt = $video.createdAt
        translationsCount = $video.translations.Count
    }
    
    $obj
} | ConvertTo-Json -Depth 3 | Out-File -FilePath "videos_to_import.json" -Encoding utf8

Write-Host "Data prepared in videos_to_import.json"

