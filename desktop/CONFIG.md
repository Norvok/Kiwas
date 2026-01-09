# Konfiguracja dla buildu aplikacji desktopowej

## Przed buildem możesz skonfigurować:

### 1. Domyślny adres serwera API
W pliku: `src/main.tsx` linia ~13
```typescript
serverUrl: 'http://localhost:4000',  // <- zmień to
```

Przykłady:
- Lokalny serwer w sieci: `http://192.168.1.100:4000`
- Publiczny serwer: `https://api.twojadomena.pl`
- Serwer z portem: `http://serwer.firma.pl:4000`

### 2. Nazwa aplikacji
W pliku: `src-tauri/tauri.conf.json`
```json
"productName": "Notes Desktop",  // <- zmień nazwę
"identifier": "pl.vamare.notes",  // <- zmień identyfikator (odwrócona domena)
```

### 3. Auto-update URL (opcjonalnie)
W pliku: `src-tauri/tauri.conf.json`
```json
"updater": {
  "active": true,  // false = wyłącz auto-update
  "endpoints": ["https://twoj-serwer.pl/updates/latest.json"],
  "dialog": true
}
```

### 4. Ikona aplikacji (opcjonalnie)
Zamień pliki w folderze: `src-tauri/icons/`
- Potrzebujesz pliku `.ico` (Windows)
- Możesz wygenerować na: https://icon.kitchen/

### 5. Copyright i opis
W pliku: `src-tauri/tauri.conf.json` sekcja "bundle"
```json
"copyright": "Copyright © 2026 Twoja Firma",
"shortDescription": "Twój opis",
```

## Po zmianach uruchom:
```cmd
npm run tauri:build
```
