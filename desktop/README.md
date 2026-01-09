# Notes Desktop (.exe) – Aplikacja kliencka Windows

Profesjonalna aplikacja desktopowa (Tauri + React) do zarządzania notatkami i kalendarzem z synchronizacją w czasie rzeczywistym.

## 📦 Szybki start - Budowanie instalatora .exe

### Dla Windows (zalecane):
1. Skopiuj folder `desktop` na komputer z Windows
2. Zainstaluj wymagania (patrz poniżej)
3. Uruchom `build-windows.bat`
4. Gotowe! Instalatory w `src-tauri\target\release\bundle\`

### Dla Linux (przygotowanie):
```bash
./prepare-build.sh
# Następnie skopiuj folder na Windows i zbuduj tam
```

## 📚 Dokumentacja

- **[BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)** - Szczegółowa instrukcja instalacji i budowania
- **[CONFIG.md](CONFIG.md)** - Konfiguracja przed buildem (adres serwera, nazwa itp.)
- **[DISTRIBUTION.md](DISTRIBUTION.md)** - Jak wysłać aplikację klientom
- **[INSTRUKCJA_DLA_UZYTKOWNIKA.md](INSTRUKCJA_DLA_UZYTKOWNIKA.md)** - Instrukcja dla użytkowników końcowych

## 🔧 Wymagania do builda na Windows

### Jednorazowa instalacja:
1. **Node.js** >= 18 - https://nodejs.org/
2. **Rust** - https://rustup.rs/
3. **Visual Studio Build Tools** - https://visualstudio.microsoft.com/visual-cpp-build-tools/
4. **WebView2** (zwykle wbudowane w Windows 10/11)

Szczegóły: zobacz [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)

## 🏗️ Struktura projektu

```
desktop/
├── src/                    # React UI (TypeScript + Zustand)
│   ├── main.tsx           # Główny komponent aplikacji
│   └── style.css          # Style
├── src-tauri/             # Część native (Rust + Tauri)
│   ├── src/main.rs        # Entry point Rust
│   ├── tauri.conf.json    # Konfiguracja bundla
│   └── icons/             # Ikony aplikacji
├── public/                # Statyczne pliki
├── package.json           # Zależności npm
├── build-windows.bat      # 🔥 Skrypt do automatycznego buildu
└── prepare-build.sh       # Skrypt pomocniczy (Linux)
```

## 🚀 Komendy

### Tryb deweloperski (szybkie testowanie):
```cmd
npm install
npm run tauri:dev
```

### Build produkcyjny (instalator .exe):
```cmd
npm install
npm run tauri:build
```
**LUB** użyj `build-windows.bat` - wszystko automatycznie!

### Typy wyjściowych plików:
- **MSI** - `src-tauri/target/release/bundle/msi/*.msi` (zalecane dla firm)
- **NSIS** - `src-tauri/target/release/bundle/nsis/*.exe` (zalecane, wspiera auto-update)
- **Portable** - `src-tauri/target/release/Notes Desktop.exe` (nie wymaga instalacji)

## ⚙️ Konfiguracja przed buildem

### 1. Ustaw domyślny adres serwera
Edytuj `src/main.tsx`, linia ~13:
```typescript
serverUrl: 'http://192.168.1.100:4000',  // <- zmień na adres swojego serwera
```

### 2. Zmień nazwę aplikacji (opcjonalnie)
Edytuj `src-tauri/tauri.conf.json`:
```json
"productName": "Twoja Nazwa",
"identifier": "pl.twojadomena.app"
```

### 3. Konfiguruj auto-update (opcjonalnie)
Edytuj `src-tauri/tauri.conf.json`:
```json
"updater": {
  "active": true,
  "endpoints": ["https://twoj-serwer.pl/updates/latest.json"]
}
```

Więcej w [CONFIG.md](CONFIG.md)

## 📤 Dystrybucja dla klientów

Po zbudowaniu wyślij klientom:
- **Plik .msi** lub **.exe** z folderu `bundle`
- **Instrukcję**: [INSTRUKCJA_DLA_UZYTKOWNIKA.md](INSTRUKCJA_DLA_UZYTKOWNIKA.md)
- **Adres serwera API** (jeśli nie jest predefiniowany)
- **Dane logowania** (login + hasło)

Szczegóły: [DISTRIBUTION.md](DISTRIBUTION.md)

## 🔄 Auto-update

System automatycznych aktualizacji:
1. Zbuduj nową wersję (zwiększ numer w `package.json`)
2. Skopiuj pliki z `.nsis.zip` i `.sig` na serwer
3. Zaktualizuj `/opt/notesapp/updates/latest.json`
4. Aplikacje automatycznie wykryją update

Zobacz: `/opt/notesapp/updates/README.md`

## 🎨 Funkcje aplikacji

- ✅ Logowanie użytkownika (JWT)
- ✅ Dynamiczna konfiguracja serwera
- ✅ Panel uprawnień (praca/dom)
- ✅ Powiadomienia systemowe
- ✅ Synchronizacja w czasie rzeczywistym (WebSocket)
- ✅ Auto-update
- ✅ Multi-platform (Windows, potencjalnie Linux/Mac)

## 🔒 Bezpieczeństwo

- Hasła nigdy nie są przechowywane lokalnie
- Tokeny JWT z czasem wygaśnięcia
- Połączenie z serwerem przez HTTPS (zalecane)
- Weryfikacja podpisu cyfrowego przy auto-update

## 🐛 Rozwiązywanie problemów

**"npm: command not found"**
→ Zainstaluj Node.js i zrestartuj terminal

**"rustc: command not found"**
→ Zainstaluj Rust z https://rustup.rs/

**"error: linker not found"**
→ Zainstaluj Visual Studio Build Tools

**Build trwa bardzo długo**
→ Normalne przy pierwszym buildzie (10-20 min), kolejne ~2-3 min

**Windows SmartScreen blokuje**
→ To normalne dla niepodpisanych aplikacji. Kliknij "Więcej informacji" → "Uruchom mimo to"
→ Lub podpisz certyfikatem Code Signing

Więcej: [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md#-rozwiązywanie-problemów)

## 📞 Kolejne kroki

1. ✅ **Zbuduj aplikację** - użyj `build-windows.bat`
2. ✅ **Przetestuj** - zainstaluj i sprawdź połączenie z serwerem
3. ✅ **Skonfiguruj** - ustaw domyślny adres serwera przed dystrybucją
4. 📤 **Wyślij klientom** - wraz z instrukcją
5. 🔄 **Skonfiguruj auto-update** - opcjonalnie, dla wygody

## 💡 Przydatne linki

- Tauri Docs: https://tauri.app/
- Konfiguracja bundla: https://tauri.app/v1/guides/distribution/
- Auto-updater: https://tauri.app/v1/guides/distribution/updater/

---

**Wsparcie:** Zobacz [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) lub skontaktuj się z administratorem

