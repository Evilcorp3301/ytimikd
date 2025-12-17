# Настройка cloudflared в PATH (Windows)

После установки `cloudflared` через `winget`, он может быть не добавлен автоматически в PATH. Вот как это исправить:

## Шаг 1: Найдите путь к cloudflared.exe

Выполните в PowerShell:

```powershell
Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "cloudflared.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
```

Или проверьте вручную:
```
%LOCALAPPDATA%\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_*\cloudflared.exe
```

## Шаг 2: Добавьте путь в PATH

### Вариант 1: Через графический интерфейс (рекомендуется)

1. Нажмите `Win + R`, введите `sysdm.cpl` и нажмите Enter
2. Перейдите на вкладку **"Дополнительно"**
3. Нажмите **"Переменные среды"**
4. В разделе **"Системные переменные"** найдите переменную `Path` и нажмите **"Изменить"**
5. Нажмите **"Создать"** и добавьте путь к папке, содержащей `cloudflared.exe` (например: `C:\Users\YourName\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe`)
6. Нажмите **"ОК"** во всех окнах
7. **Перезапустите терминал** (закройте и откройте заново)

### Вариант 2: Через PowerShell (для текущего пользователя)

```powershell
# Найдите путь к cloudflared
$cloudflaredPath = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "cloudflared.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty DirectoryName

# Добавьте в PATH текущего пользователя
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$cloudflaredPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$cloudflaredPath", "User")
    Write-Host "✅ Путь добавлен: $cloudflaredPath"
    Write-Host "⚠️  Перезапустите терминал для применения изменений"
} else {
    Write-Host "✅ Путь уже добавлен в PATH"
}
```

### Вариант 3: Через PowerShell (для всей системы - требует прав администратора)

```powershell
# Запустите PowerShell от имени администратора
# Найдите путь к cloudflared
$cloudflaredPath = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "cloudflared.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty DirectoryName

# Добавьте в системный PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$cloudflaredPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$cloudflaredPath", "Machine")
    Write-Host "✅ Путь добавлен: $cloudflaredPath"
    Write-Host "⚠️  Перезапустите терминал для применения изменений"
} else {
    Write-Host "✅ Путь уже добавлен в PATH"
}
```

## Шаг 3: Проверьте установку

После перезапуска терминала выполните:

```powershell
cloudflared --version
```

Если команда работает, значит всё настроено правильно!

## Альтернатива: Использование без добавления в PATH

Если не хотите добавлять в PATH, скрипт `tunnel.ts` автоматически найдёт `cloudflared` в стандартных местах установки WinGet. Просто убедитесь, что он установлен:

```powershell
winget list Cloudflare.cloudflared
```

Если установлен, скрипт должен найти его автоматически.

