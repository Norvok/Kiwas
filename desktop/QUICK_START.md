# ⚡ Szybka ściągawka - Budowanie instalatora .exe

## 🎯 Cel
Stworzyć instalator .exe dla klientów Windows, który połączy się z serwerem na Linux.

## 📋 Wymagania (instalacja jednorazowa na Windows)
1. Node.js - https://nodejs.org/
2. Rust - https://rustup.rs/
3. Visual Studio Build Tools - https://visualstudio.microsoft.com/visual-cpp-build-tools/

## 🚀 Proces (krok po kroku)

### 1️⃣ Na serwerze Linux (opcjonalnie)
```bash
cd /opt/notesapp/desktop
./prepare-build.sh
# Wpisz adres serwera, np: http://192.168.1.100:4000
```

### 2️⃣ Przenieś folder na Windows
Skopiuj cały folder `/opt/notesapp/desktop` na Windows (np. pendrive, scp, rsync)

### 3️⃣ Na Windows - uruchom build
```cmd
cd C:\gdzie-skopiowales\desktop
build-windows.bat
```

**LUB** ręcznie:
```cmd
npm install
npm run tauri:build
```

### 4️⃣ Zabierz instalatory
Znajdziesz w: `src-tauri\target\release\bundle\`
- **msi\** - plik `.msi` 
- **nsis\** - plik `.exe`

### 5️⃣ Wyślij klientom
- Plik instalatora (.msi lub .exe)
- [INSTRUKCJA_DLA_UZYTKOWNIKA.md](INSTRUKCJA_DLA_UZYTKOWNIKA.md)
- Dane logowania

## ⏱️ Czas
- Pierwsza instalacja wymagań: ~30 min
- Pierwszy build: ~15-20 min
- Kolejne buildy: ~2-3 min

## 📦 Co dostaje klient?
1. **Instalator** - jeden plik .exe lub .msi
2. **Instaluje** aplikację jak każdy program Windows
3. **Przy pierwszym uruchomieniu**:
   - Wpisuje adres serwera (jeśli nie jest predefiniowany)
   - Loguje się loginem/hasłem
4. **Gotowe** - aplikacja działa!

## 🔧 Szybka konfiguracja przed buildem

**Ustaw domyślny serwer** - edytuj `src/main.tsx`:
```typescript
serverUrl: 'http://192.168.1.100:4000',  // <- TU
```

**Zmień nazwę** - edytuj `src-tauri/tauri.conf.json`:
```json
"productName": "Twoja Aplikacja",
```

## ❓ Najczęstsze problemy

| Problem | Rozwiązanie |
|---------|-------------|
| "npm not found" | Zainstaluj Node.js i zrestartuj CMD |
| "rustc not found" | Zainstaluj Rust i zrestartuj CMD |
| "linker error" | Zainstaluj Visual Studio Build Tools |
| Build długo trwa | Normalne przy pierwszym (10-20 min) |
| Windows blokuje | "Więcej informacji" → "Uruchom mimo to" |

## 📁 Pliki pomocnicze

- `BUILD_INSTRUCTIONS.md` - Pełna instrukcja
- `CONFIG.md` - Wszystkie opcje konfiguracji
- `DISTRIBUTION.md` - Jak wysyłać klientom
- `build-windows.bat` - Automatyczny build
- `prepare-build.sh` - Przygotowanie na Linux

## 🎯 TL;DR dla doświadczonych

```cmd
# Windows:
npm install && npm run tauri:build
# Instalatory w: src-tauri/target/release/bundle/
```

---

**Potrzebujesz pomocy?** Zobacz [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)
