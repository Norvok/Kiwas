# Instrukcja budowania instalatora .exe dla Windows

## ⚠️ WAŻNE - Przeczytaj najpierw!

**Ta instrukcja jest dla CIEBIE (administratora/developera) który buduje instalator.**

**Node.js, Rust i inne narzędzia są potrzebne TYLKO do ZBUDOWANIA instalatora!**

**Użytkownik końcowy (klient) NIE instaluje tych narzędzi!**
**Klient dostaje tylko gotowy plik .exe i go instaluje - zero dodatkowych kroków!**

---

## 🔧 Wymagania (jednorazowa instalacja NA TWOIM KOMPUTERZE)

### 1. Zainstaluj Node.js
- Pobierz: https://nodejs.org/ (wersja LTS, np. 20.x)
- Uruchom instalator i postępuj według instrukcji
- Sprawdź w CMD: `node --version` i `npm --version`

### 2. Zainstaluj Rust
- Pobierz: https://rustup.rs/
- Uruchom `rustup-init.exe` i wybierz domyślną instalację
- **WAŻNE:** Po instalacji zamknij i otwórz ponownie CMD/PowerShell
- Sprawdź: `rustc --version`

### 3. Zainstaluj Visual Studio Build Tools (dla Rust)
- Pobierz: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- Zainstaluj z opcją "Desktop development with C++"
- LUB zainstaluj pełny Visual Studio Community (darmowy)

### 4. Zainstaluj WebView2 (jeśli nie masz)
- Windows 10/11 zwykle ma to wbudowane
- Jeśli nie: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

## 📦 Budowanie instalatora .exe

**Przypomnienie:** Te kroki wykonujesz TY (admin), nie klient!

### Krok 1: Skopiuj folder `desktop` na komputer Windows
- Przenieś cały folder `/opt/notesapp/desktop` na komputer z Windows
- Np. do `C:\notesapp-desktop\`

### Krok 2: Otwórz CMD/PowerShell i przejdź do folderu
```cmd
cd C:\notesapp-desktop
```

### Krok 3: Zainstaluj zależności
```cmd
npm install
```

To potrwa kilka minut przy pierwszym uruchomieniu.

### Krok 4: (Opcjonalnie) Skonfiguruj domyślny adres serwera
Edytuj plik `src/main.tsx`, linia ~13:
```typescript
serverUrl: 'http://twoj-serwer.pl:4000',  // zmień na adres twojego serwera
```

### Krok 5: Zbuduj instalator
```cmd
npm run tauri:build
```

⏱️ **Pierwszy build może zająć 10-20 minut** (kompiluje Rust i zależności).

### Krok 6: Znajdź gotowe pliki
Po zakończeniu znajdziesz instalatory w:
```
src-tauri\target\release\bundle\
```

Dostępne formaty:
- **`msi\`** - plik `.msi` (Windows Installer - zalecany dla użytkowników)
- **`nsis\`** - plik `.exe` (NSIS installer - nowoczesny, z auto-update)

## 🚀 Dystrybucja dla klientów

### Dla normalnych użytkowników:
**Wyślij plik `.msi` lub `.exe` z folderu `nsis\`**
- Użytkownik pobiera i instaluje jak każdą inną aplikację Windows
- Aplikacja pojawi się w Menu Start jako "Notes & Calendar"

### Pierwsza konfiguracja dla użytkownika:
1. Uruchom aplikację
2. Wpisz adres serwera API (np. `http://192.168.1.100:4000` lub `https://api.twojadomena.pl`)
3. Zaloguj się swoim loginem i hasłem

## ⚙️ Dodatkowe opcje konfiguracji

### Zmiana adresu update server
Edytuj `src-tauri/tauri.conf.json`:
```json
"updater": {
  "active": true,
  "endpoints": ["https://twoj-serwer.pl/updates/latest.json"],
  "dialog": true
}
```

### Zmiana nazwy aplikacji/ikony
W `src-tauri/tauri.conf.json`:
```json
"productName": "Twoja Nazwa Aplikacji",
"identifier": "pl.twojadomena.notesapp",
```

Ikona: zamień pliki w `src-tauri/icons/`

### Wyłączenie auto-update (jeśli nie potrzebne)
W `src-tauri/tauri.conf.json`:
```json
"updater": {
  "active": false
}
```

## 🐛 Rozwiązywanie problemów

### "error: linker not found"
- Zainstaluj Visual Studio Build Tools (punkt 3 wymagań)

### "WebView2 not found"
- Zainstaluj WebView2 Runtime (punkt 4 wymagań)

### "npm: command not found"
- Zrestartuj CMD/PowerShell po instalacji Node.js

### Build trwa bardzo długo
- To normalne przy pierwszym buildzie (10-20 min)
- Kolejne buildy będą dużo szybsze (2-3 min)

### Antywirus blokuje instalator
- To normalne dla nowych, niepodpisanych aplikacji
- Rozwiązanie: podpisz certyfikatem code signing lub dodaj wyjątek

## 📋 Szybka ściągawka

```cmd
# Instalacja zależności (raz)
npm install

# Build produkcyjny
npm run tauri:build

# Test w trybie developerskim (bez budowania .exe)
npm run tauri:dev

# Rebuild po zmianach w kodzie
npm run tauri:build
```

## 🔐 Podpisywanie instalatora (opcjonalne, dla firm)

Aby użytkownicy nie widzieli ostrzeżeń Windows SmartScreen:
1. Kup certyfikat Code Signing (np. od Sectigo, DigiCert)
2. Zainstaluj certyfikat w Windows Certificate Store
3. Tauri automatycznie użyje certyfikatu podczas buildu

Koszt: ~150-400 USD/rok

## 📱 Wersja portable (bez instalacji)

Gotowy plik .exe portable znajdziesz w:
```
src-tauri\target\release\Notes Desktop.exe
```

Można go uruchomić bezpośrednio bez instalacji (ale wymaga WebView2).
