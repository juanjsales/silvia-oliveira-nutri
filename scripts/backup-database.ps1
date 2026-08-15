param([string]$OutputDirectory = "$(Join-Path $PSScriptRoot '..\backups')")
$ErrorActionPreference = 'Stop'
if (-not $env:MIGRATION_DATABASE_URL) { throw 'Defina MIGRATION_DATABASE_URL com o Session Pooler.' }
if (-not $env:BACKUP_PASSPHRASE -or $env:BACKUP_PASSPHRASE.Length -lt 16) { throw 'Defina BACKUP_PASSPHRASE com pelo menos 16 caracteres.' }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$temporary = Join-Path ([IO.Path]::GetTempPath()) "nutri-backup-$([guid]::NewGuid())"
$archive = Join-Path $temporary 'database.zip'
$destination = Join-Path ([IO.Path]::GetFullPath($OutputDirectory)) "nutricionista-database-$stamp.backup.enc"
New-Item -ItemType Directory -Path $temporary | Out-Null
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
try {
  & npx --yes supabase db dump --db-url $env:MIGRATION_DATABASE_URL -f (Join-Path $temporary 'roles.sql') --role-only
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao exportar papéis do banco.' }
  & npx --yes supabase db dump --db-url $env:MIGRATION_DATABASE_URL -f (Join-Path $temporary 'schema.sql')
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao exportar estrutura do banco.' }
  & npx --yes supabase db dump --db-url $env:MIGRATION_DATABASE_URL -f (Join-Path $temporary 'data.sql') --use-copy --data-only -x 'storage.buckets_vectors' -x 'storage.vector_indexes'
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao exportar dados.' }
  Get-ChildItem $temporary -Filter '*.sql' | ForEach-Object { if ($_.Length -eq 0) { throw "Backup vazio: $($_.Name)" } }
  Compress-Archive -Path (Join-Path $temporary '*.sql') -DestinationPath $archive -CompressionLevel Optimal
  & node (Join-Path $PSScriptRoot 'backup-crypto.mjs') encrypt $archive $destination
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao criptografar o backup.' }
  Write-Host "Backup criptografado criado em: $destination"
  Write-Warning 'Os arquivos do Supabase Storage precisam de cópia separada. Consulte BACKUP-RECOVERY.md.'
} finally { if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Recurse -Force } }
