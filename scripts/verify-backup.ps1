param([Parameter(Mandatory=$true)][string]$BackupFile)
$ErrorActionPreference='Stop'
if (-not $env:BACKUP_PASSPHRASE) { throw 'Defina BACKUP_PASSPHRASE.' }
$resolved=(Resolve-Path -LiteralPath $BackupFile).Path
$temporary=Join-Path ([IO.Path]::GetTempPath()) "nutri-verify-$([guid]::NewGuid())"
New-Item -ItemType Directory -Path $temporary | Out-Null
try { $archive=Join-Path $temporary 'database.zip'; & node (Join-Path $PSScriptRoot 'backup-crypto.mjs') decrypt $resolved $archive; if($LASTEXITCODE -ne 0){throw 'Senha incorreta ou backup corrompido.'}; Expand-Archive -LiteralPath $archive -DestinationPath (Join-Path $temporary 'content');$required='roles.sql','schema.sql','data.sql';foreach($name in $required){$file=Join-Path $temporary "content\$name";if(-not(Test-Path -LiteralPath $file)-or(Get-Item -LiteralPath $file).Length-eq 0){throw "Arquivo ausente ou vazio: $name"}};Write-Host 'Backup íntegro, descriptografável e com os três componentes obrigatórios.' } finally { if(Test-Path -LiteralPath $temporary){Remove-Item -LiteralPath $temporary -Recurse -Force} }
