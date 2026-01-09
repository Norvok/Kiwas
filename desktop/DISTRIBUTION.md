# Dystrybucja aplikacji dla klientów

## 📦 Co wysłać klientowi?

**WAŻNE:** Klient NIE MUSI instalować Node.js, Rust ani żadnych narzędzi developerskich!
Te narzędzia są potrzebne tylko TOBIE do zbudowania instalatora.
Klient dostaje gotowy .exe i tylko go instaluje!

Po zbudowaniu aplikacji (po uruchomieniu `build-windows.bat` na Windows), masz do wyboru:

### Opcja 1: Instalator MSI (zalecane dla firm)
**Plik:** `src-tauri\target\release\bundle\msi\Notes Desktop_0.1.0_x64_pl-PL.msi`

**Zalety:**
- Profesjonalny instalator Windows
- Pojawia się w "Programy i funkcje"
- Łatwa dezinstalacja
- Preferowany w środowiskach korporacyjnych

**Wysyłka:**
```
Wyślij plik .msi klientowi (email, pendrive, udostępnienie)
```

### Opcja 2: Instalator NSIS (zalecane dla użytkowników końcowych)
**Plik:** `src-tauri\target\release\bundle\nsis\Notes Desktop_0.1.0_x64-setup.exe`

**Zalety:**
- Nowoczesny instalator
- Wspiera auto-update
- Mniejszy rozmiar
- Przyjazny dla użytkownika

**Wysyłka:**
```
Wyślij plik .exe klientowi
```

### Opcja 3: Wersja portable (bez instalacji)
**Plik:** `src-tauri\target\release\Notes Desktop.exe`

**Zalety:**
- Nie wymaga instalacji
- Można uruchomić z pendrive
- Idealne do testów

**Wady:**
- Wymaga WebView2 Runtime (zwykle już jest w Windows 10/11)
- Brak wpisu w Menu Start

## 👥 Instrukcja dla klienta

### Dla instalatora MSI/NSIS:

1. **Pobierz** plik instalatora
2. **Uruchom** plik (podwójne kliknięcie)
3. **Postępuj** zgodnie z instrukcjami instalatora
4. **Uruchom** aplikację z Menu Start lub skrótu na pulpicie
5. **Skonfiguruj** adres serwera przy pierwszym uruchomieniu:
   - Wpisz adres API: `http://adres-serwera:4000`
   - Zaloguj się swoim loginem i hasłem

### Dla wersji portable:

1. **Pobierz** plik `Notes Desktop.exe`
2. **Skopiuj** do wybranego folderu
3. **Uruchom** przez podwójne kliknięcie
4. **Skonfiguruj** jak wyżej

## 🔒 Ostrzeżenia Windows SmartScreen

Przy pierwszym uruchomieniu Windows może pokazać ostrzeżenie "Nieznany wydawca".

**To normalne** dla niepodpisanych aplikacji. Użytkownik musi kliknąć:
- "Więcej informacji" → "Uruchom mimo to"

### Jak tego uniknąć?
Podpisz aplikację certyfikatem Code Signing:
1. Kup certyfikat (~150-400 USD/rok) od Sectigo, DigiCert itp.
2. Zainstaluj certyfikat w Windows Certificate Store
3. Przebuduj aplikację - Tauri automatycznie podpisze

## 📋 Wymagania systemowe dla klientów

- **System:** Windows 10 (1809+) lub Windows 11
- **WebView2:** Zwykle preinstalowany, jeśli nie - automatycznie pobierze
- **Miejsce:** ~80 MB
- **Internet:** Wymagany do połączenia z serwerem API

## 🌐 Konfiguracja serwera dla klientów

Możesz przygotować **predefiniowany adres serwera** przed buildem.

**Przed buildem** edytuj `src/main.tsx`:
```typescript
serverUrl: 'http://192.168.1.100:4000',  // <- ustaw adres swojego serwera
```

Wtedy użytkownicy nie muszą go wpisywać - będzie już ustawiony.

## 📤 Sposoby dystrybucji

### 1. Email
```
Temat: Instalator aplikacji Notes & Calendar
Załącznik: Notes Desktop_0.1.0_x64-setup.exe
```

### 2. Udostępnienie w sieci lokalnej
```bash
# Na serwerze Linux
cd /opt/notesapp/desktop-builds
python3 -m http.server 8080

# Klienci pobierają przez:
http://adres-serwera:8080/Notes-Desktop_0.1.0_x64-setup.exe
```

### 3. Pendrive/USB
Skopiuj plik instalatora na pendrive i rozdaj klientom.

### 4. Własna strona do pobrania
Umieść instalator na własnej stronie WWW z instrukcją.

## 🔄 Aktualizacje

### Automatyczne (jeśli skonfigurowałeś auto-update):
- Aplikacja sprawdzi dostępność nowej wersji przy każdym uruchomieniu
- Użytkownik dostanie powiadomienie i może zaktualizować jednym kliknięciem

### Manualne:
- Wyślij klientom nowy instalator
- Odinstalują starą wersję i zainstalują nową
- LUB zainstalują nową - nadpisze starą

## 📝 Lista kontrolna przed wysłaniem

- [ ] Zbudowano aplikację na Windows (`build-windows.bat`)
- [ ] Przetestowano instalację na czystym Windows
- [ ] Przetestowano połączenie z serwerem
- [ ] Przetestowano logowanie i podstawowe funkcje
- [ ] Przygotowano instrukcję dla użytkownika
- [ ] Podano dane do logowania (jeśli trzeba założyć konta)
- [ ] Podano adres serwera API

## 🆘 Pomoc dla klientów

### Częste problemy:

**Problem:** "Nie mogę zainstalować - ostrzeżenie bezpieczeństwa"
**Rozwiązanie:** Kliknij "Więcej informacji" → "Uruchom mimo to"

**Problem:** "Nie mogę połączyć się z serwerem"
**Rozwiązanie:** 
- Sprawdź czy adres serwera jest poprawny
- Sprawdź czy serwer jest uruchomiony
- Sprawdź firewall/port forwarding

**Problem:** "Błąd logowania"
**Rozwiązanie:**
- Sprawdź login i hasło
- Sprawdź czy konto zostało utworzone na serwerze

**Problem:** "Aplikacja się nie uruchamia"
**Rozwiązanie:**
- Zainstaluj WebView2 Runtime: https://go.microsoft.com/fwlink/p/?LinkId=2124703
