# Automatyczne buildy desktop app

## Konfiguracja GitHub Actions

1. **W repozytorium GitHub idź do Settings → Secrets and variables → Actions**

2. **Dodaj secrets:**
   - `SSH_PRIVATE_KEY` - klucz prywatny SSH do serwera (bez hasła)
   - `SERVER_HOST` - `5.2.23.30`
   - `SERVER_USER` - `hollyadmin` (lub user z prawami zapisu do /opt/notesapp)

3. **Wygeneruj klucz SSH bez hasła:**
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
   cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
   cat ~/.ssh/github_deploy  # skopiuj zawartość do GitHub secret SSH_PRIVATE_KEY
   ```

## Jak to działa

- **Push do main/master** w katalogu `desktop/` → automatyczny build
- **Workflow** buduje na Windows runner → pakuje MSI do ZIP → uploaduje na serwer do `/opt/notesapp/updates/releases/`
- **Klienci** przy starcie aplikacji automatycznie pobiorą aktualizację

## Ręczne uruchomienie

W GitHub: Actions → Build Desktop App → Run workflow

## Testowanie lokalnie

Możesz ręcznie zbudować i wrzucić:
```bash
# Na Windows
cd desktop
npm run tauri:build
# Spakuj MSI do ZIP i wrzuć przez scp/ftp
```
