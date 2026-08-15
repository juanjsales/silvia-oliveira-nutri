# Backup e recuperação

O plano gratuito do Supabase não oferece backups baixáveis pelo painel. A rotina local usa o método oficial `supabase db dump`, produz três componentes e cifra o pacote com AES-256-GCM antes de gravá-lo.

## Criar e validar

No PowerShell, dentro da raiz do projeto:

```powershell
$env:BACKUP_PASSPHRASE = "uma-senha-longa-e-exclusiva"
./scripts/backup-database.ps1
./scripts/verify-backup.ps1 -BackupFile ./backups/ARQUIVO.backup.enc
```

A URL vem de `MIGRATION_DATABASE_URL`. O processo requer Docker Desktop, pois a CLI do Supabase executa o `pg_dump` oficial em contêiner. Nunca versione o backup nem a senha; `backups/` está ignorado pelo Git.

Mantenha ao menos duas cópias criptografadas em locais diferentes. Guarde a senha em um gerenciador de senhas separado: sem ela, a recuperação é impossível.

## Storage de exames

O backup PostgreSQL contém somente os metadados do Storage, não os PDFs e imagens. Faça também uma cópia privada do bucket `patient-exams` pelo painel/CLI do Supabase e mantenha-a junto do backup criptografado. Nunca coloque exames no repositório.

## Restauração

1. Não restaure sobre produção durante atendimento.
2. Crie primeiro um projeto Supabase de recuperação.
3. Valide o arquivo com `verify-backup.ps1`.
4. Descriptografe para uma pasta temporária usando `backup-crypto.mjs decrypt`.
5. Restaure `roles.sql`, `schema.sql` e `data.sql` seguindo a documentação oficial do Supabase.
6. Restaure separadamente os objetos do bucket de exames.
7. Configure novamente secrets, SMTP, Daily e URLs; eles não pertencem ao dump.
8. Execute migrações, `/health` e o smoke test antes de trocar a produção.

Uma restauração é uma operação destrutiva e deve ser feita somente após confirmação explícita do destino.
