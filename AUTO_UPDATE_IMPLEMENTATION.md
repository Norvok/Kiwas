# Auto-Update Implementation - Podsumowanie

## Co się zmieniło

### 1. Backend (FastAPI)

**Plik: `app/main.py`**
- ✅ Dodano endpoint `GET /updates/{target}/{arch}/{current_version}` - sprawdza dostępną wersję
- ✅ Dodano endpoint `GET /updates/download/{filename}` - pobiera plik aktualizacji (ZIP)
- ✅ Aktualnie skonfigurowany na wersję `0.2.0` (zmień gdy będziesz mieć nową)

**Jak działa:**
```
Klient (0.1.0) → GET /updates/windows/x86_64/0.1.0
Server → "Mam wersję 0.2.0, pobierz z /updates/download/..."
Klient → Pobiera ZIP, instaluje, restartuje
```

### 2. Frontend (React + Tauri)

**Plik: `desktop/src/main.tsx`**
- ✅ Import: `import { checkUpdate, installUpdate } from '@tauri-apps/plugin-updater'`
- ✅ useEffect przy starcie aplikacji sprawdza aktualizacje
- ✅ Jeśli dostępna - pobiera, instaluje, restartuje

### 3. Konfiguracja Tauri

**Plik: `desktop/src-tauri/tauri.conf.json`**
- ✅ Dodano sekcję `"updater"` z endpointem serwera
- ✅ `"dialog": true` - pokazuje użytkownikowi informację o aktualizacji

**Plik: `desktop/src-tauri/Cargo.toml`**
- ✅ Dodano `tauri-plugin-updater = "2.0.0"` do dependencies
- ✅ Włączono `features = ["updater"]` w tauri

**Plik: `desktop/src-tauri/src/main.rs`**
- ✅ Zarejestrowany plugin updater: `.plugin(tauri_plugin_updater::Builder::new().build())`

### 4. npm Dependencies

**Plik: `desktop/package.json`**
- ✅ Dodano `"@tauri-apps/plugin-updater": "2.0.0"`

### 5. Dokumentacja

- ✅ `updates/AUTO_UPDATE_GUIDE.md` - Pełny przewodnik wdrażania aktualizacji
- ✅ `updates/README.md` - Szybka instrukcja

## Jak wydać nową wersję

### 1. Na Windows (builder)
```bash
cd desktop
# Zmień version w src-tauri/tauri.conf.json na 0.2.0
npm run tauri:build
```

### 2. Spakuj wyjście
```bash
cd src-tauri/target/release/bundle/msi/
zip notes-desktop_0.2.0_x86_64-pc-windows-msvc.msi.zip \
    notes-desktop_0.2.0_x86_64-pc-windows-msvc.msi
```

### 3. Prześlij na serwer Linux
```bash
scp notes-desktop_0.2.0_*.zip user@api.vamare.pl:/opt/notesapp/updates/releases/
```

### 4. Zaktualizuj backend
W `app/main.py` funkcja `check_update()`:
```python
latest_version = "0.2.0"  # Zmień tutaj
```

Gotowe! Wszyscy zainstalowani klienci będą pytani o aktualizację.

## Struktura katalogów

```
/opt/notesapp/
├── updates/
│   ├── releases/                              # Tutaj trafiają ZIP'y
│   │   ├── notes-desktop_0.1.0_x86_64...zip
│   │   └── notes-desktop_0.2.0_x86_64...zip
│   ├── AUTO_UPDATE_GUIDE.md                   # Pełny przewodnik
│   └── README.md
└── app/
    └── main.py                                # Endpoint /updates/
```

## Następne kroki

1. **Rebuild aplikacji** na Windows z nowymi zmianami:
   ```bash
   npm install  # pobierze nowy plugin-updater
   npm run tauri:build
   ```

2. **Testowanie:**
   - Uruchom nową wersję (0.1.0)
   - Zmień `latest_version` w `app/main.py` na `0.2.0`
   - Skopiuj plik ZIP do `/opt/notesapp/updates/releases/`
   - Spróbuj zalogować się - powinna pojawić się oferta aktualizacji

3. **Production:**
   - Gdy będziesz mieć stabilną 0.2.0, przygotuj buildzie
   - Wrzuć ZIP do releases/
   - Zmień version w backend
   - Wszyscy klienci będą automatycznie pytani o update

## Bezpieczeństwo

Aktualnie `pubkey` w `tauri.conf.json` to "unsupported" - wystarczy do testów.
Dla produkcji powinieneś:
1. Wygenerować para kluczy (publiczny/prywatny)
2. Podpisywać każdy release prywatnym kluczem
3. Umieścić publiczny klucz w tauri.conf.json

(Instrukcje w `AUTO_UPDATE_GUIDE.md`)

---

**Podsumowanie:** Aplikacja teraz automatycznie sprawdza aktualizacje na starcie i oferuje je użytkownikowi. Ty się zajmujesz wydaniem nowej wersji, reszta się dzieje automatycznie! 🎉
